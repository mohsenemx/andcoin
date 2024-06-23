if (typeof Telegram == "undefined") {
  showError("TGE-22");
}
let userObject;
let user = parseQuery(Telegram.WebApp.initData);
user = user.user;
let coins = 0;
let upgrades = [];
let balance = document.getElementById("amount");
let farmingButton = document.getElementById("farm");
let farmText = document.getElementById("startFarming");
let farmProgress = document.getElementById("earnBackground");
let tasks = [];
let cryptos = [];
let friends = [];
let usdtPrice = 1000;
const socket = new WebSocket(config.SERVER_ADDRESS);
setTimeout(() => {
  if (typeof userObject == "undefined") {
    showError("DVE-33");
  }
}, 1500);
function init() {
  if (Telegram.WebApp.platform == "unknown") {
    showError("TGE-21");
    return;
  }
  socket.send(
    `{"action":"login", "name": "${user.username}", "tgId": "${user.id}", "fullname":"${user.first_name} ${user.last_name}"}`
  );
  socket.send(`{"action":"getObject", "tgId": "${user.id}"}`);
  socket.send(`{"action":"getTasks"}`);
  socket.send(`{"action":"getCrypto"}`);
  socket.send(`{"action":"getUsdtPrice"}`);
  socket.send(`{"action":"getFriends","tgId":"${user.id}"}`);
}
socket.onopen = function () {
  init();
};
socket.onmessage = function (event) {
  let pjson = JSON.parse(event.data);
  handleMessage(pjson);
};
socket.onclose = function (event) {
  showError("WSE-01");
};
socket.onerror = function (event) {
  showError("WSE-02");
};
function handleMessage(object) {
  if (object.action == "createAccount") {
    if (object.result == "failed") {
      showError('ACE-1');
    }
  }
  if (object.action == "getObject") {
    userObject = object.object;
    upgrades = userObject.upgrades;
    coins = userObject.coins;
    balance.innerHTML = numberWithCommas(coins);
  } else if (object.action == "getTasks") {
    tasks = object.tasks;
  } else if (object.action == "getCrypto") {
    cryptos = object.cryptos;
  } else if (object.action == "getUsdtPrice") {
    usdtPrice = Number(object.price);
  } else if (object.action == "getFriends") {
    friends = object.friends;
  }
}
let sync = setInterval(() => {
  performSync();
  updateEverything();
}, 3000);
function performSync() {
  socket.send(`{"action":"getObject", "tgId":"${user.id}"}`);
  socket.send(`{"action":"getTasks", "tgId": "${user.id}"}`);
}
farmingButton.addEventListener("click", () => {
  startFarming();
});
function startFarming() {
  let now = Number(new Date().getTime());
  if (
    now - Number(userObject.lastClaimed) > 10800000 ||
    Number(userObject.lastClaimed == 0)
  ) {
    userObject.lastClaimed = now;
    socket.send(
      `{"action":"startFarming", "tgId":"${user.id}", "time":"${now}"}`
    );
  }
}
function upgradeBoost(name) {
  let upgradeName = name.getAttribute("data-name");
  if (upgradeName == "storage") {
    if (userObject.upgrades[0].level == 1) {
      if (userObject.coins < 1500) {
        showBoostError("You don't have enough coins for this upgrade!");
        return;
      } else {
        socket.send(
          `{"action":"upgrade","tgId":"${
            user.id
          }","upgrade":"storage","targetLevel":"${
            userObject.upgrades[0].level + 1
          }"}`
        );
        updateEverything();
      }
    } else if (userObject.upgrades[0].level == 2) {
      if (userObject.coins < 3000) {
        showBoostError("You don't have enough coins for this upgrade!");
        return;
      } else {
        socket.send(
          `{"action":"upgrade","tgId":"${
            user.id
          }","upgrade":"storage","targetLevel":"${
            userObject.upgrades[0].level + 1
          }"}`
        );
        updateEverything();
      }
    } else if (userObject.upgrades[0].level == 3) {
      if (userObject.coins < 6000) {
        showBoostError("You don't have enough coins for this upgrade!");
        return;
      } else {
        socket.send(
          `{"action":"upgrade","tgId":"${
            user.id
          }","upgrade":"storage","targetLevel":"${
            userObject.upgrades[0].level + 1
          }"}`
        );
        updateEverything();
      }
    } else if (userObject.upgrades[0].level == 4) {
      if (userObject.coins < 15000) {
        showBoostError("You don't have enough coins for this upgrade!");
        return;
      } else {
        socket.send(
          `{"action":"upgrade","tgId":"${
            user.id
          }","upgrade":"storage","targetLevel":"${
            userObject.upgrades[0].level + 1
          }"}`
        );
        updateEverything();
      }
    }
  } else if (upgradeName == "recharge") {
    if (userObject.upgrades[1].level == 1) {
      if (userObject.coins < 1500) {
        showBoostError("You don't have enough coins for this upgrade!");
        return;
      } else {
        socket.send(
          `{"action":"upgrade","tgId":"${
            user.id
          }","upgrade":"recharge","targetLevel":"${
            userObject.upgrades[1].level + 1
          }"}`
        );
        updateEverything();
      }
    } else if (userObject.upgrades[1].level == 2) {
      if (userObject.coins < 5000) {
        showBoostError("You don't have enough coins for this upgrade!");
        return;
      } else {
        socket.send(
          `{"action":"upgrade","tgId":"${
            user.id
          }","upgrade":"recharge","targetLevel":"${
            userObject.upgrades[1].level + 1
          }"}`
        );
        updateEverything();
      }
    } else if (userObject.upgrades[1].level == 3) {
      if (userObject.coins < 10000) {
        showBoostError("You don't have enough coins for this upgrade!");
        return;
      } else {
        socket.send(
          `{"action":"upgrade","tgId":"${
            user.id
          }","upgrade":"recharge","targetLevel":"${
            userObject.upgrades[1].level + 1
          }"}`
        );
        updateEverything();
      }
    } else if (userObject.upgrades[1].level == 4) {
      if (userObject.coins < 25000) {
        showBoostError("You don't have enough coins for this upgrade!");
        return;
      } else {
        socket.send(
          `{"action":"upgrade","tgId":"${
            user.id
          }","upgrade":"recharge","targetLevel":"${
            userObject.upgrades[1].level + 1
          }"}`
        );
        updateEverything();
      }
    } else {
      socket.send(
        `{"action":"upgrade","tgId":"${
          user.id
        }","upgrade":"recharge","targetLevel":"${
          userObject.upgrades[1].level + 1
        }"}`
      );
      updateEverything();
    }
  }
}
function updateBoost() {
  let storageButton = document.getElementById("storage-up");
  let rechargeButton = document.getElementById("speed-up");
  document.getElementById(
    "storage-lvl"
  ).innerHTML = `${userObject.upgrades[0].level}`;
  document.getElementById(
    "speed-lvl"
  ).innerHTML = `${userObject.upgrades[1].level}`;
  switch (Number(userObject.upgrades[0].level)) {
    case 1: {
      storageButton.innerHTML = numberWithCommas(1500);
      break;
    }
    case 2: {
      storageButton.innerHTML = numberWithCommas(3000);
      break;
    }
    case 3: {
      storageButton.innerHTML = numberWithCommas(6000);
      break;
    }
    case 4: {
      storageButton.innerHTML = numberWithCommas(15000);
      break;
    }
    case 5: {
      storageButton.innerHTML = `Max Level`;
      storageButton.setAttribute("disabled", "true");
      break;
    }
  }
  switch (Number(userObject.upgrades[1].level)) {
    case 1: {
      rechargeButton.innerHTML = numberWithCommas(1500);
      break;
    }
    case 2: {
      rechargeButton.innerHTML = numberWithCommas(5000);
      break;
    }
    case 3: {
      rechargeButton.innerHTML = numberWithCommas(10000);
      break;
    }
    case 4: {
      rechargeButton.innerHTML = numberWithCommas(25000);
      break;
    }
    case 5: {
      rechargeButton.innerHTML = `Max Level`;
      rechargeButton.setAttribute("disabled", "true");
      break;
    }
  }
}
function updateWallet() {
  let usdtvalue = document.getElementById("money");
  let andvalue = document.getElementById("and-balance");
  let yourcoinsDiv = document.getElementById("wallet-coins-box");
  usdtvalue.innerHTML = numberWithCommas(userObject.usdt);
  andvalue.innerHTML = numberWithCommas(userObject.coins);
  yourcoinsDiv.innerHTML = "";
  yourcoinsDiv.innerHTML += `<div
  style="
    width: 318px;
    font-size: 20px;
    color: #003b8e;
    margin-bottom: 20px;
  "
>
  Your Coins
</div>`;

  for (const coin of userObject.crypto) {
    for (const crypto of cryptos) {
      if (crypto.id == coin.id) {
        yourcoinsDiv.innerHTML += `
      <div class="coin-items">
                 <div class="coin-info">
                   <div id="eth-icon">
                     <img src="./CoinIcons/${crypto.id.toLowerCase()}.png" alt="" />
                   </div>
                   <div id="eth-name" style="margin-left: 15px">
                     <div>${crypto.name}</div>
                     <div class="coins-amount" id="eth-amount">${coin.amount} ${
          coin.id
        }</div>
                   </div>
                 </div>
                 <div class="eth-vector">
                   
                 </div>
                 <div class="coin-price" style="margin: 15px">
                   <div id="eth}-price">$${crypto.usdtPrice}</div>
                   <div class="profits" id="eth-profit">${
                     crypto.growthRate
                   }%</div>
                 </div>
                 
               </div>
      `;
      }
    }
  }
}
function updateTasks() {
  let tasksDiv = document.getElementById("tasks");
  tasksDiv.innerHTML = "";
  for (const task of tasks) {
    let doneTask = false;
    try {
      if (userObject.completedTasks.includes(task.id)) {
        doneTask = true;
      }
    } catch (e) {
      doneTask = false;
    }

    tasksDiv.innerHTML += `
    <div class="task-items">
            <span style="font-size: 17px">${task.name}</span>
            <button class="join-btn" onclick="doTasks(this)" data-id="${
              task.id
            }" ${doneTask ? "disabled" : "notDone"}>${
      doneTask ? "Done" : task.task == "joinChannel" ? "Join" : "Go"
    } </button>
          </div>
    `;
  }
}
function doTasks(taskDiv) {
  let taskId = taskDiv.getAttribute("data-id");
  for (const task of tasks) {
    if (taskId == task.id) {
      if (task.task == "joinChannel") {
        Telegram.WebApp.openTelegramLink(task.link);
      } else {
        Telegram.WebApp.openLink(task.link);
      }
      setTimeout(() => {
        socket.send(
          `{"action":"getTaskStatus", "tgId":"${user.id}", "taskId":"${task.id}"}`
        );
      }, 2500);
    }
  }
}
let interval = setInterval(() => {
  updateFarmBar();
}, 1000);
function updateFarmBar() {
  let now = new Date().getTime();
  if (Number(now) - Number(userObject.lastClaimed) > 10800000) {
    farmProgress.style.display = "none";
    farmProgress.style.width = "0%";
    farmText.innerHTML = "Start Farming";
  } else {
    let timePassed = Number(now) - Number(userObject.lastClaimed);
    let rn = UTCtoTime(10800000 - timePassed);
    farmText.innerHTML = `${rn[0]}h : ${rn[1]}m : ${rn[2]}s`;
    let percentage = (timePassed / 10800000).toFixed(2) * 100;
    farmProgress.style.width = percentage + "%";
    farmProgress.style.display = "block";
  }
}
function UTCtoTime(time) {
  let seconds = Math.floor((time / 1000) % 60);
  let minutes = Math.floor((time / (1000 * 60)) % 60);
  let hours = Math.floor(time / (1000 * 60 * 60));
  return [hours, minutes, seconds];
}
function updateCrypto() {
  let cryptoCoins = document.getElementById("Coins-box");
  cryptoCoins.innerHTML = ``;
  cryptoCoins.innerHTML += `<div
            style="
              width: 318px;
              font-size: 20px;
              color: #003b8e;
              margin-bottom: 20px;
              margin-top: 10px;
            "
          ></div>`;
          cryptoCoins.innerHTML += `
    <div class="coin-items" onclick="tradeCrypto(this)" data-id="usdt">
              <div class="coin-info">
                <div id="eth-icon">
                  <img src="./CoinIcons/usdt.png" alt="" />
                </div>
                <div id="eth-name" style="margin-left: 15px">
                  <div>Tether USD</div>
                  <div class="coins-amount" id="eth-amount">$${numberWithCommas(userObject.usdt)}</div>
                </div>
              </div>
              <div class="eth-vector">
                
              </div>
              <div class="coin-price" style="margin: 15px">
                <div id="eth-price">$${numberWithCommas(usdtPrice)}</div>
                <div class="profits" id="eth-profit">0%</div>
              </div>
            </div>`;
  for (const crypto of cryptos) {
    cryptoCoins.innerHTML += `
    <div class="coin-items" onclick="tradeCrypto(this)" data-id="${crypto.id}">
              <div class="coin-info">
                <div id="eth-icon">
                  <img src="./CoinIcons/${crypto.id.toLowerCase()}.png" alt="" />
                </div>
                <div id="eth-name" style="margin-left: 15px">
                  <div>${crypto.name}</div>
                  <div class="coins-amount" id="eth-amount"></div>
                </div>
              </div>
              <div class="eth-vector">
                
              </div>
              <div class="coin-price" style="margin: 15px">
                <div id="eth-price">$${crypto.usdtPrice}</div>
                <div class="profits" id="eth-profit" style="color: ${
                  crypto.growthRate >= 0 ? "lightgreen" : "red"
                }">${crypto.growthRate}%</div>
              </div>
            </div>`;
  }
}
let waitingFor1stSelection = false;
let waitingFor2ndSelection = false;
let coinToGive = 'AND';
let coinToGet = 'USDT';
function tradeCrypto(cryptoDiv) {
  let id = cryptoDiv.getAttribute("data-id");
  if (waitingFor1stSelection) {
    document.getElementById('youPayCoinId').setAttribute('src', `./CoinIcons/${id.toLowerCase()}.png`);
    for (const coin in userObject.crypto) {
      if (coin.id == id) {
        document.getElementById('USDT-balance2').innerHTML = `${(id == 'USDT') ? userObject.usdt : coin.amount}`;
        coinToGive = id;
        waitingFor1stSelection = false;
      }
    }
  } else if (waitingFor2ndSelection) {
    document.getElementById('youGetCoinId').setAttribute('src', `./CoinIcons/${id.toLowerCase()}.png`);
    for (const coin in userObject.crypto) {
      if (coin.id == id) {
        coinToGet = id;
        waitingFor2ndSelection = false;
      }
    }
  } else {
    document.getElementById('youGetCoinId').setAttribute('src', `./CoinIcons/${id.toLowerCase()}.png`);
    coinToGet = id;
    coinToGive = 'AND';
  }
  document.getElementById('TradePage1').style.display = 'block';
  document.getElementById('TradePage2').style.display = 'none';
}
function youGetClicked() {
  waitingFor2ndSelection = true;
  waitingFor1stSelection = false;
  document.getElementById('TradePage1').style.display = 'none';
  document.getElementById('TradePage2').style.display = 'block';
  
}
function youGiveClciked() {
  waitingFor1stSelection = true;
  waitingFor2ndSelection = false;
  document.getElementById('TradePage1').style.display = 'none';
  document.getElementById('TradePage2').style.display = 'block';
}
function changePayments() {
  document.getElementById('youGetCoinId').setAttribute('src', `./CoinIcons/${coinToGive.toLowerCase()}.png`);
  document.getElementById('youPayCoinId').setAttribute('src', `./CoinIcons/${coinToGet.toLowerCase()}.png`);
  document.getElementById('USDT-balance2').innerHTML = `${(coinToGet == 'USDT') ? userObject.usdt : '6'}`;
  let tmp = coinToGive;
  coinToGive = coinToGet;
  coinToGet = tmp;
}
function updateFriends() {}
function updateEverything() {
  performSync();
  updateWallet();
  updateTasks();
  updateFriends();
  updateBoost();
  updateFarmBar();
  updateCrypto();
}
document.getElementById("referral-btn").addEventListener("click", () => {
  socket.send(`{"action":"getReferalCode", "tgId":"${user.id}"}`);
});
function parseQuery(queryString) {
  const params = new URLSearchParams(queryString);
  const result = {};

  // Iterate through each entry
  for (const [key, value] of params.entries()) {
    // Decode and parse JSON for 'user' key
    if (key === "user") {
      result[key] = JSON.parse(decodeURIComponent(value));
    } else {
      result[key] = value;
    }
  }
  return result;
}
function showError(ecode) {
  document.getElementById("mainError").style.display = "flex";
  document.getElementById("errorCode").innerHTML = `Error Code: ${ecode}`;
  clearInterval(sync);
}
