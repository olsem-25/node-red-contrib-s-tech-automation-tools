module.exports = function(RED) {
    function STMqttOut(config) {
        const node = this;
        RED.nodes.createNode(this, config);
        const server = RED.nodes.getNode(config.wbserver); 
        const device = config.device;
        const control = config.control;
        const command = config.command;
        const basetopic = "/devices/";
        
        server.on("online",()=>{
			node.status({fill:"green",shape:"dot",text:"connect"});
		});

		server.on("offline",()=>{   
			node.status({fill:"red",shape:"dot",text:"no connect"});
		}); 

        node.on('input', function(msg) {
            let topic = basetopic + device +"/controls/" + control;
            if (command && command.length > 0) { 
                topic += "/" + command; 
            }
            const message = msg.payload?.toString() || '';
            server.publishToTopic(topic, message, true);
            node.status({fill:"green",shape:"dot", text:message}); 
        });
         
    }        
    RED.nodes.registerType("ST-MqttOut", STMqttOut);
}
