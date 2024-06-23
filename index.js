import { WebSocketServer } from "ws";
import { createServer } from "https";
import * as fs from "fs";
import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import "dotenv/config";
const server = createServer({
  cert: fs.readFileSync(process.env.PATH_TO_CERT),
  key: fs.readFileSync(process.env.PATH_TO_KEY),
});
let wssConf;
if (process.env.USE_SSL == "true") {
  wssConf = { server };
} else {
  wssConf = { port: 8081 };
}

const wss = new WebSocketServer(wssConf);
const token = process.env.BOT_TOKEN;
let proxy;
if (process.env.USE_PROXY == "true") {
  proxy = {
    proxy: process.env.PROXY_ADDRESS,
  };
} else {
  proxy = {
    proxy: false,
  };
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
updateCryptoPrice();
console.log("Updating crypto prices...");
console.log("API server running...");

let users = JSON.parse(fs.readFileSync("./data/users.json", "utf8"));
let usersTemplate = fs.readFileSync("./data/users.template.json", "utf8");
let cryptos = JSON.parse(fs.readFileSync("./data/crypto.json", "utf8"));
let stats = JSON.parse(fs.readFileSync("./data/stats.json", "utf8"));
let tasks = JSON.parse(fs.readFileSync("./data/atasks.json", "utf8"));
let transactionTemplate = fs.readFileSync(
  "./data/transaction.template.json",
  "utf8"
);
let usdtPrice = 1000;
wss.on("connection", function connection(ws) {
  stats.online += 1;
  ws.on("message", function message(data) {
    let parsed = JSON.parse(data);
    if (parsed.action == "login") {
      const userExists = users.some((obj) => obj.tgId == parsed.tgId);
      if (userExists) {
        for (const user of users) {
          if (user.tgId == parsed.tgId) {
            console.log(`User @${user.name} (${user.tgId}) logged in`);
            user.lastOnline = new Date().getTime();
            ws.send(
              `{"action" : "getObject", "object": ${JSON.stringify(user)}}`
            );

            break;
          }
        }
      } else {
        let newUser = JSON.parse(usersTemplate);
        newUser.name = parsed.name.toLowerCase();
        newUser.tgId = parsed.tgId;
        newUser.fullname = parsed.fullname;
        stats.totalUsers += 1;
        newUser.joined = new Date().getTime();
        newUser.lastOnline = new Date().getTime();
        users.push(newUser);
        ws.send('{ "action" : "createAccount", "result" : "success" }');
        for (const user of users) {
          if (user.tgId == newUser.tgId) {
            ws.send(
              `{"action" : "getObject", "object": ${JSON.stringify(user)}}`
            );
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
          user.allCoins += Number(parsed.coins);
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
    } else if (parsed.action == "buyCrypto") {
      for (const obj of users) {
        if (obj.tgId == parsed.tgId) {
          console.log(JSON.stringify(parsed));
          let cointopay = getCryptoObject(parsed.cointopay);
          let cointobuy = getCryptoObject(parsed.cointobuy);
          let amount = Number(parsed.amount);
          if (cointobuy.id == "AND") {
            if (cointopay.id == "USDT") {
              let coinstoget = amount * usdtPrice;
              obj.coins += coinstoget;
              obj.usdt -= amount;
            } else {
              let coinstoget = amount * cointopay.usdtPrice * usdtPrice;
              obj.coins += coinstoget;
              for (const cr of obj.crypto) {
                if (cr.id == cointopay.id) {
                  cr.amount -= amount;
                }
              }
            }
          } else if (cointobuy.id == "USDT") {
            if (cointopay.id == "AND") {
              let usdtoget = amount / usdtPrice;
              obj.coins -= amount;
              obj.usdt += usdtoget;
            } else {
              let coinstoget = amount * cointopay.usdtPrice;
              obj.usdt += coinstoget;
              for (const cr of obj.crypto) {
                if (cr.id == cointopay.id) {
                  cr.amount -= amount;
                }
              }
            }
          } else {
            if (parsed.cointopay == "AND") {
              let mny = amount / usdtPrice / cointobuy.usdtPrice;
              obj.coins -= amount;
              for (const cr of obj.crypto) {
                if (cr.id == cointobuy.id) {
                  cr.amount += mny;
                }
              }
            } else if (parsed.cointopay == "USDT") {
              let mny = amount / cointobuy.usdtPrice;
              obj.usdt -= amount;
              for (const cr of obj.crypto) {
                if (cr.id == cointobuy.id) {
                  cr.amount += mny;
                }
              }
            } else {
              let worthInUsdt = amount * cointopay.usdtPrice;
              let mny = worthInUsdt / cointobuy.usdtPrice;
              for (const cr of obj.crypto) {
                if (cr.id == cointobuy.id) {
                  cr.amount += mny;
                }
                if (cr.id == cointopay.id) {
                  cr.amount -= amount;
                }
              }
            }
          }

          break;
        }
      }
    } else if (parsed.action == "logUsers") {
      ws.send(JSON.stringify(users));
      console.log(users);
    } else if (parsed.action == "getTasks") {
      ws.send(`{"action":"getTasks", "tasks": ${JSON.stringify(tasks)}}`);
    } else if (parsed.action == "getTaskStatus") {
      checkIfUserDoneTask(parsed);
    } else if (parsed.action == "upgrade") {
      for (const user of users) {
        if (user.tgId == parsed.tgId) {
          if (parsed.upgrade == "storage") {
            switch (Number(parsed.targetLevel)) {
              case 2: {
                user.upgrades[0].level = 2;
                user.maxEnergy = 3000;
                user.coins -= 1500;
                break;
              }
              case 3: {
                user.upgrades[0].level = 3;
                user.maxEnergy = 3500;
                user.coins -= 3000;
                break;
              }
              case 4: {
                user.upgrades[0].level = 4;
                user.maxEnergy = 4000;
                user.coins -= 6000;
                break;
              }
              case 5: {
                user.upgrades[0].level = 5;
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
                user.upgrades[1].level = 2;
                user.coins -= 1500;
                break;
              }
              case 3: {
                user.upgrades[1].level = 3;
                user.coins -= 5000;
                break;
              }
              case 4: {
                user.upgrades[1].level = 4;
                user.coins -= 10000;
                break;
              }
              case 5: {
                user.upgrades[1].level = 5;
                user.coins -= 25000;
                break;
              }
            }
          }
        }
      }
    }else if (parsed.action == "getUsdtPrice") {
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
    } else if (parsed.action == "startFarming") {
      for (const user of users) {
        if (user.tgId == parsed.tgId) {
          break;
        }
      }
    } else if (parsed.action == "claimed") {
      for (const user of users) {
        if (user.tgId == parsed.tgId) {
          user.lastClaimed = Number(parsed.time);
          let usrLevel = user.upgrades[1].level;
          if (usrLevel == 1) {
            user.coins += 2500;
            user.allCoins += 2500;
          stats.minedPastHour += 2500;
          stats.allCoinsClicked += 200;
          } else if (usrLevel == 2) {
            user.coins += 5000;
            user.allCoins += 5000;
          stats.minedPastHour += 5000;
          stats.allCoinsClicked += 5000;
          } else if (usrLevel == 3) {
            user.coins += 10000;
            user.allCoins += 10000;
          stats.minedPastHour += 10000;
          stats.allCoinsClicked += 10000;
          } else if (usrLevel == 4) {
            user.coins += 20000;
            user.allCoins += 20000;
          stats.minedPastHour += 20000;
          stats.allCoinsClicked += 20000;
          } else if (usrLevel == 5) {
            user.coins += 40000;
            user.allCoins += 40000;
          stats.minedPastHour += 40000;
          stats.allCoinsClicked += 40000;
          }
          break;
        }
        ws.send(`{"action" : "getObject", "object": ${JSON.stringify(user)}}`);
      }
    }
  });

  ws.send('{"code": 200, "message": "connection established"}');
  ws.on("error", console.error);
  ws.on("pong", heartbeat);
});

const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) {
      stats.online -= 1;
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
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
let hourlyBackup = setInterval(() => {
  performBackup();
}, 3600000);
function performBackup() {
  const currentUtcTime = new Date();
  const offsetHours = +3.5;
  const localTime = new Date(
    currentUtcTime.setHours(currentUtcTime.getHours() + offsetHours)
  );
  let backupTime = localTime.toISOString();
  bot.sendDocument(-1002205721312, "./data/users.json", {
    caption: `users.json @ ${backupTime}`,
  });
  bot.sendDocument(-1002205721312, "./data/stats.json", {
    caption: `stats.json @ ${backupTime}`,
  });
  bot.sendDocument(-1002205721312, "./data/crypto.json", {
    caption: `crypto.json @ ${backupTime}`,
  });
}
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
    newUser.fullname = msg.chat.first_name + " " + msg.chat.last_name;
    newUser.coins = 5000;
    newUser.joined = new Date().getTime();
    users.push(newUser);
  }
});
bot.on("message", (msg) => {
  if (msg.text == "/stats" && msg.chat.title == "AndCoin DevChat") {
    bot.sendMessage(
      msg.chat.id,
      `Bot online since: ${start}\nOnline users: ${stats.online}\nMined Past Hour: ${stats.minedPastHour}\nTotal Users: ${stats.totalUsers}\nTotal Coins: ${stats.allCoinsClicked}`
    );
  } else if (msg.text == "/logUsers" && msg.chat.title == "AndCoin DevChat") {
    bot.sendMessage(msg.chat.id, JSON.stringify(users));
  }
  else if (msg.text == "/start" || msg.text == "/start@AndCoin_bot") {
    if (msg.chat.type == "group" || msg.chat.type == "supergroup") {
      const opts = {
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
      };
      bot.sendPhoto(chatId, "./assets/b1.jpg", {
        caption: `
        Hey @${msg.sender_chat.username}! It's AndCoin! 🌟 all the cool coins and tokens, right in your pocket!📱
    
    Now we're rolling out our Telegram mini app! Start farming points now 🚀
    
    Don't forget to collect your points. We look forward to seeing you on the app. 🌼
    
    Have friends? Invite them! The more, the merrier! 👯
        `,
        reply_markup: opts,
        parse_mode: "HTML",
      });
    } else {
      sendDefaultTGmessage(msg.chat.id);
    }
  }
  if (msg.text.includes("/profile")) {
    let arg = msg.text.split(" ");
    let tUsername = false;
    let foundUser = false;
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
  };
  bot.sendPhoto(chatId, "./assets/b1.jpg", {
    caption: `
    Hey! It's AndCoin! 🌟 all the cool coins and tokens, right in your pocket!📱

Now we're rolling out our Telegram mini app! Start farming points now 🚀

Don't forget to collect your points. We look forward to seeing you on the app. 🌼

Have friends? Invite them! The more, the merrier! 👯
    `,
    reply_markup: opts,
    parse_mode: "HTML",
  });
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
      You can send this link to your friends to invite them to this bot: \nhttps://t.me/andcoin_bot?start=${msg.chat.id}
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
          cryptos[0].priceHistory.push(Math.floor(Number(coin.price_usd)));
        } else if (coin.symbol == "ETH") {
          cryptos[1].growthRate = calculateGrowthRate(
            cryptos[1].usdtPrice,
            Math.floor(Number(coin.price_usd))
          );
          cryptos[1].usdtPrice = Math.floor(Number(coin.price_usd));
          cryptos[1].priceHistory.push(Math.floor(Number(coin.price_usd)));
        } else if (coin.symbol == "TON") {
          cryptos[2].growthRate = calculateGrowthRate(
            cryptos[2].usdtPrice,
            Math.floor(Number(coin.price_usd))
          );

          cryptos[2].usdtPrice = Number(coin.price_usd);
          cryptos[2].priceHistory.push(Number(coin.price_usd));
        } else if (coin.symbol == "TRX") {
          cryptos[3].growthRate = calculateGrowthRate(
            cryptos[3].usdtPrice,
            Number(coin.price_usd)
          );
          cryptos[3].usdtPrice = Number(coin.price_usd);
          cryptos[3].priceHistory.push(Number(coin.price_usd));
        } else if (coin.symbol == "DOGE") {
          cryptos[4].growthRate = calculateGrowthRate(
            cryptos[4].usdtPrice,
            Number(coin.price_usd)
          );
          cryptos[4].usdtPrice = Number(coin.price_usd);
          cryptos[4].priceHistory.push(Number(coin.price_usd));
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
if (process.env.USE_SSL != "false") {
  server.listen(8081, () => {
    console.log("WebSocket server listening on port 8081");
  });
}
function getCryptoObject(id) {
  for (const crypto of cryptos) {
    if (crypto.id == id) {
      return crypto;
    }
  }
}
