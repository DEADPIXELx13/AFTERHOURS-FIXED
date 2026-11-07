(function(){var c=document.getElementById('counter');if(c){var n=Number(localStorage.getItem('ahcounter')||4281)+1;localStorage.setItem('ahcounter',n);c.textContent=String(n).padStart(6,'0');}})();
