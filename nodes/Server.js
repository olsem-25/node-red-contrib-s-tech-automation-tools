var mqtt = require('mqtt');

module.exports = function (RED) {
    
    function WBServer(config) {
           
            RED.nodes.createNode(this, n);
            var node = this;
            const id = this.id;
            this.name = config.name;


        function connectMQTT() {
                var node = this;
                var options = {
                port: node.config.mqtt_port||1883,
                username: node.config.mqtt_username||null,
                password: node.config.mqtt_password||null,
                clientId:"ST-Regulators-"+node.id+"-"+(Math.random() + 1).toString(36).substring(7)
            };
            return mqtt.connect('mqtt://' + node.config.host, options);
        }

        function subscribeMQTT() {
            var node = this;
            node.mqtt.subscribe(node.topic, function (err) {
                if (err) {
                    node.warn('MQTT Error: Subscribe to "' + node.topic);
                    node.emit('onConnectError', err);
                } else {
                    node.log('MQTT Subscribed to: "' + node.topic);
                    node.getChannels();
                }
            })
        }

        function unsubscribeMQTT() {
            var node = this;
            node.log('MQTT Unsubscribe from mqtt topic: ' + node.topic);
            node.mqtt.unsubscribe(node.topic, function (err) {});
            node.devices = {};
        }

        function onMQTTConnect() {
            var node = this;
            node.connection = true;
            node.log('MQTT Connected');
            node.emit('onMQTTConnect');
            node.subscribeMQTT();
        }

        function onMQTTDisconnect(error) {
            node.log('MQTT Disconnected, Error:' + error);
            console.log('MQTT Disconnected, Error:' + error);
        }

    }
    RED.nodes.registerType("WB-Server", WBServer, {});
}
