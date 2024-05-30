/*   onclick   */
if (!Telegram.WebApp.isExpanded) Telegram.WebApp.expand();
let currentPage = "home";
let globalAndObject = {};
let parsedTGdata = parseTGvalues(window.location.hash);
let coinsSinceLastSync = 0;
let coins = 0;
let upgrades = [];
let coinsDisplay = document.getElementById("coinsDisplay");
let atasks = [];
let cryptos = [];
let friends = [];
let usdtPrice = 6000;
const socket = new WebSocket("ws://127.0.0.1:8081/");
setTimeout(() => {
  if (parsedTGdata == false) {
    showAllError();
  }
}, 1000);
socket.onopen = function (event) {
  socket.send(
    `{"action":"login", "name": "${parsedTGdata.user.username}", "tgId": "${parsedTGdata.user.id}"}`
  );
  setTimeout(function () {
    socket.send(`{"action":"getObject", "tgId": "${parsedTGdata.user.id}"}`);
  }, 100);
  setTimeout(function () {
    socket.send(`{"action":"getTasks"}`);
  }, 200);
  setTimeout(function () {
    socket.send(`{"action":"getCrypto"}`);
  }, 300);
  socket.send(`{"action":"getUsdtPrice"}`);
  socket.send(`{"action":"getFriends","tgId":"${parsedTGdata.user.id}"}`);
};
let objectSync = setInterval(() => {
  socket.send(
    `{"action":"updateEnergy", "tgId": "${parsedTGdata.user.id}","energy" : "${globalAndObject.energy}"}`
  );
  setTimeout(
    socket.send(`{"action":"getObject", "tgId": "${parsedTGdata.user.id}"}`),
    200
  );
  updateEnergy();
}, 1000);
socket.onmessage = function (event) {
  let pjson = JSON.parse(event.data);
  if (pjson.action == "getObject") {
    globalAndObject = pjson.object;
    upgrades = globalAndObject.upgrades;
    coins = globalAndObject.coins;
    coinsDisplay.innerHTML = numberWithCommas(coins);
    updateEverything();
  } else if (pjson.action == "getTasks") {
    atasks = pjson.tasks;
    loadTasks();
  } else if (pjson.action == "getCrypto") {
    cryptos = pjson.cryptos;
    loadCryptos();
  } else if (pjson.action == "getUsdtPrice") {
    usdtPrice = Number(pjson.price);
  } else if (pjson.action == "getFriends") {
    friends = pjson.friends;
    loadFriends();
  }
};
socket.onclose = function (event) {
  console.log("WebSocket connection closed:", event.code, event.reason);
  showAllError();
};
socket.onerror = function (event) {
  console.log("WebSocket connection closed:", event.code, event.reason);
  showAllError();
};

