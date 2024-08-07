const client_version = "1.5.1b";
let server_version = "";
if (typeof Telegram == "undefined") {
  showError("TGE-22");
}
let userObject;
let user = parseQuery(Telegram.WebApp.initData);
let sHash = user.hash;
user = user.user;
let coins = 0;
let coinsSinceLastSync = 0;
let balance = document.getElementById("amount");
let farmingButton = document.getElementById("farm");
let farmText = document.getElementById("startFarming");
let farmProgress = document.getElementById("earnBackground");
let mainCoin = document.getElementById("andcoin");
let tasks = [];
let cryptos = [];
let friends = [];
let warns = [];
let recentClicks = [];
let usdtPrice = 1000;
let readyToClaim = false;
let readyToFarm = true;
let farming = false;
const socket = new WebSocket(config.SERVER_ADDRESS);

setTimeout(() => {
  if (typeof userObject == "undefined") {
    socket.send(
      `{"action":"login", "name": "${user.username}", "tgId": "${
        user.id
      }", "fullname":"${
        user.first_name == "undefined" ? "" : user.first_name
      } ${user.last_name == "undefined" ? "" : user.last_name}"}`
    );
    setTimeout(() => {
      if (typeof userObject == "undefined") {
        showError("DVE-33");
      } else {
        return;
      }
    }, 1000);
  }
}, 2000);
function init() {
  if (Telegram.WebApp.platform == "unknown") {
    showError("TGE-21");
    return;
  }

  if (!Telegram.WebApp.isVersionAtLeast("7.0")) {
    showError("TGE-23");
    return;
  }
  Telegram.WebApp.expand();
  Telegram.WebApp.setHeaderColor("#cbdef0");
  Telegram.WebApp.setBackgroundColor("#cbdef0");
  Telegram.WebApp.disableVerticalSwipes();
  Telegram.WebApp.requestWriteAccess();
  socket.send(
    `{"action":"login", "name": "${user.username}", "tgId": "${user.id}", "fullname":"${user.first_name} ${user.last_name}"}`
  );
  socket.send(`{"action":"getObject", "tgId": "${user.id}"}`);
  socket.send(`{"action":"getTasks"}`);
  socket.send(`{"action":"getCrypto"}`);
  socket.send(`{"action":"getUsdtPrice"}`);
  socket.send(`{"action":"getWarns", "tgId":"${user.id}"}`);
  socket.send(`{"action":"getFriends","tgId":"${user.id}"}`);
  setTimeout(() => {
    updateEverything();
    Telegram.WebApp.ready();
  }, 300);
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
      showError("ACE-1");
    }
  }
  if (object.action == "getObject") {
    userObject = object.object;
    upgrades = userObject.upgrades;
    coins = userObject.coins;
    balance.innerHTML = numberWithCommas(Math.floor(Number(coins)));
    if (object.sv) {
      server_version = object.sv;
    }
  } else if (object.action == "getTasks") {
    tasks = object.tasks;
  } else if (object.action == "getCrypto") {
    cryptos = object.cryptos;
  } else if (object.action == "getUsdtPrice") {
    usdtPrice = Number(object.price);
  } else if (object.action == "getFriends") {
    friends = object.friends;
  } else if (object.action == "getWarns") {
    warns = object.warns;
  } else if (object.action == 'getTaskStatus') {
    let tTask = object.taskId;
    if (object.result == 'true') {
      for (let i = 0; i < clickedTasks.length; i++) {
        if (clickedTasks[i] == tTask) {
          clickedTasks[0] = null;
        }
      }
    }
  }
}
let sync = setInterval(() => {
  performSync();
  setTimeout(() => {
    updateEverything();
  }, 300);
}, 2000);
function performSync() {
  checkForCheating();
  socket.send(
    `{"action":"updateCoinsFromUser", "tgId":"${user.id}", "coins": "${coinsSinceLastSync}"}`
  );
  coinsSinceLastSync = 0;
  setTimeout(() => {
    socket.send(`{"action":"getObject", "tgId":"${user.id}"}`);
  }, 200);

  socket.send(`{"action":"getTasks", "tgId": "${user.id}"}`);
  socket.send(
    `{"action":"updateWarnings", "warns":"${JSON.stringify(warns)}"}`
  );
}
farmingButton.addEventListener("click", () => {
  startFarming();
});
function startFarming() {
  let now = Number(new Date().getTime());
  if (!farming) {
    if (readyToClaim) {
      userObject.lastClaimed = now;
      readyToClaim = false;
      readyToFarm = true;
      socket.send(`{"action":"claimed", "tgId":"${user.id}", "time":"${now}"}`);
      notif("Successfully Claimed!", "info");
      updateFarmBar();
    } else if (readyToFarm) {
      farming = true;
      readyToFarm = false;
      updateFarmBar();
    }
  }
}
mainCoin.addEventListener("click", (e) => {
  coinClicked(e);
});
function coinClicked(params) {
  coins += 1;
  coinsSinceLastSync += 1;
  balance.innerHTML = `${numberWithCommas(Math.floor(Number(coins)))}`;
  vibrate(1);
  if (recentClicks.length > 50) {
    recentClicks = [];
  } else {
    recentClicks.push({
      clickId: recentClicks.length + 1,
      x: params.x,
      y: params.y,
    });
  }
}
function checkForCheating() {
  let firstClick;
  for (const click of recentClicks) {
    if (click.clickId == 1) {
      firstClick = click;
    }
    if (click.x == firstClick.x && click.y == firstClick.y) {
      if (click.clickId >= 50) {
        shouldGetWarn = true;
        giveWarn(x, y, "AutoClicker");
      }
    } else {
      return;
    }
  }
}
function giveWarn(x, y, r) {
  warns.push({
    x: x,
    y: y,
    time: new Date().toTimeString(),
    reason: r,
  });
}
function upgradeBoost(name) {
  let upgradeName = name.getAttribute("data-name");
  let upgradeButton = name;
  if (upgradeName == "storage") {
    if (userObject.upgrades[0].level + 1 >= 6) {
      return;
    }
    if (userObject.upgrades[0].level == 1) {
      if (userObject.coins < 1500) {
        notif("You don't have enough coins for this upgrade!", "error");
        return;
      } else {
        notif("Successfully Upgraded!", "info");

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
        notif("You don't have enough coins for this upgrade!", "error");
        return;
      } else {
        notif("Successfully Upgraded!", "info");
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
        notif("You don't have enough coins for this upgrade!", "error");
        return;
      } else {
        notif("Successfully Upgraded!", "info");
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
        notif("You don't have enough coins for this upgrade!", "error");
        return;
      } else {
        notif("Successfully Upgraded!", "info");
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
    if (userObject.upgrades[0].level + 1 >= 6) {
      return;
    }
    if (userObject.upgrades[1].level == 1) {
      if (userObject.coins < 1500) {
        notif("You don't have enough coins for this upgrade!", "error");
        return;
      } else {
        notif("Successfully Upgraded!", "info");
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
        notif("You don't have enough coins for this upgrade!", "error");
        return;
      } else {
        notif("Successfully Upgraded!", "info");
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
        notif("You don't have enough coins for this upgrade!", "error");
        return;
      } else {
        notif("Successfully Upgraded!", "info");
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
        notif("You don't have enough coins for this upgrade!", "error");
        return;
      } else {
        notif("Successfully Upgraded!", "info");
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
  usdtvalue.innerHTML = "";
  let totalMoney = Number(userObject.usdt);
  for (const cryp of userObject.crypto) {
    for (const cr of cryptos) {
      if (cryp.id == cr.id) {
        let coinAmount = cryp.amount * cr.usdtPrice;
        totalMoney += Number(coinAmount);
      }
    }
  }
  usdtvalue.innerHTML = numberWithCommas(
    parseFloat(Number(totalMoney).toFixed(2))
  );
  andvalue.innerHTML = numberWithCommas(Number(userObject.coins).toFixed(0));
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
  yourcoinsDiv.innerHTML += `
      <div class="coin-items">
                 <div class="coin-info">
                   <div id="eth-icon">
                     <img src="./CoinIcons/usdt.png" alt="" />
                   </div>
                   <div id="eth-name" style="margin-left: 15px">
                     <div>Tether USD</div>
                     <div class="coins-amount" id="eth-amount">$${userObject.usdt}</div>
                   </div>
                 </div>
                 <div class="eth-vector">
                   
                 </div>
                 <div class="coin-price" style="margin: 15px">
                   <div id="eth-price">${usdtPrice} $AND</div>
                   <div class="profits" id="eth-profit">0%</div>
                 </div>
                 
               </div>
      `;
  for (const coin of userObject.crypto) {
    for (const crypto of cryptos) {
      if (crypto.id == coin.id) {
        if (coin.amount == 0) {
          continue;
        }
        let growthRate = calculateGrowth(
          crypto.usdtPrice,
          coin.lastBought,
          coin.amount
        );
        yourcoinsDiv.innerHTML += `
      <div class="coin-items">
                 <div class="coin-info">
                   <div id="eth-icon">
                     <img src="./CoinIcons/${crypto.id.toLowerCase()}.png" alt="" />
                   </div>
                   <div id="eth-name" style="margin-left: 15px">
                     <div>${crypto.name}</div>
                     <div class="coins-amount" id="eth-amount">${parseFloat(
                       Number(coin.amount).toFixed(6)
                     )} ${coin.id}</div>
                   </div>
                 </div>
                 <div class="eth-vector">
                   
                 </div>
                 <div class="coin-price" style="margin: 15px">
                   <div id="eth}-price">$${crypto.usdtPrice}</div>
                   <div class="profits" id="eth-profit" ><div style="color: ${
                     growthRate > 0
                       ? "green"
                       : growthRate == 0
                       ? "black"
                       : "red"
                   };">${growthRate.toFixed(1)}% </div></div>
                 </div>
                 
               </div>
      `;
      }
    }
  }
}
let clickedTasks = [];
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
    if (task.task == "joinChannel") {
      tasksDiv.innerHTML += `
      <div class="task-items">
              <span style="font-size: 17px">${task.name}</span>
              <button class="join-btn" onclick="doTasks(this)" data-id="${
                task.id
              }" ${doneTask ? "disabled" : "notDone"}>${
                (clickedTasks.includes(task.id)) ? "Check" : doneTask ? "✓" : "Join"
      } </button>
            </div>
      `;
    } else if (task.task == "addFriend") {
      tasksDiv.innerHTML += `
      <div class="task-items">
              <span style="font-size: 17px">${task.name} (${
        userObject.friends.length
      }/50)</span>
              <button class="join-btn" onclick="doTasks(this)" data-id="${
                task.id
              }" ${doneTask ? "disabled" : "notDone"}>${
        (clickedTasks.includes(task.id)) ? "Check" : doneTask ? "✓" : "Invite"
      } </button>
            </div>
      `;
    }
  }
}
function doTasks(taskDiv) {
  let taskId = taskDiv.getAttribute("data-id");
  clickedTasks.push(taskId);
  for (const task of tasks) {
    if (taskId == task.id) {
      if (task.task == "joinChannel") {
        Telegram.WebApp.openTelegramLink(task.link);
      } else if (task.task == "addFriend") {
        getreferral();
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
  if (Number(now) - Number(userObject.lastClaimed) < userObject.miningTime) {
    farming = true;
    readyToClaim = false;
    readyToFarm = false;
  }
  if (readyToClaim) {
    readyToFarm = false;
    farmProgress.style.display = "none";
    farmProgress.style.width = "0%";
    farmText.innerHTML = "Claim";
  } else if (
    Number(now) - Number(userObject.lastClaimed) >
    userObject.miningTime
  ) {
    readyToClaim = true;
    readyToFarm = false;
  } else if (readyToFarm) {
    farmProgress.style.display = "none";
    farmProgress.style.width = "0%";
    farmText.innerHTML = "Start Farming";
  } else {
    let timePassed = Number(now) - Number(userObject.lastClaimed);
    let rn = UTCtoTime(userObject.miningTime - timePassed);
    farmText.innerHTML = `${rn[0]}h : ${rn[1]}m : ${rn[2]}s`;
    let percentage = (timePassed / userObject.miningTime).toFixed(2) * 100;
    if (percentage >= 2) {
      farmProgress.style.width = percentage + "%";
    } else {
      farmProgress.style.width = "0" + "%";
    }

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
    <div class="coin-items" onclick="tradeCrypto(this)" data-id="USDT">
              <div class="coin-info">
                <div id="eth-icon">
                  <img src="./CoinIcons/usdt.png" alt="" />
                </div>
                <div id="eth-name" style="margin-left: 15px">
                  <div>Tether USD</div>
                  <div class="coins-amount" id="eth-amount">$${numberWithCommas(
                    Number(userObject.usdt).toFixed(1)
                  )}</div>
                </div>
              </div>
              <div class="eth-vector">
                
              </div>
              <div class="coin-price" style="margin: 15px">
                <div id="eth-price">$AND ${numberWithCommas(usdtPrice)}</div>
                <div class="profits" id="eth-profit">0%</div>
              </div>
            </div>`;
  cryptoCoins.innerHTML += `
    <div class="coin-items" onclick="tradeCrypto(this)" data-id="AND">
              <div class="coin-info">
                <div id="eth-icon">
                  <img src="./CoinIcons/and.png" alt="" />
                </div>
                <div id="eth-name" style="margin-left: 15px">
                  <div>AndCoin</div>
                  <div class="coins-amount" id="eth-amount">$${numberWithCommas(
                    Number(userObject.coins).toFixed(0)
                  )}</div>
                </div>
              </div>
              <div class="eth-vector">
                
              </div>
              <div class="coin-price" style="margin: 15px">
                <div id="eth-price">$AND 1</div>
                <div class="profits" id="eth-profit">0%</div>
              </div>
            </div>`;
  for (const crypto of cryptos) {
    for (const crr of userObject.crypto) {
      if (crr.id == crypto.id) {
        let growthRate = calculateGrowth(
          crypto.usdtPrice,
          crr.lastBought,
          crr.amount
        );
        cryptoCoins.innerHTML += `
        <div class="coin-items" onclick="tradeCrypto(this)" data-id="${
          crypto.id
        }">
                  <div class="coin-info">
                    <div id="eth-icon">
                      <img src="./CoinIcons/${crypto.id.toLowerCase()}.png" alt="" />
                    </div>
                    <div id="eth-name" style="margin-left: 15px">
                      <div>${crypto.name}</div>
                      <div class="coins-amount" id="eth-amount">${parseFloat(
                        Number(crr.amount).toFixed(6)
                      )} $${crypto.id}</div>
                    </div>
                  </div>
                  <div class="eth-vector">
                    
                  </div>
                  <div class="coin-price" style="margin: 15px">
                    <div id="eth-price">$${Number(crypto.usdtPrice).toFixed(
                      1
                    )}</div>
                    <div class="profits" id="eth-profit" ><div style="color: ${
                      growthRate > 0
                        ? "green"
                        : growthRate == 0
                        ? "black"
                        : "red"
                    };">${growthRate.toFixed(1)}% </div> | <div style="color: ${
          crypto.growthRate > 0
            ? "green"
            : crypto.growthRate == 0
            ? "black"
            : "red"
        };">${crypto.growthRate}%</div></div>
        
                  </div>
                </div>`;
      }
    }
  }
}
let waitingFor1stSelection = false;
let waitingFor2ndSelection = true;
let firstTimeUsing = true;
let coinToGive = "USDT";
let coinToGet = "AND";
function updateTextsandBalance() {
  for (const coin in userObject.crypto) {
    if (coin.id == coinToGive) {
      document.getElementById("USDT-balance2").innerHTML = `${numberWithCommas(
        parseFloat(coin.amount.toFixed(6))
      )} $${coin.id}`;
      document.getElementById("youpaycoinname").innerHTML = coinToGive;
    } else {
      if (coinToGive == "USDT") {
        document.getElementById(
          "USDT-balance2"
        ).innerHTML = `$${numberWithCommas(
          parseFloat(userObject.usdt.toFixed(2))
        )}`;
        document.getElementById("youpaycoinname").innerHTML = coinToGive;
      } else if (coinToGive == "AND") {
        document.getElementById(
          "USDT-balance2"
        ).innerHTML = `${numberWithCommas(
          Number(userObject.coins).toFixed(0)
        )} $AND`;
        document.getElementById("youpaycoinname").innerHTML = coinToGive;
      }
    }
  }
  document
    .getElementById("youGetCoinId")
    .setAttribute("src", `./CoinIcons/${coinToGet.toLowerCase()}.png`);
  document.getElementById("yougetcoinname").innerHTML = coinToGet;
}
function tradeCrypto(cryptoDiv) {
  let id = cryptoDiv.getAttribute("data-id");

  if (firstTimeUsing) {
    firstTimeUsing = false;
    document
      .getElementById("youGetCoinId")
      .setAttribute("src", `./CoinIcons/${id.toLowerCase()}.png`);
    coinToGet = id;
    coinToGive = "USDT";
    document.getElementById("USDT-balance2").innerHTML = `${numberWithCommas(
      userObject.usdt
    )}`;
  }
  if (waitingFor1stSelection) {
    waitingFor1stSelection = false;
    waitingFor2ndSelection = false;
    coinToGive = id;
    document
      .getElementById("youPayCoinId")
      .setAttribute("src", `./CoinIcons/${id.toLowerCase()}.png`);
    for (const coin in userObject.crypto) {
      if (coin.id == id) {
        document.getElementById(
          "USDT-balance2"
        ).innerHTML = `${numberWithCommas(
          parseFloat(coin.amount.toFixed(6))
        )} $${coin.id}`;
        document.getElementById("youpaycoinname").innerHTML = coinToGive;
      } else {
        if (id == "USDT") {
          document.getElementById(
            "USDT-balance2"
          ).innerHTML = `$${numberWithCommas(
            parseFloat(userObject.usdt.toFixed(2))
          )}`;
          document.getElementById("youpaycoinname").innerHTML = coinToGive;
        } else if (id == "AND") {
          document.getElementById(
            "USDT-balance2"
          ).innerHTML = `${numberWithCommas(userObject.coins)} $AND`;
          document.getElementById("youpaycoinname").innerHTML = coinToGive;
        }
      }
    }
  } else if (waitingFor2ndSelection) {
    waitingFor2ndSelection = false;
    coinToGet = id;
    document.getElementById("yougetcoinname").innerHTML = id;
    if (id == "AND") {
      document
        .getElementById("youGetCoinId")
        .setAttribute("src", `./CoinIcons/and.png`);
    } else if (id == "USDT") {
      document
        .getElementById("youGetCoinId")
        .setAttribute("src", `./CoinIcons/usdt.png`);
    } else {
      document
        .getElementById("youGetCoinId")
        .setAttribute("src", `./CoinIcons/${id.toLowerCase()}.png`);
    }
  }
  updateCryptoPrices();
  document.getElementById("TradePage1").style.display = "block";
  document.getElementById("TradePage2").style.display = "none";
}
let buyInput = document.getElementById("buyValue");
function updateCryptoPrices() {
  let targetCoin = getCryptoObject(coinToGet);
  let startCoin = getCryptoObject(coinToGive);
  let hmny;
  let hmnyc;
  if (coinToGet == "AND") {
    if (coinToGive == "USDT") {
      hmny = buyInput.value * usdtPrice;
    } else if (coinToGet == "AND") {
      hmny = Number(buyInput.value);
    } else {
      hmny = buyInput.value * targetCoin.usdtPrice * usdtPrice;
    }
    hmnyc = hmny / usdtPrice;
  } else if (coinToGet == "USDT") {
    if (coinToGive == "AND") {
      hmny = buyInput.value / usdtPrice;
    } else if (coinToGive == "USDT") {
      hmny = Number(buyInput.value);
    } else {
      hmny = buyInput.value * startCoin.usdtPrice;
    }
    hmnyc = hmny;
  } else {
    if (coinToGive == "AND") {
      hmny = buyInput.value / usdtPrice / targetCoin.usdtPrice;
    } else if (coinToGive == "USDT") {
      hmny = buyInput.value / targetCoin.usdtPrice;
    } else {
      let hmnyInUsdt = startCoin.usdtPrice * buyInput.value;
      hmny = hmnyInUsdt / targetCoin.usdtPrice;
    }
    hmnyc = hmny * targetCoin.usdtPrice;
  }
  document.getElementById("coin-get").innerHTML = `$ ${numberWithCommas(
    parseFloat(hmnyc.toFixed(6))
  )}`;
  document.getElementById("yougetcoin1").innerHTML = ` ${numberWithCommas(
    parseFloat(hmny.toFixed(6))
  )} $${coinToGet}`;
}
buyInput.oninput = function () {
  if (Number(buyInput.value) < 0) {
    buyInput.value = 0;
  }
  updateCryptoPrices();
};
function youGetClicked() {
  waitingFor2ndSelection = true;
  waitingFor1stSelection = false;
  document.getElementById("TradePage1").style.display = "none";
  document.getElementById("TradePage2").style.display = "block";
}
function youGiveClciked() {
  waitingFor1stSelection = true;
  waitingFor2ndSelection = false;
  document.getElementById("TradePage1").style.display = "none";
  document.getElementById("TradePage2").style.display = "block";
}
function swap() {
  let amount = Number(buyInput.value);
  if (coinToGet == coinToGive) {
    notif("You can't swap a coin with itself", "error");
    return;
  }
  if (amount <= 0) {
    notif("Buy/Sell amount cannot be zero or lower", "error");
    return;
  }
  for (const cr of userObject.crypto) {
    if (cr.id == coinToGive) {
      if (cr.amount < amount) {
        notif(
          "You don't have enough funds to proceed with this action.",
          "error"
        );
        return;
      }
    } else if (coinToGive == "AND") {
      if (userObject.coins < amount) {
        notif(
          "You don't have enough funds to proceed with this action.",
          "error"
        );
        return;
      }
    } else if (coinToGive == "USDT") {
      if (userObject.usdt < amount) {
        notif(
          "You don't have enough funds to proceed with this action.",
          "error"
        );
        return;
      }
    }
  }
  for (const cryp of userObject.crypto) {
    if (cryp.id == coinToGive) {
      updateCryptoPrices();
      socket.send(
        `{"action":"buyCrypto", "tgId":"${user.id}", "amount":"${amount}", "cointobuy":"${coinToGet}", "cointopay":"${coinToGive}"}`
      );
      notif("Sucessfully swapped your cryptos", "info");

      setTimeout(() => {
        updateEverything();
        buyInput.value = "";
        updateTextsandBalance();
      }, 250);

      break;
    } else {
      if (coinToGive == "USDT") {
        updateCryptoPrices();
        socket.send(
          `{"action":"buyCrypto", "tgId":"${user.id}", "amount":"${amount}", "cointobuy":"${coinToGet}", "cointopay":"${coinToGive}"}`
        );
        notif("Sucessfully swapped your cryptos", "info");
        setTimeout(() => {
          updateEverything();
          buyInput.value = "";
          updateTextsandBalance();
        }, 250);

        break;
      } else if (coinToGive == "AND") {
        updateCryptoPrices();
        socket.send(
          `{"action":"buyCrypto", "tgId":"${user.id}", "amount":"${amount}", "cointobuy":"${coinToGet}", "cointopay":"${coinToGive}"}`
        );
        notif("Sucessfully swapped your cryptos", "info");
        setTimeout(() => {
          updateEverything();
          buyInput.value = "";
          updateTextsandBalance();
        }, 250);

        break;
      }
    }
  }
}
function changePayments() {
  let tmp = coinToGive;
  coinToGive = coinToGet;
  coinToGet = tmp;
  document
    .getElementById("youGetCoinId")
    .setAttribute("src", `./CoinIcons/${coinToGet.toLowerCase()}.png`);
  document
    .getElementById("youPayCoinId")
    .setAttribute("src", `./CoinIcons/${coinToGive.toLowerCase()}.png`);
  document.getElementById("yougetcoinname").innerHTML = coinToGet;
  document.getElementById("youpaycoinname").innerHTML = coinToGive;
  let bal = 0;
  if (coinToGive != "AND" && coinToGive != "USDT") {
    for (const cryp of userObject.crypto) {
      if (cryp.id == coinToGive) {
        bal = cryp.amount;
      }
    }
  }
  document.getElementById("USDT-balance2").innerHTML = `${
    coinToGive == "USDT"
      ? numberWithCommas(userObject.usdt)
      : coinToGive == "AND"
      ? numberWithCommas(userObject.coins)
      : numberWithCommas(parseFloat(bal.toFixed(5)))
  }`;
  updateCryptoPrices();
}
function updateFriends() {
  let friendsDiv = document.getElementById("friends");
  friendsDiv.innerHTML = ``;
  if (friends.length != 0) {
    for (const friend of friends) {
      let friendMoney = 0;
      friendMoney += Number(friend.usdt);
      for (const cr of friend.crypto) {
        for (const crypto of cryptos) {
          if (cr.id == crypto.id) {
            friendMoney += Number(cr.amount) * Number(crypto.usdtPrice);
          }
        }
      }
      friendsDiv.innerHTML += `
        <div class="task-items">
                <span style="font-size: 17px">${friend.fullname}</span>
                <span class="friendMoney">$${numberWithCommas(
                  parseFloat(Number(friendMoney).toFixed(2))
                )}</span>
              </div>
        `;
    }
  } else {
    friendsDiv.innerHTML = `<div class="task-items">You have no friends</div>`;
  }
}
function updateEverything() {
  performSync();
  setTimeout(() => {
    updateWallet();
    updateTasks();
    updateFriends();
    updateBoost();
    updateFarmBar();
    updateCrypto();
    updateCryptoPrices();
    updateVersions();
  }, 250);
}
document.getElementById("referral-btn").addEventListener("click", () => {
  getreferral();
});
function getreferral() {
  window.open(`tg://msg?text=You have been invited to play AndCoin by ${userObject.fullname}\nhttps://t.me/andcoin_bot?start=${user.id}`, '_blank');
}
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
  Telegram.WebApp.setHeaderColor("#37393a");
  Telegram.WebApp.setBackgroundColor("#37393a");
  clearInterval(sync);
}
function getCryptoObject(id) {
  for (const crypto of cryptos) {
    if (crypto.id == id) {
      return crypto;
    }
  }
}
function notif(message, type) {
  let notifDiv = document.getElementById("notif");
  notifDiv.classList.remove("info1");
  notifDiv.classList.remove("error1");
  if (type == "info" || type == undefined) {
    notifDiv.innerHTML = message;
    notifDiv.classList.add("info1");
  } else {
    notifDiv.innerHTML = message;
    notifDiv.classList.add("error1");
  }
  notifDiv.style.display = "flex";
  setTimeout(() => {
    notifDiv.classList.add("show");
    vibrate(2);
    setTimeout(() => {
      notifDiv.classList.remove("show");
      setTimeout(() => {
        notifDiv.style.display = "none";
      }, 500); // Match this to the transition duration
    }, 1500); // Display for 3 seconds
  }, 10); // Small delay to trigger the animation
}
function vibrate(level) {
  if (level == 1) {
    Telegram.WebApp.HapticFeedback.impactOccurred("light");
  } else if (level == 2) {
    Telegram.WebApp.HapticFeedback.notificationOccurred("success");
  } else if (level == 3) {
    Telegram.WebApp.HapticFeedback.impactOccurred("heavy");
  } else if (level == 4) {
    Telegram.WebApp.HapticFeedback.notificationOccurred("error");
  }
}
function updateVersions() {
  document.getElementById(
    "sversion"
  ).innerHTML = `Server Version: ${server_version}`;
  document.getElementById(
    "cversion"
  ).innerHTML = `Client Version: ${client_version}`;
  document.getElementById("sHash").innerHTML = `Session Hash: ${sHash}`;
}
function calculateGrowth(currentPrice, buyingPrice, initialQuantity) {
  // Set default values for buyingPrice and initialQuantity if they are not provided
  buyingPrice = buyingPrice || currentPrice;
  initialQuantity = initialQuantity || 0;

  // Calculate average buying price
  const averageBuyingPrice = (initialQuantity * buyingPrice) / initialQuantity;
  // Calculate growth percentage
  const growthPercentage =
    ((currentPrice - averageBuyingPrice) / averageBuyingPrice) * 100;
  if (isNaN(Number(growthPercentage))) {
    return 0;
  } else {
    return growthPercentage;
  }
}
