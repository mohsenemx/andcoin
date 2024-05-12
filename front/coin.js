/*   onclick   */
let currentPage = "home";
let globalAndObject = {};
let parsedTGdata = parseTGvalues(window.location.hash);
let coinsSinceLastSync = 0;
let coins = 0;
let upgrades = [];
let coinsDisplay = document.getElementById("coinsDisplay");
let atasks = [];

const socket = new WebSocket("ws://localhost:8081");
setTimeout(() => {
  if (parsedTGdata == false) {
    alert("Required data is missing, please reload the page");
  }
},1000);
socket.onopen = function (event) {
    // Alert the user that they are 
    // connected to the WebSocket server
    socket.send(`{"action":"login", "name": "${parsedTGdata.user.username}"}`);
    setTimeout(function () {
        socket.send(`{"action":"getObject", "name": "${parsedTGdata.user.username}"}`);
    },100);
    setTimeout(function () {
      socket.send(`{"action":"getTasks"}`);
    }, 200);
};
socket.onmessage = function (event) {
  // Handle received message
  let pjson = JSON.parse(event.data);
  if (pjson.action == 'getObject') {
    
    globalAndObject = pjson.object;
    upgrades = globalAndObject.upgrades;
    coins = globalAndObject.coins;
    coinsDisplay.innerHTML = numberWithCommas(coins);
    updateRank();
    console.log(globalAndObject);
  } else if (pjson.action == 'getTasks') {
    
    atasks = pjson.tasks;
    loadTasks();
  }
};
socket.onclose = function (event) {
  // Log a message when disconnected
  //  from the WebSocket server
    alert('Connection failed with server');
};;
let coinSync = setInterval(function () {
    if (socket.CLOSED) return;
    socket.send(`{"action":"updateCoinsFromUser", "name": "${parsedTGdata.user.username}", "coins": "${coinsSinceLastSync}"}`);
    coinsSinceLastSync = 0;
},3000);
// content

tasks.onclick = function () {
  document.getElementById("modalTasks").style.display = "block";
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
    coins += upgrades[0].level;
    coinsSinceLastSync += upgrades[0].level;
    coinsDisplay.innerHTML = numberWithCommas(coins);
  } catch (e) {
    console.log(e);
  }
}
function updateRank() {
    document.getElementById("userRank").innerHTML = globalAndObject.rank;
}
function referFriend() {
  socket.send(`{"action":"getReferalCode","name":"${parsedTGdata.user.username}"}`);
}
function loadTasks() {
  let tasksDiv = document.getElementById("tasksdiv");
  tasksDiv.innerHTML = "";
  for (const task of atasks) {
    tasksDiv.innerHTML += `<div class="taskItem"><p>${task.name}</p><div class="taskButton"><button onclick="doTasks(this)" data-id="${task.id}">${(task.task == "joinChannel") ? "Join" : "Go" }</button></div></div>`;
  }
}
function doTasks(div) {
  console.log(div.getAttribute("data-id"));
}