

module.exports = function(RED) {
    function STRegulator(config) {
		const pjson = require('../package.json');
		
		RED.nodes.createNode(this, config); 

        const server = RED.nodes.getNode(config.server);
    }
    RED.nodes.registerType("Regulator", STRegulator);
}