let coinSync = setInterval(function () {
  socket.send(
    `{"action":"updateCoinsFromUser", "tgId": "${parsedTGdata.user.id}", "coins": "${coinsSinceLastSync}"}`
  );
  setTimeout(() => {
    coins = globalAndObject.coins;
  }, 100);

  coinsSinceLastSync = 0;
}, 3000);
function updateFooter(page) {
  if (page == "tasks") {
    for (const el of document.querySelectorAll("#tasksIcon")) {
      el.src = "./img/edit1.png";
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
boost.onclick = () => {
  document.getElementById("boostDiv").style.display = "block";
};
boostBack.onclick = () => {
  document.getElementById("boostDiv").style.display = "none";
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
  socket.send(`{"action":"getReferalCode","tgId":"${parsedTGdata.user.id}"}`);
}
function loadTasks() {
  let tasksDiv = document.getElementById("tasksdiv");
  tasksDiv.innerHTML = "";
  for (const task of atasks) {
    let doneTask = false;
    try {
      if (globalAndObject.completedTasks.includes(task.id)) {
        doneTask = true;
      }
    } catch (e) {
      doneTask = false;
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
    `{"action":"getTaskStatus","tgId":"${parsedTGdata.user.id}", "taskId": "${taskId}"}`
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
let tradeObject;
let userTradeObject;
function buySellMenu(div) {
  let cryptoId = div.getAttribute("data-id");

  cryptoTrade.style.display = "flex";
  let amount = 0;

  for (const crypto of cryptos) {
    if (crypto.id == cryptoId) {
      for (const crc of globalAndObject.crypto) {
        if (crc.id == crypto.id) {
          amount = crc.amount;
          tradeObject = crypto;
          userTradeObject = crc;
        }
      }

      document.getElementById(
        "cryptoTitle"
      ).innerHTML = `Trading ${crypto.name}`;
      document.getElementById(
        "cryptoPicture"
      ).src = `./img/coin/${crypto.id.toLowerCase()}.png`;
      document.getElementById(
        "yourcoin"
      ).innerHTML = `You have <img id="cryptoPictureT" src="./img/coin/${crypto.id.toLowerCase()}.png"> ${amount.toFixed(
        4
      )} and <img id="cryptoPictureB" src="./img/coin/usdt.png"> ${globalAndObject.usdt.toFixed(
        1
      )}`;
    }
  }
}
document.getElementById("Cryptoclose").addEventListener("click", () => {
  cryptoTrade.style.display = "none";
  document.getElementById("amountP").innerHTML = "";
});
document.getElementById("switch").oninput = () => {
  document.getElementById("amountP").innerHTML = "";
  document.getElementById("amountDiv").innerHTML = "";
};
let slider = document.getElementById("slider");
slider.oninput = () => {
  let isBuy = document.getElementById("switch").checked;
  if (!isBuy) {
    let maxPossible = (globalAndObject.usdt / tradeObject.usdtPrice).toFixed(4);
    let howMany = (maxPossible / 100) * Number(slider.value);
    document.getElementById(
      "amountP"
    ).innerHTML = `Selected Amount: <img src="./img/coin/${tradeObject.id.toLowerCase()}.png" id="cryptoPictureT"> ${numberWithCommas(
      howMany.toFixed(1)
    )}`;
    let worth = howMany * tradeObject.usdtPrice;
    document.getElementById(
      "amountDiv"
    ).innerHTML = `Worth: <img src="./img/coin/usdt.png" id="cryptoPictureB"> ${numberWithCommas(
      worth.toFixed(1)
    )}`;
  } else {
    let maxPossible = userTradeObject.amount;
    let howMany = (maxPossible / 100) * Number(slider.value);
    document.getElementById(
      "amountP"
    ).innerHTML = `Selected Amount: ${numberWithCommas(howMany.toFixed(4))}`;
    let worth = howMany * tradeObject.usdtPrice;
    document.getElementById(
      "amountDiv"
    ).innerHTML = `Worth: <img src="./img/coin/usdt.png" id="cryptoPictureB"> ${numberWithCommas(
      worth.toFixed(1)
    )}`;
  }
};
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
  usdtbalance.innerHTML = `<img src="./img/coin/usdt.png" id="walletUsdt">${numberWithCommas(
    globalAndObject.usdt.toFixed(1)
  )}`;
  andbalance.innerHTML = `Your $AND balance: ${numberWithCommas(
    globalAndObject.coins
  )}`;
}
document.getElementById("goForTradeButton").addEventListener("click", () => {
  let isBuy = document.getElementById("switch").checked;
  if (!isBuy) {
    let maxPossible = globalAndObject.usdt / tradeObject.usdtPrice;
    let howMany = (maxPossible / 100) * Number(slider.value);
    socket.send(
      `{"action":"buyCrpto", "tgId":"${parsedTGdata.user.id}", "cointobuy":"${tradeObject.id}", "cryptotobuy":"${howMany}"}`
    );
  } else {
    let maxPossible = userTradeObject.amount;
    let howMany = (maxPossible / 100) * Number(slider.value);
    socket.send(
      `{"action":"sellCrypto", "tgId":"${parsedTGdata.user.id}", "cointosell":"${tradeObject.id}", "amounttosell":"${howMany}"}`
    );
  }
});

function upgradeBoost(name) {
  let upgradeName = name.getAttribute("data-name");
  if (upgradeName == "storage") {
    if (globalAndObject.upgrades[1].level == 1) {
      if (globalAndObject.coins < 1500) {
        showBoostError("You don't have enough coins for this upgrade!");
        return;
      } else {
        socket.send(
          `{"action":"upgrade","tgId":"${
            parsedTGdata.user.id
          }","upgrade":"storage","targetLevel":"${
            globalAndObject.upgrades[1].level + 1
          }"}`
        );
        updateEverything();
      }
    } else if (globalAndObject.upgrades[1].level == 2) {
      if (globalAndObject.coins < 3000) {
        showBoostError("You don't have enough coins for this upgrade!");
        return;
      } else {
        socket.send(
          `{"action":"upgrade","tgId":"${
            parsedTGdata.user.id
          }","upgrade":"storage","targetLevel":"${
            globalAndObject.upgrades[1].level + 1
          }"}`
        );
        updateEverything();
      }
    } else if (globalAndObject.upgrades[1].level == 3) {
      if (globalAndObject.coins < 6000) {
        showBoostError("You don't have enough coins for this upgrade!");
        return;
      } else {
        socket.send(
          `{"action":"upgrade","tgId":"${
            parsedTGdata.user.id
          }","upgrade":"storage","targetLevel":"${
            globalAndObject.upgrades[1].level + 1
          }"}`
        );
        updateEverything();
      }
    } else if (globalAndObject.upgrades[1].level == 4) {
      if (globalAndObject.coins < 15000) {
        showBoostError("You don't have enough coins for this upgrade!");
        return;
      } else {
        socket.send(
          `{"action":"upgrade","tgId":"${
            parsedTGdata.user.id
          }","upgrade":"storage","targetLevel":"${
            globalAndObject.upgrades[1].level + 1
          }"}`
        );
        updateEverything();
      }
    }
  } else if (upgradeName == "multi") {
    if (globalAndObject.upgrades[0].level == 1) {
      if (globalAndObject.coins < 1500) {
        showBoostError("You don't have enough coins for this upgrade!");
        return;
      } else {
        socket.send(
          `{"action":"upgrade","tgId":"${
            parsedTGdata.user.id
          }","upgrade":"multitap","targetLevel":"${
            globalAndObject.upgrades[0].level + 1
          }"}`
        );
        updateEverything();
      }
    } else if (globalAndObject.upgrades[0].level == 2) {
      if (globalAndObject.coins < 3000) {
        showBoostError("You don't have enough coins for this upgrade!");
        return;
      } else {
        socket.send(
          `{"action":"upgrade","tgId":"${
            parsedTGdata.user.id
          }","upgrade":"multitap","targetLevel":"${
            globalAndObject.upgrades[0].level + 1
          }"}`
        );
        updateEverything();
      }
    } else if (globalAndObject.upgrades[0].level == 3) {
      if (globalAndObject.coins < 6000) {
        showBoostError("You don't have enough coins for this upgrade!");
        return;
      } else {
        socket.send(
          `{"action":"upgrade","tgId":"${
            parsedTGdata.user.id
          }","upgrade":"multitap","targetLevel":"${
            globalAndObject.upgrades[0].level + 1
          }"}`
        );
        updateEverything();
      }
    } else if (globalAndObject.upgrades[0].level == 4) {
      if (globalAndObject.coins < 15000) {
        showBoostError("You don't have enough coins for this upgrade!");
        return;
      } else {
        socket.send(
          `{"action":"upgrade","tgId":"${
            parsedTGdata.user.id
          }","upgrade":"multitap","targetLevel":"${
            globalAndObject.upgrades[0].level + 1
          }"}`
        );
        updateEverything();
      }
    } else {
      socket.send(
        `{"action":"upgrade","tgId":"${
          parsedTGdata.user.id
        }","upgrade":"multitap","targetLevel":"${
          globalAndObject.upgrades[0].level + 1
        }"}`
      );
      updateEverything();
    }
  } else if (upgradeName == "recharge") {
    if (globalAndObject.upgrades[2].level == 1) {
      if (globalAndObject.coins < 1500) {
        showBoostError("You don't have enough coins for this upgrade!");
        return;
      } else {
        socket.send(
          `{"action":"upgrade","tgId":"${
            parsedTGdata.user.id
          }","upgrade":"recharge","targetLevel":"${
            globalAndObject.upgrades[2].level + 1
          }"}`
        );
        updateEverything();
      }
    } else if (globalAndObject.upgrades[2].level == 2) {
      if (globalAndObject.coins < 5000) {
        showBoostError("You don't have enough coins for this upgrade!");
        return;
      } else {
        socket.send(
          `{"action":"upgrade","tgId":"${
            parsedTGdata.user.id
          }","upgrade":"recharge","targetLevel":"${
            globalAndObject.upgrades[2].level + 1
          }"}`
        );
        updateEverything();
      }
    } else if (globalAndObject.upgrades[2].level == 3) {
      if (globalAndObject.coins < 10000) {
        showBoostError("You don't have enough coins for this upgrade!");
        return;
      } else {
        socket.send(
          `{"action":"upgrade","tgId":"${
            parsedTGdata.user.id
          }","upgrade":"recharge","targetLevel":"${
            globalAndObject.upgrades[2].level + 1
          }"}`
        );
        updateEverything();
      }
    } else if (globalAndObject.upgrades[2].level == 4) {
      if (globalAndObject.coins < 25000) {
        showBoostError("You don't have enough coins for this upgrade!");
        return;
      } else {
        socket.send(
          `{"action":"upgrade","tgId":"${
            parsedTGdata.user.id
          }","upgrade":"recharge","targetLevel":"${
            globalAndObject.upgrades[2].level + 1
          }"}`
        );
        updateEverything();
      }
    } else {
      socket.send(
        `{"action":"upgrade","tgId":"${
          parsedTGdata.user.id
        }","upgrade":"recharge","targetLevel":"${
          globalAndObject.upgrades[2].level + 1
        }"}`
      );
      updateEverything();
    }
  }
}
function updateBoost() {
  let storageButton = document.getElementById("storageButton");
  let rechargeButton = document.getElementById("rechargeButton");
  let multitapButton = document.getElementById("multitapButton");
  document.getElementById(
    "storageLevel"
  ).innerHTML = `/ level ${globalAndObject.upgrades[1].level}`;
  document.getElementById(
    "rechargeLevel"
  ).innerHTML = `/ level ${globalAndObject.upgrades[2].level}`;
  document.getElementById(
    "multitapLevel"
  ).innerHTML = `/ level ${globalAndObject.upgrades[0].level}`;
  switch (Number(globalAndObject.upgrades[1].level)) {
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
  switch (Number(globalAndObject.upgrades[0].level)) {
    case 1: {
      multitapButton.innerHTML = numberWithCommas(1500);
      break;
    }
    case 2: {
      multitapButton.innerHTML = numberWithCommas(3000);
      break;
    }
    case 3: {
      multitapButton.innerHTML = numberWithCommas(6000);
      break;
    }
    case 4: {
      multitapButton.innerHTML = numberWithCommas(15000);
      break;
    }
    case 5: {
      multitapButton.innerHTML = `Max Level`;
      multitapButton.setAttribute("disabled", "true");
      break;
    }
  }
  switch (Number(globalAndObject.upgrades[2].level)) {
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
function showBoostError(msg) {
  document.getElementById("boostError").innerHTML = msg;
  document.getElementById("boostError").style.display = "flex";
  setTimeout(() => {
    removeBoostError();
  }, 3000);
}
function removeBoostError() {
  document.getElementById("boostError").innerHTML = ``;
  document.getElementById("boostError").style.display = `none`;
}
function loadFriends() {
  let frDiv = document.getElementById("friendsDiv");
  if (friends.length == 0) {
    frDiv.innerHTML = `<div id="emptyFriend">You have no friends</div>`;
  } else {
    for (const fr of friends) {
      frDiv.innerHTML += `<div class="friendItem"><div class="friendItemleft">@${
        fr.name
      }</div><div class="friendItemright"><img src="./img/Group 1124.png">${numberWithCommas(
        fr.coins
      )}</div></div>`;
    }
  }
}
function showAllError() {
  document.getElementById("mainError").style.display = "flex";
  clearInterval(coinSync);
  clearInterval(objectSync);
}
let buyUsdt = document.getElementById("buyUsdt");
let buyUsdtModal = document.getElementById("usdtBuyModal");
buyUsdt.addEventListener("click", () => {
  buyUsdtModal.style.display = "flex";
  document.getElementById(
    "buymodalAmount"
  ).innerHTML = `You have ${numberWithCommas(coins)} $AND`;
  document.getElementById(
    "buymodalAmount2"
  ).innerHTML = `Move the slider to select how much USDT you want to buy`;
});
document.getElementById("buymodalclose").addEventListener("click", () => {
  buyUsdtModal.style.display = "none";
});
slider2.oninput = () => {
  let maxPossible = coins / usdtPrice;
  let howMany = (maxPossible / 100) * Number(slider2.value);
  document.getElementById(
    "buymodalAmount2"
  ).innerHTML = `You have selected <img src="./img/coin/usdt.png" id="cryptoPictureB"> ${howMany.toFixed(
    1
  )}`;
};
document.getElementById("goForusdtBuy").addEventListener("click", () => {
  let maxPossible = coins / usdtPrice;
  let howMany = ((maxPossible / 100) * Number(slider2.value)).toFixed(1);
  socket.send(
    `{"action":"buyUsdt","tgId":"${parsedTGdata.user.id}","usdttobuy": "${howMany}"}`
  );
  updateEverything();
});
function loadTransactions() {}
function updateEverything() {
  socket.send(`{"action":"getObject", "tgId":"${parsedTGdata.user.id}"}`);
  setTimeout(() => {
    updateBoost();
    updateEnergy();
    updateRank();
    updateWallet();
    loadCryptos();
    loadFriends();
    loadTasks();
    loadTransactions();
  }, 100);
}
function preventDoubleTap(element) {
  let lastTapTime = 0;
  element.addEventListener("touchstart", function (event) {
    const currentTime = new Date().getTime();
    if (currentTime - lastTapTime < 500) {
      event.preventDefault();
    } else {
      lastTapTime = currentTime;
    }
  });
}
Telegram.WebApp.ready();
