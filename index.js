import { WebSocketServer } from "ws";
import * as fs from "fs";
import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
const wss = new WebSocketServer({ port: 8081 });
const token = "6876418179:AAGJmGY6dbAV7YYj9ldJor8tg5NyL7KHWBI";

const bot = new TelegramBot(token, {
  polling: true,
  request: {
    proxy: "http://127.0.0.1:2081",
  },
});
console.log("Telegram bot running...");
console.log("API server running...");
//updateCryptoPrice();
let users = JSON.parse(fs.readFileSync("./data/users.json", "utf8"));
let usersTemplate = fs.readFileSync("./data/users.template.json", "utf8");
let cryptos = JSON.parse(fs.readFileSync("./data/crypto.json", "utf8"));
let stats = JSON.parse(fs.readFileSync("./data/stats.json", "utf8"));
let tasks = JSON.parse(fs.readFileSync("./data/atasks.json", "utf8"));
let transactionTemplate = fs.readFileSync(
  "./data/transaction.template.json",
  "utf8"
);
let usdtPrice = 10000;
wss.on("connection", function connection(ws) {
  stats.online += 1;
  ws.on("message", function message(data) {
    let parsed = JSON.parse(data);
    /*if (parsed.name == undefined || parsed.name =='') {
      ws.send('{"message" : "Hash and Name are not present"}');
    }*/
    if (parsed.action == "login") {
      users.forEach((element) => {
        //console.log(parsed);
        if (element.name == parsed.name) {
          console.log("Users exists, logging in");
        } else {
          console.log("User does not exist, creating new user");
          if (parsed.name != null && parsed.name != "") {
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
        }
      });
    } else if (parsed.action == "getObject") {
      users.forEach((e) => {
        if (e.name == parsed.name) {
          checkIfUserDoneTask(parsed, true);
          ws.send(`{"action" : "getObject", "object": ${JSON.stringify(e)}}`);
        }
      });
    } else if (parsed.action == "getCrypto") {
      ws.send(
        `{"action" : "getCrypto", "cryptos" : ${JSON.stringify(cryptos)}}`
      );
    } else if (parsed.action == "updateCoinsFromUser") {
      users.forEach((e) => {
        if (e.name == parsed.name) {
          e.coins += Number(parsed.coins);
          console.log(`User @${e.name} now has ${e.coins} coins`);
        }
      });
      ws.send('{"action" : "updateCoinsFromUser", "result" : "success"}');
    } else if (parsed.action == "getReferalCode") {
      users.forEach((e) => {
        if (e.name == parsed.name) {
          sendReferalCodeTG(e.tgId);
        }
      });
    } else if (parsed.action == "buyCrpto") {
      for (const obj of users) {
        if (obj.name == parsed.name) {
          /*if (parsed.cointobuy == "btc") {
            let btctobuy = Number(parsed.btctobuy);
            obj.usdt -= btctobuy * cryptos[0].usdtPrice;
            obj.crypto[0].amount += btctobuy;
          } else if (parsed.cointobuy == "eth") {
            let ethtobuy = Number(parsed.ethtobuy);
            obj.usdt -= ethtobuy * cryptos[1].usdtPrice;
            obj.crypto[1].amount += ethtobuy;
          }*/
          let i = 0;
          for (const cr of cryptos) {
            if (cr.id == parsed.cointobuy) {
              let btctobuy = Number(parsed.btctobuy);
              obj.usdt -= btctobuy * cryptos[i].usdtPrice;
              obj.crypto[i].amount += btctobuy;
            }
            i++;
          }
          break;
        }
      }
    } else if (parsed.action == "logUsers") {
      console.log(users);
    } else if (parsed.action == "buyUsdt") {
      let usdttobuy = Number(parsed.usdttobuy);

      for (const obj of users) {
        if (obj.name == parsed.name) {
          let coinstouse = usddttobuy * usdtPrice;
          obj.coins -= coinstouse;
          obj.usdt += usdttobuy;
          console.log(`User @${obj.name} has bought ${newUsdt} USDT`);
          break;
        }
      }
    } else if (parsed.action == "getTasks") {
      ws.send(`{"action":"getTasks", "tasks": ${JSON.stringify(tasks)}}`);
    } else if (parsed.action == "getTaskStatus") {
      checkIfUserDoneTask(parsed);
    } else if (parsed.action == "sellCrypto") {
      for (const obj of users) {
        if (obj.name == parsed.name) {
          for (const coin of cryptos) {
            if (coin.id == parsed.cointosell) {
              let amount = Number(parsed.amounttosell);
              let usdtPrice = amount * coin.usdtPrice;
              for (const fc of obj.crypto) {
                if (fc.id == coin.id) {
                  fc.amount -= amount;
                  obj.usdt += usdtPrice;
                }
              }
            }
          }
          break;
        }
      }
    } else if (parsed.action == "upgrade") {
      for (const user of users) {
        if (user.name == parsed.name) {
          if (parsed.upgrade == "multitap") {
            switch (parsed.targetLevel) {
              case 2: {
                user.upgrades[0].level = 2;
                user.coins -= 1500;
                break;
              }
              case 3: {
                user.upgrades[0].level = 3;
                user.coins -= 3000;
              }
              case 4: {
                user.upgrades[0].level = 4;
                user.coins -= 6000;
              }
              case 5: {
                user.upgrades[0].level = 5;
                user.coins -= 15000;
              }
            }
          } else if (parsed.upgrade == "storage") {
            switch (parsed.targetLevel) {
              case 2: {
                user.upgrades[1].level = 2;
                user.coins -= 1500;
                break;
              }
              case 3: {
                user.upgrades[1].level = 3;
                user.coins -= 3000;
              }
              case 4: {
                user.upgrades[1].level = 4;
                user.coins -= 6000;
              }
              case 5: {
                user.upgrades[1].level = 5;
                user.coins -= 15000;
              }
            }
          } else if (parsed.upgrade == "recharge") {
            switch (parsed.targetLevel) {
              case 2: {
                user.upgrades[2].level = 2;
                user.coins -= 1500;
                break;
              }
              case 3: {
                user.upgrades[2].level = 3;
                user.coins -= 5000;
              }
              case 4: {
                user.upgrades[2].level = 4;
                user.coins -= 10000;
              }
              case 5: {
                user.upgrades[2].level = 5;
                user.coins -= 25000;
              }
            }
          }
        }
      }
    } else if (parsed.action == "sellUsdt") {
      for (const user of users) {
        if (user.name == parsed.name) {
          let cointoget = parsed.usdttosell * usdtPrice;
          user.usdt -= Number(parsed.usdttosell);
          user.coins += cointoget;
        }
      }
    }
  });

  ws.send('{"code": 200, "message": "connection established"}');
  ws.on("error", console.error);
});

let energyRefill = setInterval(() => {
  for (const user of users) {
    let maxEnergy = 2000;
    switch (user.upgrades[1].level) {
      case 1: {
        maxEnergy = 2000;
        break;
      }
      case 2: {
        maxEnergy = 2500;
        break;
      }
      case 3: {
        maxEnergy = 3000;
        break;
      }
      case 4: {
        maxEnergy = 4000;
        break;
      }
      case 5: {
        maxEnergy = 5000;
        break;
      }
      default: {
        maxEnergy = 2000;
        break;
      }
    }
    if (user.energy < maxEnergy) {
      user.energy += user.upgrades[2].level;
    }
  }
}, 2000);
const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();

    ws.isAlive = false;
    ws.ping();
    stats.online -= 1;
  });
}, 60000);

