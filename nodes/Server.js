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
        var client;

   
        function connectMQTT() {
            var options = {
                port: port,
                username: username,
                password: password,
                clientId:"NodeRed-"+node.id+"-"+(Math.random() + 1).toString(36).substring(7)
            };
            
            client = mqtt.connect("mqtt://" + host, options);
            
            client.on('error', function (error) {
                node.emit("offline");
            });
            client.on('close', function () {
                node.emit("offline");
            });
            client.on('connect', function () {
                node.emit("online");
            });
        
            return client;
        }
        node.mqtt = connectMQTT();

        node.publishToTopic = (topic, message) => {
            node.mqtt.publish(topic, message, function (err) {
                if (err) {
                    node.error(`Ошибка публикации в топик ${topic}: ${err.message}`);
                } else {
                    node.log(`Сообщение опубликовано в топик ${topic}`);
                }
            });
        };

        node.subscribeToTopic = (topic) => {
                
            node.mqtt.subscribe(topic, function (err) {
                if (err) {
                    node.error(`Ошибка подписки на топик ${topic}: ${err.message}`);
                } else {
                    node.log(`Успешно подписан на топик ${topic}`);
                }
            });
                    
            
        }

        // node.mqtt.on('message', function (topic, message) {
        //     node.log(`Получено сообщение с топика ${topic}: ${message.toString()}`);
        //     // Здесь можно добавить обработку полученного сообщения
        // });
        
        // Пример использования функции подписки
        //subscribeToTopics(['topic1', 'topic2']);
    }

    RED.nodes.registerType("WB-MQTT-Server", WBServerConfig, {});
}
