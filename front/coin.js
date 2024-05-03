    /*   onclick   */
let currentPage = "home";
let globalAndObject = {};
function updateCurrentPage() {

}
// content

    tasks.onclick = function(){
        document.getElementById("modalTasks").style.display = "block";
    }
    trade.onclick = function(){
        document.getElementById("modalTrade").style.display = "block";
    }
    wallet.onclick = function(){
        document.getElementById("modalWalet").style.display = "block";
    }

// modal tarde

    home.onclick = function(){
        document.getElementById("modalTrade").style.display = "none";
    }
    tasks2.onclick = function(){
        document.getElementById("modalTrade").style.display = "none";
        document.getElementById("modalTasks").style.display = "block";
    }
    wallet2.onclick = function(){
        document.getElementById("modalWalet").style.display = "block";
    }

// modal tasks

    home2.onclick = function(){
        document.getElementById("modalTasks").style.display = "none";
        document.getElementById("modalTrade").style.display = "none";
    }
    trade2.onclick = function(){
        document.getElementById("modalTasks").style.display = "none";
        document.getElementById("modalTrade").style.display = "block";
    }
    wallet3.onclick = function(){
        document.getElementById("modalWalet").style.display = "block";
    }

// modal wallet

    back.onclick = function(){
        document.getElementById("modalWalet").style.display = "none";
    }
    tasks3.onclick = function(){
        document.getElementById("modalWalet").style.display = "none";
        document.getElementById("modalTasks").style.display = "block";
    }
    trade3.onclick = function(){
        document.getElementById("modalWalet").style.display = "none";
        document.getElementById("modalTrade").style.display = "block";
    }
    home3.onclick = function(){
        document.getElementById("modalWalet").style.display = "none";
        document.getElementById("modalTrade").style.display = "none";
        document.getElementById("modalTasks").style.display = "none";
    }

/*   transition coin   */

    coin.onclick = coinClicked();/*function() {
        // ذخیره سازی مقادیر اولیه
        var initialWidth = this.style.width;
        var initialHeight = this.style.height;

        // تغییرات مورد نظر
        this.style.width = '50%';
        this.style.height = '50%';
        this.style.transition = 'all 0.2s ease';

        // تنظیم یک تایمر برای بازگشت به حالت اولیه
        setTimeout(() => {
            this.style.width = initialWidth;
            this.style.height = initialHeight;
        }, 50); // زمان برگشت به حالت اولیه بعد از 0.5 ثانیه
    };*/
function coinClicked() {

}