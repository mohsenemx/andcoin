import { WebSocketServer } from 'ws';
import { fs } from 'fs';
const wss = new WebSocketServer({ port: 8080,  });
console.log('Listening on ws://localhost:8080/connection');
wss.on('connection', function connection(ws) {
  ws.on('message', function message(data) {
    console.log(data);
  });

  ws.send('{code: 200, message: \'connection established\'}');
});