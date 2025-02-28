

module.exports = function(RED) {
    function STRegulator(config) {

		RED.nodes.createNode(this, config); 
        const server = RED.nodes.getNode(config.wbserver);



    }
    RED.nodes.registerType("Regulator", STRegulator);
}

