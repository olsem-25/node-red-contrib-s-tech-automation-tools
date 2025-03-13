

module.exports = function(RED) {
    function STRegulator(config) {
        const node = this;
		RED.nodes.createNode(this, config); 
        const server = RED.nodes.getNode(config.wbserver);
        const name = config.name;
        const locale = config.locale ? config.locale.split('-')[0] : 'en'; 
        const driver = "S-Tech tools";
        const basetopic = "/devices/";
        const requestTopic = "/tmp/ST_items_list";
        const responseTopic = basetopic + name; 
        const metaenable = {};
        const metatarget = {};
        const metacurrent = {};
        const metastate = {};
        const metarelay = {};

        const ParametrsNames =  node.context().global.get("ParametrsNames");

        const upto = {};
        upto.en = " up to ";
        upto.ru = " до ";

        const to = {};
        to.en = " to ";
        to.ru = " до ";

        var InitComplete = false;  
        
        var device = {};
        device.enable = null;  
        device.target = null; 
        device.current = 0;  
        device.state = "off"; 
        device.hysteresis = config.hysteresis;
        device.relay = 0;
        device.regultype = config.regultype;  
        device.strategy = config.strategy;

        function SetAllMeta (){
            var param;
            switch (device.regultype){
                case "thermostat":
                    param = "Temperature";
                    break;
                case "hydrostat":
                    param = "Humidity";
                    break;
                default:
                    param = "Temperature";
            }
            metaenable.title = {"en":"Enable","ru":"Вкл."};
            metaenable.readonly = false;
            metaenable.type = "switch";
            metaenable.order = 1;
            metastate.title = {"en":ParametrsNames[param].state.en, "ru":ParametrsNames[param].state.ru};
            metastate.readonly = true;
            metastate.type = "text";
            metastate.order = 2;
            metacurrent.title = {"en":ParametrsNames[param].current.en, "ru":ParametrsNames[param].current.ru};
            metacurrent.readonly = true;
            metacurrent.order = 3;
            metatarget.title = {"en":ParametrsNames[param].target.en, "ru":ParametrsNames[param].target.ru};
            metatarget.min = config.min;
            metatarget.max = config.max;
            metatarget.readonly = false;
            metatarget.type = "range";
            metatarget.order = 4;           
            metarelay.title = {"en":ParametrsNames[param].relay.en, "ru":ParametrsNames[param].relay.ru};
            metarelay.readonly = true;
            metarelay.type = "switch";
            metarelay.order = 5;
            metacurrent.type = ParametrsNames[param].current.type;                    
        }
        
        server.on("online",()=>{
			node.status({fill:"green",shape:"dot",text:"connect"});
		});

		server.on("offline",()=>{   
			node.status({fill:"red",shape:"dot",text:"no connect"});
		});  


        function waitForMessage(timeout) {
            return new Promise((resolve, reject) => {
                var count = 0;
                const timer = setTimeout(() => {
                    reject(new Error('Таймаут ожидания стартового сообщения'));
                }, timeout);

                function onMessage(receivedTopic, message) {
                    const topicParts = receivedTopic.split('/');
                    if (topicParts[2] == name && topicParts.length == 5 && !(count == 2)) {                          
                        if (topicParts[4] == "target") {device.target = message.toString(); count += 1; }
                        if (topicParts[4] == "enable") {device.enable = message.toString(); count += 1; }    
                        if (count == 2) {clearTimeout(timer);} 
                    }
                }
                server.mqtt.on('message', onMessage);
            });
        }

        async function requestStartValue() {
            try {
                server.publishToTopic(requestTopic, "get_value", false);
                await waitForMessage(500); // 500 мс таймаут
            } catch (error) {
                node.error(`Ошибка: ${error.message}`);
                device.target = config.target || config.min;
                device.enable = 0;                
                node.log('Стартовое собщение не получено в течение 500 мс');
            }
        }

        function WriteInitialValuesToMQTT() {
            var topic = basetopic + name;
            var meta = {};
            meta.name = config.title;
            meta.title = {};
            meta.title.ru = config.title;
            meta.driver = driver; 
            server.publishToTopic(topic + "/meta/name", config.title, true);
            server.publishToTopic(topic + "/meta/driver", driver, true);
            server.publishToTopic(topic + "/meta", JSON.stringify(meta), true);
            server.publishToTopic(topic + "/controls/enable/meta", JSON.stringify(metaenable), true);
            server.publishToTopic(topic + "/controls/enable/on", device.enable.toString(), true);
            server.publishToTopic(topic + "/controls/target/meta", JSON.stringify(metatarget), true);
            server.publishToTopic(topic + "/controls/target/on", device.target.toString(), true);
            server.publishToTopic(topic + "/controls/current/meta", JSON.stringify(metacurrent), true);
            server.publishToTopic(topic + "/controls/state/meta", JSON.stringify(metastate), true);        
            server.publishToTopic(topic + "/controls/relay/meta", JSON.stringify(metarelay), true);
            InitComplete = true;
        }

        function WriteValuesToMQTT() {
            var topic = basetopic + name;
            var statestr = ParametrsNames.Temperature.states.idle[locale];
            if (device.strategy == "heating" && device.relay == 1 ) statestr = device.state.toString() + upto[locale] + device.target.toString() + "°C";
            if (device.strategy == "cooling" && device.relay == 1 ) statestr = device.state.toString() + to[locale] + device.target.toString() + "°C";
            if (device.strategy == "humidification" &&  device.relay == 1 ) statestr = device.state.toString() + upto[locale] + device.target.toString() + "%";
            if (device.strategy == "drying" &&  device.relay == 1 ) statestr = device.state.toString() + to[locale] + device.target.toString() + "%";
            if (device.enable == 0 ) statestr = device.state.toString();
            node.status({fill:"green",shape:"dot", text:statestr}); 
            if (config.invertrelay == true) device.relay = 1 - device.relay;
            server.publishToTopic(topic + "/controls/state", device.state.toString(), true);
            server.publishToTopic(topic + "/controls/target", device.target.toString(), true);
            server.publishToTopic(topic + "/controls/enable", device.enable.toString(), true);
            server.publishToTopic(topic + "/controls/relay", device.relay.toString(), true); 
            server.publishToTopic(topic + "/controls/current", device.current.toString(), true);
            node.send({ payload: device.relay.toString() });
        }    


        this.on('input', (msg, send, done)=>{
            if (InitComplete == false) return;
            if (typeof msg.payload != 'number'){  
			 	node.error("Неверный тип! msg.payload должен быть числом.");
			 	if (done) {done();}
			 	return;
			};

			if (msg.payload == device.current){ 
			 	node.debug("Значение не изменилось. Отмена обновления.");
			 	if (done) {done();}
			 	return;
			};
    		device.current = msg.payload;
            RegulatorLogic ()
			WriteValuesToMQTT ();
			if (done) {done();} 
		});

        function RegulatorLogic () {
            if (device.enable == 0) { device.state = ParametrsNames.Temperature.states.off[locale]; device.relay = 0; }         
            else switch (device.regultype) {
                case "thermostat":
                    if (device.strategy == "heating"){
                        if ( Number(device.current) < Number(device.target) - Number(device.hysteresis)) {
                            device.state = ParametrsNames.Temperature.states.head[locale]; device.relay = 1;                            
                            break;
                        }
                        if ( Number(device.current) > Number(device.target) + Number(device.hysteresis)) {
                            device.state = ParametrsNames.Temperature.states.idle[locale]; device.relay = 0;
                            break;
                        }
                    };
                    if (device.strategy == "cooling")
                    {
                        if (Number(device.current) > Number(device.target) + Number(device.hysteresis)) {
                            device.state = ParametrsNames.Temperature.states.cool[locale]; device.relay = 1;
                            break;
                        }
                        if (Number(device.current) < Number(device.target) - Number(device.hysteresis)) {
                            device.state = ParametrsNames.Temperature.states.idle[locale]; device.relay = 0;
                            break;
                        }
                    };
                break;
                case "hygrostat":
                    if (device.strategy == "humidification"){
                        if ( Number(device.current) < Number(device.target) - Number(device.hysteresis)) {
                            device.state = ParametrsNames.Humidity.states.humidification[locale]; device.relay = 1;                            
                            break;
                        }
                        if ( Number(device.current) > Number(device.target) + Number(device.hysteresis)) {
                            device.state = ParametrsNames.Humidity.states.idle[locale]; device.relay = 0;
                            break;
                        }
                    };
                    if (device.strategy == "drying")
                    {
                        if (Number(device.current) > Number(device.target) + Number(device.hysteresis)) {
                            device.state = ParametrsNames.Humidity.states.drying[locale]; device.relay = 1;
                            break;
                        }
                        if (Number(device.current) < Number(device.target) - Number(device.hysteresis)) {
                            device.state = ParametrsNames.Humidity.states.idle[locale]; device.relay = 0;
                            break;
                        }
                    };
                break;
            }
        }

        server.mqtt.on('message', (topic, message) => {
            if (InitComplete == false) return;
            const topicParts = topic.split('/');
            if (topicParts[2] == name && topicParts[5] == "on") { 
                if (topicParts[4] == "target") {device.target = message.toString(); RegulatorLogic (); WriteValuesToMQTT ();}
                if (topicParts[4] == "enable") {device.enable = message.toString(); RegulatorLogic (); WriteValuesToMQTT ();}    
            }            
        });
        
        server.mqtt.subscribe(basetopic + name +"/#", function (err) {
            if (err) {
                node.error(`Ошибка подписки топик устройства ${basetopic + name +"/#"}: ${err.message}`);
            } else {
                node.log(`Успешно подписан на топик ${basetopic + name +"/#"}`);
                server.topicpush(basetopic + name +"/#");
                SetAllMeta ();
                requestStartValue(); 
                const checkInitComplete = setInterval(() => {
                    if (!(device.target == null) && !(device.enable == null)) {
                        clearInterval(checkInitComplete);
                        WriteInitialValuesToMQTT();
                    }
                }, 100);    
            }
        });
    }
    RED.nodes.registerType("ST-Regulator", STRegulator);
}

