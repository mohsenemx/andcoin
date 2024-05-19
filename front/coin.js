/*   onclick   */
let currentPage = "home";
let globalAndObject = {};
let parsedTGdata = parseTGvalues(window.location.hash);
let coinsSinceLastSync = 0;
let coins = 0;
let upgrades = [];
let coinsDisplay = document.getElementById("coinsDisplay");
let atasks = [];
let cryptos = [];

const socket = new WebSocket("ws://localhost:8081");
setTimeout(() => {
  if (parsedTGdata == false) {
    alert("Required data is missing, please reload the page");
  }
}, 1000);
socket.onopen = function (event) {
  // Alert the user that they are
  // connected to the WebSocket server
  socket.send(
    `{"action":"login", "name": "${parsedTGdata.user.username}", "tgId": "${parsedTGdata.user.id}"}`
  );
  setTimeout(function () {
    socket.send(
      `{"action":"getObject", "name": "${parsedTGdata.user.username}"}`
    );
  }, 100);
  setTimeout(function () {
    socket.send(`{"action":"getTasks"}`);
  }, 200);
  setTimeout(function () {
    socket.send(`{"action":"getCrypto"}`);
  }, 300);
};
let objectSync = setInterval(() => {
  socket.send(
    `{"action":"updateEnergy", "name": "${parsedTGdata.user.username}","energy" : "${globalAndObject.energy}"}`
  );
  setTimeout(
    socket.send(
      `{"action":"getObject", "name": "${parsedTGdata.user.username}"}`
    ),
    200
  );
  updateEnergy();
}, 5000);
socket.onmessage = function (event) {
  let pjson = JSON.parse(event.data);
  if (pjson.action == "getObject") {
    globalAndObject = pjson.object;
    upgrades = globalAndObject.upgrades;
    coins = globalAndObject.coins;
    coinsDisplay.innerHTML = numberWithCommas(coins);
    updateRank();
    updateWallet();
  } else if (pjson.action == "getTasks") {
    atasks = pjson.tasks;
    loadTasks();
  } else if (pjson.action == "getCrypto") {
    cryptos = pjson.cryptos;
    loadCryptos();
  }
};
socket.onclose = function (event) {
  alert("Connection failed with server");
  clearInterval(coinSync);
  clearInterval(objectSync);
};
let coinSync = setInterval(function () {
  socket.send(
    `{"action":"updateCoinsFromUser", "name": "${parsedTGdata.user.username}", "coins": "${coinsSinceLastSync}"}`
  );
  coinsSinceLastSync = 0;
}, 3000);
function updateFooter(page) {
  if (page == 'tasks') {
    for (const el of document.querySelectorAll("#tasksIcon")) {
      el.src = './img/edit1.png';
    }
    
  }
}
tasks.onclick = function () {
  document.getElementById("modalTasks").style.display = "block";
  updateFooter("tasks");
};
trade.onclick = function () {
  document.getElementById("modalTrade").style.display = "block";
};
wallet.onclick = function () {
  document.getElementById("modalWalet").style.display = "block";
};

// modal tarde

home.onclick = function () {
  document.getElementById("modalTrade").style.display = "none";
};
tasks2.onclick = function () {
  document.getElementById("modalTrade").style.display = "none";
  document.getElementById("modalTasks").style.display = "block";
};
wallet2.onclick = function () {
  document.getElementById("modalWalet").style.display = "block";
};

// modal tasks

home2.onclick = function () {
  document.getElementById("modalTasks").style.display = "none";
  document.getElementById("modalTrade").style.display = "none";
};
trade2.onclick = function () {
  document.getElementById("modalTasks").style.display = "none";
  document.getElementById("modalTrade").style.display = "block";
};
wallet3.onclick = function () {
  document.getElementById("modalWalet").style.display = "block";
};

// modal wallet

back.onclick = function () {
  document.getElementById("modalWalet").style.display = "none";
};
tasks3.onclick = function () {
  document.getElementById("modalWalet").style.display = "none";
  document.getElementById("modalTasks").style.display = "block";
};
trade3.onclick = function () {
  document.getElementById("modalWalet").style.display = "none";
  document.getElementById("modalTrade").style.display = "block";
};
home3.onclick = function () {
  document.getElementById("modalWalet").style.display = "none";
  document.getElementById("modalTrade").style.display = "none";
  document.getElementById("modalTasks").style.display = "none";
};

