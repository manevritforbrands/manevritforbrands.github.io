const A='../../assets/';
const WORKS=[
 {s:A+'garden-editorial.jpg',r:'4/5'},{s:A+'videos/racing-case.mp4',p:A+'videos/racing-case.jpg',r:'3/4',v:1},
 {s:A+'teal-fashion.jpg',r:'4/5'},{s:A+'jewellery-detail.jpg',r:'2/3'},{s:A+'lake-tailoring.jpg',r:'4/5'},
 {s:A+'videos/mono-case.mp4',p:A+'videos/mono-case.jpg',r:'1/1',v:1},{s:A+'tennis-lifestyle.jpg',r:'4/5'}];
const media=(w,cls='')=>w.v?`<video class="${cls}" src="${w.s}" poster="${w.p}" autoplay muted loop playsinline></video>`:`<img class="${cls}" src="${w.s}" alt="">`;
const NAV=`<nav><a class="logo" href="#">MANEVRIT</a><div class="links"><a class="on" href="#">Главная</a><a href="#">AI-видео</a><a href="#">AI-фото</a><a href="#">Стоимость</a><a href="#">Контакты</a></div><a class="tg" href="https://t.me/manevritforbrands">Telegram</a></nav>`;
document.body.insertAdjacentHTML('afterbegin',NAV);
