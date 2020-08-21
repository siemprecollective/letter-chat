const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'))

id_to_socketid = {}

io.on('connection', client => {
  client.on('identify', msg => {
    console.log("identify " + msg)
    id_to_socketid[msg] = client.id
    console.log(id_to_socketid)
  });
  client.on("out_msg", payload  => {
    console.log("out_msg " + payload)
    msg = JSON.parse(payload)
    io.to(id_to_socketid[msg.to]).emit('in_msg', msg.msg)
  });
  console.log(client.id);
  console.log("connected client");
});

http.listen(3000, () => {
  console.log("listening");
});
