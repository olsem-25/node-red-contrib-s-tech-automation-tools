var mqtt = require('mqtt');

module.exports = function (RED) {    
    function WBServerConfig(config) {
        RED.nodes.createNode(this, config);   
        var node = this;
        const id = this.id;
        this.name = config.name;
        var host = config.host;
        var port = config.mqtt_port||1883;
        var username = config.mqtt_username||null;
        var password = config.mqtt_password||null;

   
        function connectMQTT() {
            var options = {
                port: port,
                username: username,
                password: password,
                clientId:"NodeRed-"+node.id+"-"+(Math.random() + 1).toString(36).substring(7)
            };
            //node.emit("online");
            return mqtt.connect("mqtt://" + host, options);
        }
        //node.mqtt = connectMQTT();
    }

    RED.nodes.registerType("WB-MQTT-Server", WBServerConfig, {});
}
