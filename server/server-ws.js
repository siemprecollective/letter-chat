const WebSocket = require('ws');
const wss = new WebSocket.Server({port: 3000})

id_to_socket = {}

wss.on("connection", client => {
  console.log("connected client");
  client.on("message", payload => {
    console.log(payload)
    dec = JSON.parse(payload);
    evt = dec.event
    to = dec.to
    data = dec.data
    if (evt == "identify") {
      console.log("identify " + data);
      id_to_socket[data] = client;
      console.log(id_to_socket);
    } else {
      payload = JSON.stringify({
        event: evt,
        data: data
      })
      id_to_socket[to].send(payload);
    }
  });
});


