var mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');

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
        var topics = [];

        global.Flow_MQTT_Server_loaded = false;

        node.context().global.set("ParametrsNames", JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'parameters.json'), 'utf8')));

        node.topicpush = (topic) =>{ topics.push(topic); }

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

        node.publishToTopic = (topic, message, retain) => {
            node.mqtt.publish(topic, message, {retain: retain}, function (err) {
                if (err) node.error(`Ошибка публикации в топик ${topic}: ${err.message}`);
            });
        };

        node.subscribeToTopic = (topic) => {
            return new Promise((resolve, reject) => {
                node.mqtt.subscribe(topic, function (err) {
                    if (err) {
                    node.error(`Ошибка подписки на топик ${topic}: ${err.message}`);
                    reject(err);
                    } else {
                    node.topicpush(topic);
                    node.log('Успешная подписка на MQTT топик: ' + topic);
                    resolve("sucsess");
                    }
                });
            });
        }
        

        function unsubscribeMQTT() {
            return new Promise((resolve, reject) => {
                let unsubscribePromises = topics.map((topic) => {
                    return new Promise((res, rej) => {
                        node.mqtt.unsubscribe(topic, function (err) {
                            if (err) {
                                node.error(`Ошибка отписки от топика ${topic}: ${err.message}`);
                                rej(err);
                            } else {
                                node.log('Успешная отписка от MQTT топика: ' + topic);
                                res();
                            }
                        });
                    });
                });
                Promise.all(unsubscribePromises)
                    .then(() => resolve())
                    .catch((err) => reject(err));
            });
        }

        node.on('close', async (done) => {
            try {
                await unsubscribeMQTT();
                node.mqtt.end();
                node.emit('onClose');
                node.log('MQTT connection closed');
                done();
            } catch (err) {
                node.error('Ошибка при закрытии узла: ' + err.message);
                done();
            }
        });

        const intrvl = setInterval(() => {
            if (node.mqtt.connected == true){
                setTimeout ( function () { global.Flow_MQTT_Server_loaded = true}, 0);
                clearInterval(intrvl);
            }
		}, 50)
    }
    RED.nodes.registerType("WB-MQTT-Server", WBServerConfig, {});
}
