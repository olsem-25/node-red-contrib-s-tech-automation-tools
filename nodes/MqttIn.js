module.exports = function(RED) {
    function STMqttIn(config) {
        const node = this;
        RED.nodes.createNode(this, config);
        const server = RED.nodes.getNode(config.wbserver); 
        const device = config.device;
        const control = config.control;
        const startsend = config.startsend;
        const filter = config.filter;
        const locale = config.locale
        const basetopic = "/devices/";
        const requestTopic = "/tmp/ST_items_list";
        let LastMessage = null;

        let stsnd = false;
        
        function CurrentDateTime ()
        {
            let DT = ' [' + new Date().toLocaleDateString(locale) + ' ' + new Date().toLocaleTimeString(locale) + ']'; 
            return DT.toString();
        }
        server.on("online",()=>{
			node.status({fill:"green",shape:"dot",text:"connect" + CurrentDateTime()});
		});

		server.on("offline",()=>{   
			node.status({fill:"red",shape:"dot",text:"no connect"  + CurrentDateTime()});
		}); 

        server.mqtt.on('message', (topic, message) => {
            const topicParts = topic.split('/');
            if ( topicParts.length == 5 && topicParts[2] == device && topicParts[4] == control ) { 
                if (startsend == false && stsnd == false && filter == true ) { 
                    stsnd = true;
                    LastMessage = message.toString();
                    }  
                if (startsend == true && stsnd == false) {
                    stsnd = true;
                    LastMessage = message.toString();
                    node.send({ payload: message.toString() });
                    node.status({fill:"green",shape:"dot", text:message.toString() + CurrentDateTime()});
                    return; 
                }
                else{
                    if (filter == true && message.toString() == LastMessage) {return;}
                    else{ 
                        LastMessage = message.toString();
                        node.send({ payload: message.toString() });
                        node.status({fill:"green",shape:"dot", text:message.toString() + CurrentDateTime()});
                    }
                } 
            }
        });


        async function requestStartValue() {
            try {
                server.publishToTopic(requestTopic, "get_value", false);
            } catch (error) {
                node.error(`Ошибка: ${error.message}`);
            }
        }

        const intrvl = setInterval(() => {
			if (global.Flow_MQTT_Server_loaded === true){
				server.mqtt.subscribe(basetopic + device +"/controls/" + control  +"/#", function (err) {
                    if (err) {
                        node.error(`Ошибка подписки топик устройства ${basetopic + device +"/control/" + control  +"/#"}: ${err.message}`);
                    } else {
                        node.log(`Успешно подписан на топик ${basetopic + device +"/control/" + control  +"/#"}`);
                        server.topicpush(basetopic + device +"/control/" + control  +"/#");
                        if (startsend == true ) { requestStartValue(); }
                    }
                });        
				clearInterval(intrvl);
			}	
		}, 50)	
        
    }        
    RED.nodes.registerType("ST-MqttIn", STMqttIn);
}
