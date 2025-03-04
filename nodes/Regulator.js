

module.exports = function(RED) {
    function STRegulator(config) {
        const node = this;
		RED.nodes.createNode(this, config); 
        const server = RED.nodes.getNode(config.wbserver);
        const name = config.name;
        
        const driver = "S-Tech tools"
        //const name = "script_thermostat_1";

        const basetopic = "/devices/";
        
        const regultype = config.regultype;
        
        const responseTopic = "/devices/script_thermostat_1/#";
        const requestTopic = "/tmp/ST_items_list";

        const metaenable = {};

        var device = {};

        
        //device.regultype = regultype;
        //device.topic = basetopic + name;
        //device.title = config.title;
        //device.type = config.regultype;
        //device.strategy = config.strategy;  
        device.enable = null;  
        device.target = null; 
        //device.min = config.min;
        //device.max = config.max;
        device.current = 0;  
        device.state = "off"; 
        device.hysteresis = config.hysteresis;

        function SetAllMeta ()
        {
            metaenable.title = {};
            metaenable.title.en = "Enable";
            metaenable.title.ru = "Вкл.";
            metaenable.readonly = false,
            metaenable.type = "switch",
            metaenable.order = 10
        }
        
        function clearObject(obj) {
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    delete obj[key];
                }
            }
        }

        // function stringToUnicode(str) {
        //     let unicodeStr = '';
        //     for (let i = 0; i < str.length; i++) {
        //         let code = str.charCodeAt(i);
        //         unicodeStr += '\\u' + code.toString(16).padStart(4, '0');
        //     }
        //     return unicodeStr;
        // }
        
        server.on("online",()=>{
			node.status({fill:"green",shape:"dot",text:"connect"});
		});

		server.on("offline",()=>{   
			node.status({fill:"red",shape:"dot",text:"no connect"});
		});

        //var stopic = topic+name;
        

        //server.subscribeToTopic( basetopic + name +"/#" );
        server.subscribeToTopic( responseTopic );


        function waitForMessage(topic, timeout) {
            return new Promise((resolve, reject) => {
                const timer = setTimeout(() => {
                    //server.mqtt.removeListener('message', onMessage);
                    reject(new Error('Timeout waiting for start message'));
                }, timeout);

                function onMessage(receivedTopic, message) {
                    const topicParts = receivedTopic.split('/');
                    if (topicParts[2] == name) { 
                        clearTimeout(timer);
                        if (topicParts[4] == "target") {device.target = message.toString();}
                        if (topicParts[4] == "enable") {device.enable = message.toString();}    
                        if (!(device.target == null) && !(device.enable == null)) resolve(message.toString());
                    }
                    //server.mqtt.removeListener('message', onMessage);
                }
                server.mqtt.on('message', onMessage);
            });
        }

        async function requestStartValue() {
            try {
                server.publishToTopic(requestTopic, "get_value");
                const message = await waitForMessage(responseTopic, 300); // 300 мс таймаут
                //node.send({ payload: message });
            } catch (error) {
                node.error(`Ошибка: ${error.message}`);
                device.target = config.target || config.min;
                device.enable = 0;                
                //node.log('Сообщение не поступило в течение 300 мс');
            }
        }

       


        function WriteToMQTT(){
            var topic = basetopic + name;
            var meta = {};
            meta.name = config.title;
            meta.title = {};
            meta.title.ru = config.title;
            meta.driver = driver; 
            console.log (device.enable); 
            server.publishToTopic( topic + "/meta/name", config.title);
            server.publishToTopic( topic + "/meta", JSON.stringify(meta));
            server.publishToTopic( topic + "/controls/enable/meta", JSON.stringify(metaenable));
            server.publishToTopic( topic + "/controls/enable", device.enable.toString());

            // clearObject(meta);
            // for (let key in device) {
            //     if (device.hasOwnProperty(key)) {
            //         topic = basetopic + name + "/controls/" + 
            //     }
            // }
        }

        //node.log (topic + "meta/name");
        //node.log (config.title);

        function delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        async function main() {
            await requestStartValue();
            await delay(500); // Приостановка выполнения на 500 мс
            WriteToMQTT ();
        }

        SetAllMeta ();
        main();
        
    }
    RED.nodes.registerType("Regulator", STRegulator);
}