/*   transition coin   */
function numberWithCommas(x) {
  return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
}
function coinClicked() {
  try {
    if (globalAndObject.energy - upgrades[0].level > 0) {
      coins += upgrades[0].level;
      coinsSinceLastSync += upgrades[0].level;
      globalAndObject.energy -= upgrades[0].level;
      updateEnergy();
      coinsDisplay.innerHTML = numberWithCommas(coins);
    }
  } catch (e) {
    console.log(e);
  }
}
function updateRank() {
  document.getElementById("userRank").innerHTML = globalAndObject.rank;
}
function referFriend() {
  socket.send(
    `{"action":"getReferalCode","name":"${parsedTGdata.user.username}"}`
  );
}
function loadTasks() {
  let tasksDiv = document.getElementById("tasksdiv");
  tasksDiv.innerHTML = "";
  for (const task of atasks) {
    let doneTask = false;
    if (globalAndObject.completedTasks.includes(task.id)) {
      doneTask = true;
    }
    tasksDiv.innerHTML += `<div class="taskItem"><p>${
      task.name
    }</p><div class="taskButton"><button onclick="doTasks(this)" data-id="${
      task.id
    }" ${doneTask ? "disabled" : "notDone"}>${
      doneTask ? "Done" : task.task == "joinChannel" ? "Join" : "Go"
    } ${
      doneTask ? '<img src="./img/checkmark.png" class="donePic">' : ""
    } </button></div></div>`;
  }
}
function doTasks(div) {
  let taskId = div.getAttribute("data-id");
  socket.send(
    `{"action":"getTaskStatus","name":"${parsedTGdata.user.username}", "taskId": "${taskId}"}`
  );
}
function loadCryptos() {
  let cryptosList = document.getElementById("cryptoList");
  cryptosList.innerHTML = "";
  for (const coin of cryptos) {
    cryptosList.innerHTML += `<div class="coinItem" data-id=${
      coin.id
    } onclick="buySellMenu(this)"><img src="./img/coin/${coin.id.toLowerCase()}.png"></img><div class="coinName"><div class="coinPrices2"><p>${
      coin.id
    }</p><br><p>${
      coin.name
    }</p></div><div class="coinPrices"><div class="usdtPrices"><img class="usdtPic" src="./img/coin/usdt.png"><p id="cPrice">${coin.usdtPrice.toFixed(
      2
    )}</p></div><p style="${
      coin.growthRate >= 0 ? "color: green;" : "color: red;"
    }" id="growth">${coin.growthRate}%</p></div></div></div>`;
  }
}
let cryptoTrade = document.getElementById("cryptoTrade");
let cryptoTradeContent = document.getElementById("cryptoBuy");
let shouldCloseModal = false;
function buySellMenu(div) {
  let cryptoId = div.getAttribute("data-id");

  cryptoTrade.style.display = 'flex';
  setTimeout(() => {
    shouldCloseModal = true;
  },100);
  let amount = 0;

  for (const crypto of cryptos) {
    if (crypto.id == cryptoId) {
      for (const crc of globalAndObject.crypto) {
        if (crc.id == crypto.id) {
          amount = crc.amount;
        }
      }
      
      document.getElementById(
        "cryptoTitle"
      ).innerHTML = `Trading ${crypto.name}`;
      document.getElementById("cryptoPicture").src = `./img/coin/${crypto.id.toLowerCase()}.png`;
      document.getElementById("yourcoin").innerHTML = `You have <img id="cryptoPictureT" src="./img/coin/${crypto.id.toLowerCase()}.png"> ${amount} and <img id="cryptoPictureB" src="./img/coin/usdt.png"> ${globalAndObject.usdt}`;

    }
  }
}
window.onclick = function(event) {
  let switchBox = document.getElementById("centeredSwitch");
  if (event.target != cryptoTrade && event.target != cryptoTradeContent && event.target != switchBox) {
    if (shouldCloseModal) {
      cryptoTrade.style.display = "none";
      shouldCloseModal = false;
    }
  }
}
function updateEnergy() {
  document.getElementById(
    "energyValues"
  ).innerHTML = `${globalAndObject.energy}/${globalAndObject.maxEnergy}`;
  let percentage = (globalAndObject.energy / globalAndObject.maxEnergy) * 100;
  document.getElementById("bluebar").style.width = `${percentage * 0.6}%`;
}
function updateWallet() {
  let usdtbalance = document.getElementById("walletUsdtBalance");
  let andbalance = document.getElementById("walletAndBalance");
  usdtbalance.innerHTML = `<img src="./img/coin/usdt.png" id="walletUsdt">${numberWithCommas(globalAndObject.usdt)}`;
  andbalance.innerHTML = `Your $AND balance: ${numberWithCommas(globalAndObject.coins)}`;
}