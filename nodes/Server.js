var mqtt = require('mqtt');

module.exports = function (RED) {
    
    function WBServerConfig(config) {
            RED.nodes.createNode(this, config);   
            var node = this;
            const id = this.id;
            this.name = config.name;
    }
    RED.nodes.registerType("WB-Server", WBServerConfig, {});
}
