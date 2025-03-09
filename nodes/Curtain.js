module.exports = function(RED) {
    function STCurtain(config) {
        const node = this;
        RED.nodes.createNode(this, config); 

        node.send([{ payload: 0 }, { payload: 0 }, { payload: 0 }]);
        
        function delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        this.on('input', (msg, _send, done)=>{
            const command = msg.payload;
            if (command == "open") {
                node.send([{ payload: 1 }, null, { payload: 0 }]);
            } else if (command == "close") {
                node.send([null, { payload: 1 }, { payload: 0 }]);
            } else if (command == "stop") {
                node.send([{ payload: 1 }, { payload: 1 }, { payload: 0 }]);
            } else {
                node.error("Unknown command: " + command);
            }
            SetOuts();
            done();
        });

        async function SetOuts () {
            await delay(1000); 
            node.send([{ payload: 0 }, { payload: 0 }, { payload: 0 }]);
        }

        
    }        
    RED.nodes.registerType("Curtain", STCurtain);
}
