var mqtt = require('mqtt');

module.exports = function (RED) {    
    function WBServerConfig(config) {
        RED.nodes.createNode(this, config);   
        var node = this;
        const id = this.id;
        this.name = config.name;
   
        function connectMQTT() {
            var node = this;
            var options = {
                port: node.config.mqtt_port||1883,
                username: node.config.mqtt_username||null,
                password: node.config.mqtt_password||null,
                clientId:"NodeRed-"+node.id+"-"+(Math.random() + 1).toString(36).substring(7)
            };
            node.emit("online");
            return mqtt.connect('mqtt://' + node.config.host, options);
        }
        node.mqtt = connectMQTT();
    }

    RED.nodes.registerType("WB-MQTT-Server", WBServerConfig, {});
}
