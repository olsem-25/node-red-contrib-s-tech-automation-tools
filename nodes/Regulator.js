

module.exports = function(RED) {
    function STRegulator(config) {
        const node = this;
		RED.nodes.createNode(this, config); 
        const server = RED.nodes.getNode(config.wbserver);
        const name = config.name;
        
        const basetopic = "/devices/";
        
        const regultype = config.regultype;
        
        const responseTopic = "/devices/script_thermostat_1/#";
        const requestTopic = "/tmp/ST_items_list";
        
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
                    server.mqtt.removeListener('message', onMessage);
                    reject(new Error('Timeout waiting for message'));
                }, timeout);

                function onMessage(receivedTopic, message) {
                    console.log(receivedTopic + ":" + message);
                    if (receivedTopic === topic) {
                        clearTimeout(timer);
                        server.mqtt.removeListener('message', onMessage);
                        resolve(message.toString());
                    }
                }

                server.mqtt.on('message', onMessage);
            });
        }

        async function requestValue() {
            try {
                server.publishToTopic(requestTopic, "get_value");
                const message = await waitForMessage(responseTopic, 300); // 300 мс таймаут
                node.log(`Получено сообщение: ${message}`);
                node.send({ payload: message });
            } catch (error) {
                node.error(`Ошибка: ${error.message}`);
                // Код, который нужно выполнить, если сообщение не поступило
                node.log('Сообщение не поступило в течение 300 мс');
            }
        }

        requestValue();

    }
    RED.nodes.registerType("Regulator", STRegulator);
}

