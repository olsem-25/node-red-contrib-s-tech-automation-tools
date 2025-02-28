

module.exports = function(RED) {
    function Regulator(config) {
		const pjson = require('../package.json');
		
		RED.nodes.createNode(this, config); 

        const server = RED.nodes.getNode(config.server);
    }
    RED.nodes.registerType("ST-Regulator", Regulator);
}

