

module.exports = function(RED) {
    function STRegulator(config) {
        const node = this;
		RED.nodes.createNode(this, config); 
        const server = RED.nodes.getNode(config.wbserver);
        
        
        const regultype = config.regultype;  
        
        
        server.on("online",()=>{
			node.status({fill:"green",shape:"dot",text:"connect"});
		});

		server.on("offline",()=>{   
			node.status({fill:"red",shape:"dot",text:"no connect"});
		});

    }
    RED.nodes.registerType("Regulator", STRegulator);
}

