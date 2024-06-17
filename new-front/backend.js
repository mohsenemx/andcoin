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
let tasks = [];
let cryptos = [];
let friends = [];
let usdtPrice = 6000;
const socket = new WebSocket("wss://127.0.0.1:8081/");
setTimeout(() => {
  if (typeof userObject == "undefined") {
    showError("DVE-33");
  }
}, 1000);
function init() {
  if (Telegram.WebApp.platform == "unknown") {
    showError("TGE-21");
    return;
  }
  socket.send(
    `{"action":"login", "name": "${user.username}", "tgId": "${user.id}"}`
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
  if (
    Number(userObject.lastClaimed) > 10800000 ||
    Number(userObject.lastClaimed == 0)
  ) {
  }
}
function updateWallet() {
  let usdtvalue = document.getElementById("money");
  let andvalue = document.getElementById("and-balance");
  usdtvalue.innerHTML = numberWithCommas(userObject.usdt);
  andvalue.innerHTML = numberWithCommas(userObject.coins);
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
            <button class="join-btn" data-id="${task.id}" ${
      doneTask ? "disabled" : "notDone"
    }>${
      doneTask ? "Done" : task.task == "joinChannel" ? "Join" : "Go"
    } </button>
          </div>
    `;
  }
}

function updateEverything() {
  performSync();
  updateWallet();
  updateTasks();
}
document.getElementById('referral-btn').addEventListener('click', () => {
  socket.send(`{"action":"getReferalCode", "tgId":"${user.id}"`);
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
