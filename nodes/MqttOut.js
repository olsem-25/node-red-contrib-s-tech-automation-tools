module.exports = function(RED) {
    function STMqttOut(config) {
        const node = this;
        RED.nodes.createNode(this, config);
        const server = RED.nodes.getNode(config.wbserver); 
        const locale = config.locale ? config.locale.split('-')[0] : 'en'; 
        const name = config.name;
        const driver = "S-Tech tools";
        const basetopic = "/devices/";
        

    }        
    RED.nodes.registerType("ST-MQTT-Out", STMqttOut);
}