wss.on("close", function close() {
  clearInterval(interval);
  console.log("Closing server");
});
let cryptoSave = setInterval(() => {
  fs.writeFileSync("./data/crypto.json", JSON.stringify(cryptos));
}, 900000);
let saveInterval = setInterval(() => {
  fs.writeFileSync("./data/users.json", JSON.stringify(users));
}, 900000);
let statsSave = setInterval(() => {
  fs.writeFileSync("./data/stats.json", JSON.stringify(stats));
}, 400000);
let updateCrypto = setInterval(() => {
  updateCryptoPrice();
}, 900000);
bot.onText(/\/start (\w+)/, function (msg, match) {
  sendDefaultTGmessage(msg.chat.id);
  let isPresent = false;
  for (const obj of users) {
    if (obj.tgId == msg.chat.id) {
      bot.sendMessage(msg.chat.id, "You have already played this game");
      isPresent = true;
      break;
    }
  }
  for (const obj of users) {
    if (obj.tgId == match[1]) {
      obj.coins += 5000;
      obj.friends.push(msg.chat.id);
      bot.sendMessage(
        msg.chat.id,
        `You were invited by @${obj.name}, and you both recieved 5000 coins.`
      );
      bot.sendMessage(
        obj.tgId,
        `<<@${msg.chat.username}>> accepted your invite and you both recieved 5000 coins!`
      );
      break;
    }
  }
  if (!isPresent) {
    let newUser = JSON.parse(usersTemplate);
    console.log(newUser);
    newUser.name = msg.chat.username;
    newUser.hash = "TOBEFILLED";
    newUser.tgId = msg.chat.id;
    newUser.coins = 5000;
    users.push(newUser);
    console.log(users);
  }
});
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
});

