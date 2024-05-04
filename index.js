import { WebSocketServer } from "ws";
import * as fs from "fs";
//const TelegramBot = require('node-telegram-bot-api');
import TelegramBot from 'node-telegram-bot-api'
const wss = new WebSocketServer({ port: 8081 });
const token = '6876418179:AAGJmGY6dbAV7YYj9ldJor8tg5NyL7KHWBI';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true , request: {
  proxy: "http://127.0.0.1:2081",
},},);
console.log('Telegram bot running...');
console.log("API server running...");
let users = JSON.parse(fs.readFileSync("./data/users.json", "utf8"));
let usersTemplate = fs.readFileSync("./data/users.template.json", "utf8");
let cryptos = JSON.parse(fs.readFileSync("./data/crypto.json", "utf8"));


wss.on("connection", function connection(ws) {
  console.log("New client connected");
  ws.on("message", function message(data) {
    let parsed = JSON.parse(data);
    /*if (parsed.name == undefined || parsed.name =='') {
      ws.send('{"message" : "Hash and Name are not present"}');
    }*/
    if (parsed.action == "login") {
      users.forEach((element) => {
        if (element.hash == parsed.hash) {
          console.log("Users exists, logging in");
        } else if (element.hash == "TOBEFILLED" && element.name == parsed.name) {
          console.log("Users exists, but has no hash, logging in");
          element.hash = parsed.hash;
        }
        else {
          console.log("User does not exist, creating new user");
          if (
            parsed.name != null &&
            parsed.name != "" &&
            parsed.hash != null &&
            parsed.hash != ""
          ) {
            let newUser = JSON.parse(usersTemplate);
            console.log(newUser);
            newUser.name = parsed.name;
            newUser.hash = parsed.hash;
            newUser.tgId = parsed.tgId;
            users.push(newUser);
            ws.send('{ "action" : "createAccount", "result" : "success" }');
          } else {
            ws.send('{"action" : "createAccount", "result" : "fail"}');
          }
          console.log(users);
        }
      });
    } else if (parsed.action == "getObject") {
      users.forEach((e) => {
        if (e.hash == parsed.hash) {
          ws.send(`{"action" : "getObject", "object": "${JSON.stringify(e)}"}`);
        }
      });
    } else if (parsed.action == "getCryptoPrice") {
      ws.send(`{"action" : "getCryptoPrice", "prices" : "${JSON.stringify(cryptos)}"}`);
    } else if (parsed.action == "updateCoinsFromUser") {
      users.forEach((e) => {
        if (e.hash == parsed.hash) {
          e.coins += parsed.coins;
          console.log(`User @${e.name} now has ${e.coins} coins`);
        }
      });
      ws.send('{"action" : "updateCoinsFromUser", "result" : "success"}');
    } else if (parsed.action == "getReferalCode") {
      
      users.forEach((e) => {
        if (e.hash == parsed.hash) {
          sendReferalCodeTG(e.tgId);
        }
      });
    } else if (parsed.action == 'buyCrpto') {
      // TO BE ADDED IN FUTURE

    } else if (parsed.action == 'logUsers') {
      console.log(users);
    }      
  });

  ws.send('{"code": 200, "message": "connection established"}');
  ws.on("error", console.error);
});



const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();

    ws.isAlive = false;
    ws.ping();
  });
}, 60000);

wss.on("close", function close() {
  clearInterval(interval);
  console.log('Closing server');
});
/*
{"action" : "getObject", "object": "{"name":"Mohsen","hash":"6584d5007f7f1b632dd8cf7e864484f8666b982442e555d109eac287bec371b1","tgId":"5540738710","coins":0,"usdt":0,"villageId":null,"crypto":[{"name":"BTC","amount":0.0001}],"upgrades":[{"name":"multitap","level":1},{"name":"storage","level":1}],"friends":[],"completedTasks":[],"transactionsHistory":[]}"}
*/
let cryptoSave = setInterval(() => {
  fs.writeFileSync("./data/crypto.json", JSON.stringify(cryptos));
},900000);
let saveInterval = setInterval(() => {
  fs.writeFileSync("./data/users.json", JSON.stringify(users));
}, 900000);
bot.onText(/\/start (\w+)/, function (msg, match) {
  let isPresent  = false;
  for (const obj of users) {
    if (obj.tgId == msg.chat.id) {
      bot.sendMessage(msg.chat.id, 'You have already played this game');
      isPresent = true;
      break;
    }
  }
  for (const obj of users) {
    if (obj.tgId == match[1]) {
      obj.friends.push(msg.chat.id);
    }
  }
  if (!isPresent) {
    let newUser = JSON.parse(usersTemplate);
    console.log(newUser);
    newUser.name = msg.chat.username;
    newUser.hash = "TOBEFILLED";
    newUser.tgId = msg.chat.id;
    users.push(newUser);
  }

});
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  
  // send a message to the chat acknowledging receipt of their message
  sendDefaultTGmessage(chatId);
  //bot.sendMessage(chatId, 'Got your message!');
});

function sendDefaultTGmessage(chatId) {
  bot.sendMessage(chatId, 'Welcome to Andcoin!');
}
function sendReferalCodeTG(chatId) {
  bot.sendMessage(chatId, `You can send this link to your friends to invite them to this bot: \nhttps://t.me/andcoin_bot?start=${chatId}`);
}