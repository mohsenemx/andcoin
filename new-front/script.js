if (!Telegram.WebApp.isExpanded) Telegram.WebApp.expand();
function Home(){
    document.querySelector("#HomePage").style.display = "block";
    document.querySelector("#TasksPage").style.display = "none";
    document.querySelector("#TradePage2").style.display = "none";
    document.querySelector("#TradePage1").style.display = "none";
    document.querySelector("#BoostPage").style.display = "none";
    document.querySelector("#WalletPage").style.display = "none";
    document.querySelector("#tasks-footer").style.display = "none";
}

function Tasks(){
    document.querySelector("#HomePage").style.display = "none";
    document.querySelector("#TasksPage").style.display = "block";
    document.querySelector("#TradePage2").style.display = "none";
    document.querySelector("#TradePage1").style.display = "none";
    document.querySelector("#BoostPage").style.display = "none";
    document.querySelector("#WalletPage").style.display = "none";
    document.querySelector("#tasks-footer").style.display = "block";
}

function Trade(){
    document.querySelector("#HomePage").style.display = "none";
    document.querySelector("#TasksPage").style.display = "none";
    document.querySelector("#TradePage2").style.display = "block";
    document.querySelector("#TradePage1").style.display = "none";
    document.querySelector("#BoostPage").style.display = "none";
    document.querySelector("#WalletPage").style.display = "none";
}
function Boost(){
    document.querySelector("#HomePage").style.display = "none";
    document.querySelector("#TasksPage").style.display = "none";
    document.querySelector("#TradePage2").style.display = "none";
    document.querySelector("#TradePage1").style.display = "none";
    document.querySelector("#BoostPage").style.display = "block";
    document.querySelector("#WalletPage").style.display = "none";
}
function Wallet(){
    document.querySelector("#HomePage").style.display = "none";
    document.querySelector("#TasksPage").style.display = "none";
    document.querySelector("#TradePage2").style.display = "none";
    document.querySelector("#TradePage1").style.display = "none";
    document.querySelector("#BoostPage").style.display = "none";
    document.querySelector("#WalletPage").style.display = "block";
}


function TradeETH(){
    document.querySelector("#HomePage").style.display = "none";
    document.querySelector("#TasksPage").style.display = "none";
    document.querySelector("#TradePage1").style.display = "block";
    document.querySelector("#TradePage2").style.display = "none";
    document.querySelector("#BoostPage").style.display = "none";
    document.querySelector("#WalletPage").style.display = "none";

    document.querySelector("#cGet-info").innerHTML = "<img width='32px' height='32px' src='./TradePageIcons/ETH.png' alt=''><div style='font-size: 18px;margin-left: 10px;'>ETH</div>";
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
  }
Telegram.WebApp.setHeaderColor('#cbdef0');
Telegram.WebApp.setBackgroundColor('#cbdef0');
Telegram.WebApp.ready();