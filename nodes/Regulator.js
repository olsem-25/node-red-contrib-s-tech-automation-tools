

module.exports = function(RED) {
    function STRegulator(config) {
        const node = this;
		RED.nodes.createNode(this, config); 
        const server = RED.nodes.getNode(config.wbserver);
        
        
        const type = config.type;  
        
        
        server.on("online",()=>{
			node.status({fill:"green",shape:"dot",text:"online"});
		});

		server.on("offline",()=>{   
			node.status({fill:"red",shape:"dot",text:"offline"});
		});

    }
    RED.nodes.registerType("Regulator", STRegulator);
}

