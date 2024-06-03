function Home(){
    document.querySelector("#HomePage").style.display = "block";
    document.querySelector("#TasksPage").style.display = "none";
}

function Tasks(){
    document.querySelector("#HomePage").style.display = "none";
    document.querySelector("#TasksPage").style.display = "block";
}