function sendDefaultTGmessage(chatId) {
  bot.sendMessage(
    chatId,
    "Welcome to Andcoin!\nClick the 'Play' button to start playing!"
  );
}
function sendReferalCodeTG(chatId) {
  bot.sendMessage(
    chatId,
    `You can send this link to your friends to invite them to this bot: \nhttps://t.me/andcoin_bot?start=${chatId}`
  );
}
async function checkUserJoinedMainTG(userId) {
  let doesUserExit = false;
  bot
    .getChatMember("@andcoino", userId)
    .then((chat) => {
      if (
        chat.status === "member" ||
        chat.status === "administrator" ||
        chat.status === "creator"
      ) {
        console.log(`${chat.user.username} is a member of the channel`);
        doesUserExit = true;
      }
    })
    .catch((e) => {
      doesUserExit = false;
    });
  return doesUserExit;
}
function checkUserJoinedMainGC(userId) {
  let doesUserExit = false;
  bot
    .getChatMember("@andcoin_community", userId)
    .then((chat) => {
      if (
        chat.status === "member" ||
        chat.status === "administrator" ||
        chat.status === "creator"
      ) {
        console.log(`${chat.user.username} is a member of the group`);
        doesUserExit = true;
      }
    })
    .catch((e) => {
      doesUserExit = false;
    });
  return doesUserExit;
}
function checkIfUserDoneTask(parsed, loop) {
  let loop1 = loop ? true : false;
  if (loop1) {
    for (const user of users) {
      if (user.name == parsed.name) {
        for (const task of tasks) {
          let taskId = task.taskId;
          if (taskId == 0) {
            if (checkUserJoinedMainTG(user.tgId)) {
              user.completedTasks.push(taskId);
              user.coins += task.reward;
              return true;
            }
          } else if (taskId == 1) {
            if (checkUserJoinedMainGC(user.tgId)) {
              user.completedTasks.push(taskId);
              user.coins += task.reward;
              return true;
            }
          }
        }

        break;
      }
    }
  } else {
    for (const user of users) {
      if (user.name == parsed.name) {
        if (parsed.taskId == 0) {
          if (checkUserJoinedMainTG(user.tgId)) {
            user.completedTasks.push(parsed.taskId);
            user.coins += tasks[0].reward;
            return true;
          }
        } else if (parsed.taskId == 1) {
          if (checkUserJoinedMainGC(user.tgId)) {
            user.completedTasks.push(parsed.taskId);
            user.coins += tasks[1].reward;
            return true;
          }
        }

        break;
      }
    }
  }
  return false;
}
async function updateCryptoPrice() {
  let config = {
    method: "get",
    url: "https://api.coinlore.net/api/tickers/",
    headers: {},
  };
  let data = {};
  axios
    .request(config)
    .then(async (response) => {
      data = response.data;

      for (const coin of data.data) {
        if (coin.symbol == "BTC") {
          cryptos[0].growthRate = calculateGrowthRate(
            cryptos[0].usdtPrice,
            Math.floor(Number(coin.price_usd))
          );
          cryptos[0].usdtPrice = Math.floor(Number(coin.price_usd));
        } else if (coin.symbol == "ETH") {
          cryptos[1].growthRate = calculateGrowthRate(
            cryptos[1].usdtPrice,
            Math.floor(Number(coin.price_usd))
          );
          cryptos[1].usdtPrice = Math.floor(Number(coin.price_usd));
        } else if (coin.symbol == "TON") {
          cryptos[2].growthRate = calculateGrowthRate(
            cryptos[2].usdtPrice,
            Math.floor(Number(coin.price_usd))
          );
          cryptos[2].usdtPrice = Math.floor(Number(coin.price_usd));
        } else if (coin.symbol == "TRX") {
          cryptos[3].growthRate = calculateGrowthRate(
            cryptos[3].usdtPrice,
            Number(coin.price_usd)
          );
          cryptos[3].usdtPrice = Number(coin.price_usd);
        } else if (coin.symbol == "DOGE") {
          cryptos[4].growthRate = calculateGrowthRate(
            cryptos[4].usdtPrice,
            Number(coin.price_usd)
          );
          cryptos[4].usdtPrice = Number(coin.price_usd);
        }
      }
    })
    .catch((error) => {
      console.log(error);
    });
}
function calculateGrowthRate(oldPrice, newPrice) {
  var growthRate = ((newPrice - oldPrice) / oldPrice) * 100;
  return growthRate.toFixed(2);
}
