import WebSocket  from "ws";

/*const ws = new WebSocket('wss://and.hamii.xyz:8081');

ws.on('error', console.error);

ws.on('open', function open() {
  ws.send('ping');
});

ws.on('message', function message(data) {
  console.log('received: %s', data);
});*/
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
const ws2 = new WebSocket('wss://127.0.0.1:8081');
ws2.on('error', console.error);

ws2.on('open', function open() {
  ws2.send('ping');
});

ws2.on('message', function message(data) {
  console.log('received: %s', data);
});