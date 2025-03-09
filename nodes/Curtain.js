module.exports = function(RED) {
    function STCurtain(config) {
        const node = this;
		RED.nodes.createNode(this, config); 
        const server = RED.nodes.getNode(config.wbserver);
        const name = config.name;


    }
    RED.nodes.registerType("Curtain", STCurtain);
}
