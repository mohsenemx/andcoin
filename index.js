import { WebSocketServer } from 'ws';
import * as fs from 'fs';
const wss = new WebSocketServer({ port: 8080,  });
console.log('Listening on ws://localhost:8080/connection');
let users = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));
wss.on('connection', function connection(ws) {
  ws.on('message', function message(data) {
    let parsed = JSON.parse(data);
    if (parsed.action == 'login') {
      //console.log('Test');
      users.forEach(element => {
        if (element.hash == parsed.hash) {
          console.log('Users exists, logging in');
        } else {
          console.log('User does not exist, creating new user');
        }
      });
    }
    //console.log(data);
  });

  ws.send('{code: 200, message: \'connection established\'}');
  ws.on('error', console.error);
});
const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();

    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', function close() {
  clearInterval(interval);
});