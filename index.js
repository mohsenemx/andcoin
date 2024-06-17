import { WebSocketServer } from "ws";
import { createServer } from 'https';
import * as fs from "fs";
import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import 'dotenv/config';
const server = createServer({
  cert: fs.readFileSync(process.env.PATH_TO_CERT),
  key: fs.readFileSync(process.env.PATH_TO_KEY)
});
const wss = new WebSocketServer({ server });
const token = process.env.BOT_TOKEN;
let proxy;
if (process.env.USE_PROXY == 'true') {
  proxy = {
    proxy: process.env.PROXY_ADDRESS,
  }
} else {
  proxy = {
    proxy: false,
  }
}
const bot = new TelegramBot(token, {
  polling: true,
  request: proxy,
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
    if (parsed.action == "login") {
      for (const element of users) {
        //console.log(parsed);
        if (element.tgId == parsed.tgId) {
          console.log("Users exists, logging in");
          element.lastOnline = new Date().getTime();
          break;
        } else {
          console.log("User does not exist, creating new user");

          if (parsed.tgId != undefined && parsed.tgId.trim() != "") {
            let newUser = JSON.parse(usersTemplate);
            console.log(newUser);
            newUser.name = parsed.name.toLowerCase();
            newUser.tgId = parsed.tgId;
            stats.totalUsers += 1;
            element.joined = new Date().getTime();
            element.lastOnline = new Date().getTime();

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
        if (obj.tgId == parsed.tgId) {
          let coinstouse = usdttobuy * usdtPrice;
          obj.coins -= coinstouse;
          obj.usdt += usdttobuy;
          let trns = JSON.parse(transactionTemplate);
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
          console.log(`User ${obj.tgId} has bought ${usdttobuy} USDT`);
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
        if (user.tgId == parsed.tgId) {
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
                break;
              }
              case 4: {
                user.upgrades[0].level = 4;
                user.coins -= 6000;
                break;
              }
              case 5: {
                user.upgrades[0].level = 5;
                user.coins -= 15000;
                break;
              }
            }
          } else if (parsed.upgrade == "storage") {
            switch (Number(parsed.targetLevel)) {
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
                break;
              }
              case 4: {
                user.upgrades[1].level = 4;
                user.maxEnergy = 4000;
                user.coins -= 6000;
                break;
              }
              case 5: {
                user.upgrades[1].level = 5;
                user.maxEnergy = 5000;
                user.coins -= 15000;
                break;
              }
              default: {
                break;
              }
            }
          } else if (parsed.upgrade == "recharge") {
            switch (Number(parsed.targetLevel)) {
              case 2: {
                user.upgrades[2].level = 2;
                user.coins -= 1500;
                break;
              }
              case 3: {
                user.upgrades[2].level = 3;
                user.coins -= 5000;
                break;
              }
              case 4: {
                user.upgrades[2].level = 4;
                user.coins -= 10000;
                break;
              }
              case 5: {
                user.upgrades[2].level = 5;
                user.coins -= 25000;
                break;
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
  if (msg.chat.type == "group") {
    bot.sendMessage(
      msg.chat.id,
      `
    Hey @${msg.sender_chat.username}! It's AndCoin! 🌟 all the cool coins and tokens, right in your pocket!📱

Now we're rolling out our Telegram mini app! Start farming points now 🚀

Don't forget to collect your points. We look forward to seeing you on the app. 🌼

Have friends? Invite them! The more, the merrier! 👯
    `
    );
  } else {
    sendDefaultTGmessage(msg.chat.id);
  }

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
    newUser.name = msg.chat.username.toLowerCase();
    newUser.tgId = msg.chat.id;
    newUser.coins = 5000;
    newUser.joined = new Date().getTime();
    users.push(newUser);
  }
});
bot.on("message", (msg) => {
  if (msg.text == "/stats" && msg.chat.title == "AndCoin DevChat") {
    bot.sendMessage(
      msg.chat.id,
      `Bot online since: ${start}\nOnline users: ${stats.online}\nMined Past Hour: ${stats.minedPastHour}\nTotal Users: ${stats.totalUsers}\nTotal Coin Clicks: ${stats.allCoinsClicked}`
    );
  } else if (msg.text == "/start" || msg.text == "/start@AndCoin_bot") {
    if (msg.chat.type == "group" || msg.chat.type == "supergroup") {
      const opts = {
        reply_markup: {
          resize_keyboard: true,
          inline_keyboard: [
            [
              {
                text: "Play",
                url: "https://t.me/AndCoin_bot/webapp",
              },
            ],
            [
              {
                text: "Learn how to play",
                callback_data: "howtoplay",
              },
            ],
            [
              {
                text: "Invite friends",
                callback_data: "invitefriends",
              },
            ],
          ],
        },
      };
      bot.sendMessage(
        msg.chat.id,
        `
      Hey @${msg.sender_chat.username}! It's AndCoin! 🌟 all the cool coins and tokens, right in your pocket!📱
  
  Now we're rolling out our Telegram mini app! Start farming points now 🚀
  
  Don't forget to collect your points. We look forward to seeing you on the app. 🌼
  
  Have friends? Invite them! The more, the merrier! 👯
      `,
        opts
      );
    } else {
      sendDefaultTGmessage(msg.chat.id);
    }
  }
  if (msg.text.includes("/profile")) {
    let arg = msg.text.split(" ");
    let tUsername = false;
    let foundUser = false;
    console.log(arg);
    try {
      if (arg[1] != undefined || arg[1].trim() != "") {
        tUsername = arg[1].slice(1).toLowerCase();
      }
    } catch (e) {
      tUsername = false;
      foundUser = true;
    }
    for (const user of users) {
      if (tUsername != false) {
        if (user.name == tUsername) {
          let dd = new Date(user.joined);
          bot.sendMessage(
            msg.chat.id,
            `💎 User Profile\nName: @${user.name}\nCoins: ${numberWithCommas(
              user.coins
            )}\nCoins All Time: ${numberWithCommas(
              user.allCoins
            )}\nUSDT: ${numberWithCommas(
              user.usdt
            )}\nJoined on: ${dd.getFullYear()}-${
              dd.getMonth() + 1
            }-${dd.getDate()}`
          );
          foundUser = true;
          break;
        }
      } else {
        if (user.tgId == msg.from.id) {
          let dd = new Date(user.joined);
          bot.sendMessage(
            msg.chat.id,
            `💎 User Profile\nName: @${user.name}\nCoins: ${numberWithCommas(
              user.coins
            )}\nCoins All Time: ${numberWithCommas(
              user.allCoins
            )}\nUSDT: ${numberWithCommas(
              user.usdt
            )}\nJoined on: ${dd.getFullYear()}-${
              dd.getMonth() + 1
            }-${dd.getDate()}`
          );
        }
        break;
      }
    }
    if (!foundUser) {
      bot.sendMessage(msg.chat.id, `User @${tUsername} was not found`);
    }
  }
  if (msg.text.includes("/howtoplay")) {
    howtoplay(msg.chat.id, msg.message_id);
  }
});

function sendDefaultTGmessage(chatId) {
  const opts = {
    reply_markup: {
      resize_keyboard: true,
      inline_keyboard: [
        [
          {
            text: "Play",
            web_app: { url: "https://and.hamii.xyz" },
          },
        ],
        [
          {
            text: "Learn how to play",
            callback_data: "howtoplay",
          },
        ],
        [
          {
            text: "Invite friends",
            callback_data: "invitefriends",
          },
        ],
      ],
    },
  };
  bot.sendMessage(
    chatId,
    `
    Hey! It's AndCoin! 🌟 all the cool coins and tokens, right in your pocket!📱

Now we're rolling out our Telegram mini app! Start farming points now 🚀

Don't forget to collect your points. We look forward to seeing you on the app. 🌼

Have friends? Invite them! The more, the merrier! 👯
    `,
    opts
  );
}
function sendReferalCodeTG(chatId) {
  bot.sendMessage(
    chatId,
    `You can send this link to your friends to invite them to this bot: \nhttps://t.me/andcoin_bot?start=${chatId}`
  );
}
bot.on("callback_query", (callbackQuery) => {
  const action = callbackQuery.data;
  const msg = callbackQuery.message;
  if (action == "invitefriends") {
    if (msg.chat.type == "supergroup" || msg.chat.type == "group") {
      /*bot.sendMessage(
        msg.chat.id,
        `You can send this link to your friends to invite them to this bot: \nhttps://t.me/andcoin_bot?start=${msg.from.id}`
      );*/
      bot.editMessageText(
        `
      You can send this link to your friends to invite them to this bot: \nhttps://t.me/andcoin_bot?start=${msg.sender_chat.id}
      `,
        {
          chat_id: msg.chat.id,
          message_id: msg.message_id,
        }
      );
    } else {
      bot.editMessageText(
        `
      You can send this link to your friends to invite them to this bot: \nhttps://t.me/andcoin_bot?start=${msg.sender_chat.id}
      `,
        {
          chat_id: msg.chat.id,
          message_id: msg.message_id,
        }
      );
    }
  } else if (action == "howtoplay") {
    bot.editMessageText(howtoplayText, {
      chat_id: msg.chat.id,
      message_id: msg.message_id,
      parse_mode: "html",
    });
  }
});
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
      if (user.tgId == parsed.tgId) {
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
      if (user.tgId == parsed.tgId) {
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
function numberWithCommas(x) {
  return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}
let howtoplayText = `
<b>AndCoin</b> is a free play to earn game that you can earn <code>$AND</code> in.

<b>Here are some tips so you earn more <code>$AND</code>:</b>
<b>1.</b> Trading is one of most important part of this game. So, by doing good trades, you can earn a good amount of <code>$AND</code>.
Prices represent real-life prices, but the trades have no real-life value and is just a virtural trading.

<b>2.</b> Inviting Friends: Other important aspect of AndCoin is having a large friend group.

<b>3.</b> Upgrading: Upgrading (also known as boosting) is the option for you to pay some <code>$AND</code> to upgrade your storage or your farming speed that help you earn more <code>$AND</code> in the long run.
`;
function howtoplay(chatId, replyId) {
  bot.sendMessage(chatId, howtoplayText, {
    parse_mode: "html",
    reply_to_message_id: replyId,
  });
}
server.listen(8081);