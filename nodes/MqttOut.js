module.exports = function(RED) {
    function STMqttOut(config) {
        const node = this;
        RED.nodes.createNode(this, config);
        const server = RED.nodes.getNode(config.wbserver); 
        const device = config.device;
        const cntrls = config.controls ? config.controls.split(',') : []; 
        const command = config.command;
        const basetopic = "/devices/";
        
        const controls = cntrls.map((cn) => { return cn.trim(); });

        function CurrentDateTime ()
        {
            let DT = ' [' + new Date().toLocaleDateString(locale) + ' ' + new Date().toLocaleTimeString(locale) + ']'; 
            return DT.toString();
        }

        server.on("online",()=>{
			node.status({fill:"green",shape:"dot",text:"connect"});
		});

		server.on("offline",()=>{   
			node.status({fill:"red",shape:"dot",text:"no connect"});
		}); 

        node.on('input', function(msg) {
            controls.forEach(control => {
                let topic = basetopic + device +"/controls/" + control;
                if (command && command.length > 0) { 
                    topic += "/" + command; 
                }
                const message = msg.payload?.toString() || '';
                server.publishToTopic(topic, message, true);
                node.status({fill:"green",shape:"dot", text:message.toString() + CurrentDateTime()}); 
            });
        });
         
    }        
    RED.nodes.registerType("ST-MqttOut", STMqttOut);
}
