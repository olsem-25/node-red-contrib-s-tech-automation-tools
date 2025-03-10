module.exports = function(RED) {
    function STCurtain(config) {
        const node = this;
        RED.nodes.createNode(this, config);
        const server = RED.nodes.getNode(config.wbserver); 
        const locale = config.locale ? config.locale.split('-')[0] : 'en'; // Добавлена проверка на наличие значения
        const name = config.name;
        const driver = "S-Tech tools";
        const basetopic = "/devices/";
        var openclose = 0;
        var stop = 0;
        
        const pause = 1000;

        const metaopenclose = {};
        const metastop = {};

        const ParametrsNames =  node.context().global.get("ParametrsNames");

        node.send([{ payload: 0 }, { payload: 0 }, { payload: 0 }]);

        function SetAllMeta (){
            metaopenclose.title = {"en":ParametrsNames.Curtain.openclose.en, "ru":ParametrsNames.Curtain.openclose.ru};
            metaopenclose.readonly = false;
            metaopenclose.type = "switch";
            metaopenclose.order = 1;
            metastop.title = {"en":ParametrsNames.Curtain.stop.en, "ru":ParametrsNames.Curtain.stop.ru};
            metastop.readonly = false;
            metastop.type = "pushbutton";
            metastop.order = 2;
        }

        server.on("online",()=>{
			node.status({fill:"green",shape:"dot",text:"connect"});
		});

		server.on("offline",()=>{   
			node.status({fill:"red",shape:"dot",text:"no connect"});
		});  


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
            server.publishToTopic(topic + "/controls/openclose/meta", JSON.stringify(metaopenclose), true);
            server.publishToTopic(topic + "/controls/openclose/on", openclose.toString(), true);
            server.publishToTopic(topic + "/controls/stop/meta", JSON.stringify(metastop), true);
            server.publishToTopic(topic + "/controls/stop/on", stop.toString(), true);
        }

        function WriteValuesToMQTT() {
            var topic = basetopic + name;
            server.publishToTopic(topic + "/controls/openclose", openclose.toString(), true);
            server.publishToTopic(topic + "/controls/stop", stop.toString(), true);
        }
        
        function delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        async function ClearOuts () {
            await delay(pause);
            stop = 0;
            server.publishToTopic(basetopic + name + "/controls/stop/on", stop.toString(), true);
            server.publishToTopic(basetopic + name + "/controls/stop", stop.toString(), true);
            node.send([{ payload: 0 }, { payload: 0 }, { payload: 0 }]);
        }

        this.on('input', (msg, _send, done)=>{
            const command = msg.payload;
            if (command == "open") {
                node.send([{ payload: 1 }, null, null]);
                openclose = 1;
            } else if (command == "close") {
                node.send([null, { payload: 1 }, null]);
                openclose = 0;
            } else if (command == "stop") {
                node.send([{ payload: 1 }, { payload: 1 }, { payload: 1 }]);
                stop = 1;
            } else {
                node.error("Unknown command: " + command);
                done(); return;
            }
            node.status({fill:"green",shape:"dot", text:command}); 
            WriteValuesToMQTT();
            ClearOuts();
            done();
        });

        server.mqtt.on('message', (topic, message) => {
            const topicParts = topic.split('/');
            if (topicParts[2] == name && topicParts[5] == "on") { 
                if (topicParts[4] == "openclose") {
                    openclose = message.toString(); WriteValuesToMQTT (); ClearOuts(); 
                    if ( openclose == 1 ) {
                        node.status({fill:"green",shape:"dot", text:"open"}) 
                        node.send([{ payload: 1 }, null, null]);
                    }
                    else { 
                        node.status({fill:"green",shape:"dot", text:"close"});
                        node.send([null, { payload: 1 }, null]);
                    }
                }
                if (topicParts[4] == "stop" && message == 1 ) {
                    node.send([{ payload: 1 }, { payload: 1 }, { payload: 1 }])
                    stop = 1; WriteValuesToMQTT (); ClearOuts(); 
                    node.status({fill:"green",shape:"dot", text:"stop"}); 
                }    
            }            
        });

        
        server.mqtt.subscribe(basetopic + name +"/#", function (err) {
            if (err) {
                node.error(`Ошибка подписки топик устройства ${basetopic + name +"/#"}: ${err.message}`);
            } else {
                node.log(`Успешно подписан на топик ${basetopic + name +"/#"}`);
                SetAllMeta (); 
                WriteInitialValuesToMQTT ();
            }
        });

        
    }        
    RED.nodes.registerType("Curtain", STCurtain);
}
