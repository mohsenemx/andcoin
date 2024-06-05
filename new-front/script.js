function Home(){
    document.querySelector("#HomePage").style.display = "block";
    document.querySelector("#TasksPage").style.display = "none";
    document.querySelector("#TradePage").style.display = "none";
    document.querySelector("#BoostPage").style.display = "none";
    document.querySelector("#BoostPage").style.display = "none";
    document.querySelector("#WalletPage").style.display = "none";
}

function Tasks(){
    document.querySelector("#HomePage").style.display = "none";
    document.querySelector("#TasksPage").style.display = "block";
    document.querySelector("#TradePage").style.display = "none";
    document.querySelector("#BoostPage").style.display = "none";
    document.querySelector("#Walletpage").style.display = "none";
}

function Trade(){
    document.querySelector("#HomePage").style.display = "none";
    document.querySelector("#TasksPage").style.display = "none";
    document.querySelector("#TradePage").style.display = "block";
    document.querySelector("#BoostPage").style.display = "none";
    document.querySelector("#WalletPage").style.display = "none";
}
function Boost(){
    document.querySelector("#HomePage").style.display = "none";
    document.querySelector("#TasksPage").style.display = "none";
    document.querySelector("#TradePage").style.display = "none";
    document.querySelector("#BoostPage").style.display = "block";
    document.querySelector("#WalletPage").style.display = "none";
}
function Wallet(){
    document.querySelector("#HomePage").style.display = "none";
    document.querySelector("#TasksPage").style.display = "none";
    document.querySelector("#TradePage").style.display = "none";
    document.querySelector("#BoostPage").style.display = "none";
    document.querySelector("#WalletPage").style.display = "block";
}


