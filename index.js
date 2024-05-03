import { WebSocketServer } from 'ws';
import * as fs from 'fs';
const wss = new WebSocketServer({ port: 8081 });
console.log('Listening on ws://localhost:8080/connection');
let users = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));
let usersTemplate = fs.readFileSync('./data/users.template.json', 'utf8');
let saveInterval = setInterval(() => {
  fs.writeFileSync('./data/users.json', JSON.stringify(users));
}, 900000);
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
          if ((parsed.name != null && parsed.name != '') && (parsed.hash != null && parsed.hash != '')) {
            let newUser = JSON.parse(usersTemplate);
            /*let newUser = {
              name: 'g',
              hash: 's',
              tgId: 'g'
            }*/
            console.log(newUser);
            newUser.name = parsed.name;
            newUser.hash = parsed.hash;
            newUser.tgId = parsed.tgId;
            users.push(newUser);
            ws.send('{ "action" : "createAccount", "result" : "successful" }');
          } else {
            ws.send('{"action" : "createAccount", "result" : "failed"}');
          }
          console.log(users);
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
}, 60000);

wss.on('close', function close() {
  clearInterval(interval);
});