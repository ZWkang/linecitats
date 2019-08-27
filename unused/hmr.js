const EventEmitter = require("events").EventEmitter;
const WebSocket = require("ws");

class wsServer extends EventEmitter {
  constructor(opts) {
    super();
    // this.host = opts
    this.port = opts.port || 7777;
    this.wss = { clients: [] };
  }
  start() {
    this.wss = new WebSocket.Server({ port: this.port });
    this.wss.on("connection", function connection(ws) {
      ws.on("message", function incoming(message) {
        console.log("received: %s", message);
      });
    });
  }
  emitmessage(type, message) {
    this.wss.clients.forEach(ws => {
      ws.send(
        JSON.stringify({
          type,
          message
        })
      );
    });
  }
  reload(message) {
    this.emitmessage("reload", message);
  }
  updatePage(message) {
    this.emitmessage("updatePage", message);
  }
}

// const wsserver = new wsServer(8080);
module.exports = wsServer;
