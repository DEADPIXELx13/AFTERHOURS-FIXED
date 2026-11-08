(function(){
  var c=document.getElementById('counter');
  if(c){var n=Number(localStorage.getItem('ahcounter')||4281)+1;localStorage.setItem('ahcounter',n);c.textContent=String(n).padStart(6,'0');}

  var nav=document.querySelector('#site nav');
  if(nav){
    nav.innerHTML='<a href="index.html">HOME</a><a href="photos.html">PHOTOS</a><a href="404.html">PORN</a><a href="404.html">GORE</a><a href="diary.html">DIARY</a><a href="videos.html">DREAMZ</a><a href="guestbook.html">GUESTBOOK</a>';
  }
})();
