import WebSocket  from "ws";

const ws = new WebSocket('wss://and.hamii.xyz:8081');

ws.on('error', console.error);

ws.on('open', function open() {
  ws.send('ping');
});

ws.on('message', function message(data) {
  console.log('received: %s', data);
});