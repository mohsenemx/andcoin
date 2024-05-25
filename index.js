import { WebSocketServer } from "ws";
import * as fs from "fs";
import TelegramBot from "node-telegram-bot-api";
import axios from "axios";

const wss = new WebSocketServer({ port: 8081 });
const token = fs.readFileSync("./token", "utf8");

const bot = new TelegramBot(token, {
  polling: true,
  request: {
    proxy: "http://127.0.0.1:2081",
  },
});
var startDate = new Date();
let start = `${startDate.getFullYear()}-${startDate.getMonth()}-${startDate.getDate()} ${startDate.getHours()}:${startDate
  .getMinutes()
  .toString()
  .padStart(2, "0")}`;
console.log(`[${start}] Starting...`);
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
      for (const element of users) {
        //console.log(parsed);
        if (element.tgId == parsed.tgId) {
          console.log("Users exists, logging in");
          break;
        } else {
          console.log("User does not exist, creating new user");

          if (parsed.tgId != undefined && parsed.tgId.trim() != "") {
            let newUser = JSON.parse(usersTemplate);
            console.log(newUser);
            newUser.name = parsed.name;
            newUser.tgId = parsed.tgId;
            stats.totalUsers += 1;
            users.push(newUser);
            ws.send('{ "action" : "createAccount", "result" : "success" }');
            break;
          } else {
            ws.send('{"action" : "createAccount", "result" : "fail"}');
            break;
          }
        }
      }
    } else if (parsed.action == "getObject") {
      for (const user of users) {
        if (user.tgId == parsed.tgId) {
          checkIfUserDoneTask(parsed, true);
          ws.send(
            `{"action" : "getObject", "object": ${JSON.stringify(user)}}`
          );
          break;
        }
      }
    } else if (parsed.action == "getCrypto") {
      ws.send(
        `{"action" : "getCrypto", "cryptos" : ${JSON.stringify(cryptos)}}`
      );
    } else if (parsed.action == "updateCoinsFromUser") {
      for (const user of users) {
        if (user.tgId == parsed.tgId) {
          user.coins += Number(parsed.coins);
          stats.minedPastHour += Number(parsed.coins);
          stats.allCoinsClicked += Number(parsed.coins);
        }
      }

      ws.send('{"action" : "updateCoinsFromUser", "result" : "success"}');
    } else if (parsed.action == "getReferalCode") {
      for (const user of users) {
        if (user.tgId == parsed.tgId) {
          sendReferalCodeTG(user.tgId);
          break;
        }
      }
    } else if (parsed.action == "buyCrpto") {
      for (const obj of users) {
        if (obj.tgid == parsed.tgId) {
          let i = 0;
          for (const cr of cryptos) {
            if (cr.id == parsed.cointobuy) {
              ws.send(
                `{"action" : "getObject", "object": ${JSON.stringify(obj)}}`
              );
              let cryptotobuy = Number(parsed.cryptotobuy);
              obj.usdt -= cryptotobuy * cryptos[i].usdtPrice;
              obj.crypto[i].amount += cryptotobuy;
            }
            i++;
          }
          break;
        }
      }
    } else if (parsed.action == "logUsers") {
      ws.send(JSON.stringify(users));
      console.log(users);
    } else if (parsed.action == "buyUsdt") {
      let usdttobuy = Number(parsed.usdttobuy);

      for (const obj of users) {
        if (obj.tgid == parsed.tgId) {
          let coinstouse = usdttobuy * usdtPrice;
          obj.coins -= coinstouse;
          obj.usdt += usdttobuy;
          let trns = transactionTemplate;
          trns.type = "buyCrypto";
          trns.from = "Cnetral Hub";
          trns.to = `${obj.name}`;
          trns.crypto = "usdt";
          trns.amount = usdttobuy;
          var transactionDate = new Date();
          let trnsTime = `${transactionDate.getFullYear()}-${transactionDate.getMonth()}-${transactionDate.getDate()} ${transactionDate.getHours()}:${transactionDate
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;
          trns.timestamp = trnsTime;
          obj.transactionHistory.push(trns);
          console.log(`User ${obj.tgId} has bought ${newUsdt} USDT`);
          break;
        }
      }
    } else if (parsed.action == "getTasks") {
      ws.send(`{"action":"getTasks", "tasks": ${JSON.stringify(tasks)}}`);
    } else if (parsed.action == "getTaskStatus") {
      checkIfUserDoneTask(parsed);
    } else if (parsed.action == "sellCrypto") {
      for (const obj of users) {
        if (obj.tgid == parsed.tgId) {
          for (const coin of cryptos) {
            if (coin.id == parsed.cointosell) {
              let amount = Number(parsed.amounttosell);

              let usdtPrice = amount * coin.usdtPrice;
              for (const fc of obj.crypto) {
                if (fc.id == coin.id) {
                  console.log(
                    `@${obj.name} has ${fc.amount} of ${fc.id} and wants to sell ${amount}`
                  );
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
      console.log(`User wants to upgrade ${JSON.stringify(parsed)}`);
      for (const user of users) {
        if (user.name == parsed.name) {
          if (parsed.upgrade == "multitap") {
            switch (Number(parsed.targetLevel)) {
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
                user.maxEnergy = 3000;
                user.coins -= 1500;
                break;
              }
              case 3: {
                user.upgrades[1].level = 3;
                user.maxEnergy = 3500;
                user.coins -= 3000;
              }
              case 4: {
                user.upgrades[1].level = 4;
                user.maxEnergy = 4000;
                user.coins -= 6000;
              }
              case 5: {
                user.upgrades[1].level = 5;
                user.maxEnergy = 5000;
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
        if (user.tgid == parsed.tgId) {
          let cointoget = parsed.usdttosell * usdtPrice;
          user.usdt -= Number(parsed.usdttosell);
          user.coins += cointoget;
          break;
        }
      }
    } else if (parsed.action == "updateEnergy") {
      for (const user of users) {
        if (user.tgId == parsed.tgId) {
          user.energy = Number(parsed.energy);
          break;
        }
      }
    } else if (parsed.action == "getUsdtPrice") {
      ws.send(`{"action": "getUsdtPrice", "price":"${usdtPrice}"}`);
    } else if (parsed.action == "getFriends") {
      for (const user of users) {
        if (user.tgId == parsed.tgId) {
          let friends = [];
          for (const friend of user.friends) {
            for (const us of users) {
              if (us.tgId == friend) {
                friends.push(us);
              }
            }
          }
          ws.send(
            `{"action":"getFriends","friends": ${JSON.stringify(friends)}}`
          );
          break;
        }
      }
    }
  });

  ws.send('{"code": 200, "message": "connection established"}');
  ws.on("error", console.error);
  ws.on("pong", heartbeat);
});

let energyRefill = setInterval(() => {
  for (const user of users) {
    if (user.energy < user.maxEnergy) {
      user.energy += user.upgrades[2].level;
    }
  }
}, 1000);
const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();

    ws.isAlive = false;
    ws.ping();
    stats.online -= 1;
  });
}, 10000);

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
      bot.sendMessage(
        msg.chat.id,
        "You have already started the bot, and cannot be invited again."
      );
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
    stats.totalUsers += 1;
    newUser.name = msg.chat.username;
    newUser.hash = "TOBEFILLED";
    newUser.tgId = msg.chat.id;
    newUser.coins = 5000;
    users.push(newUser);
  }
});
bot.on("message", (msg) => {
  if (msg.text == "/stats" && msg.chat.title == "AndCoin DevChat") {
    bot.sendMessage(
      msg.chat.id,
      `Bot online since: ${start}\nOnline users: ${stats.online}\nMined Past Hour: ${stats.minedPastHour}\nTotal Users: ${stats.totalUsers}\nTotal Coin Clicks: ${stats.allCoinsClicked}`
    );
  }
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
      if (user.tgid == parsed.tgId) {
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
function heartbeat() {
  this.isAlive = true;
}
