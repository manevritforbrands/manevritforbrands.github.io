// Общие скрипты сайта: титр по буквам, карточка контактов, ролики на главной и превью по наведению.

// Титр бренда: каждая буква проявляется отдельно
document.querySelectorAll('.brand [data-split]').forEach((el, k) => {
  let i = k * 8;
  el.innerHTML = [...el.textContent].map(c => `<span class="l" style="--i:${i++}">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
});

// Карточка контактов: открывается из меню и подвала на любой странице
const contact = document.getElementById('contact');
if (contact) {
  document.querySelectorAll('[data-contact]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); contact.showModal(); }));
  contact.addEventListener('click', e => { if (e.target.closest('[data-close]') || !e.target.closest('.panel')) contact.close(); });
}

// Тексты, которые ждут данных от заказчика, вписываются в одном месте — content.json в корне.
// Подпись работы: у элемента с data-work="имя" — в data-caption (кадр на главной, плеер) или текстом (карточка)
fetch('/content.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(c => {
  if (!c) return;
  Object.entries(c.captions || {}).forEach(([work, text]) => {
    document.querySelectorAll(`[data-work="${work}"]`).forEach(el => {
      if ('caption' in el.dataset) el.dataset.caption = text;
      else { el.textContent = text; el.hidden = !text; }
    });
  });
}).catch(() => {});

// Главный экран: ролики в одном кадре сменяют друг друга каждые 3 секунды
const reel = document.querySelector('.reel');
if (reel) {
  const vids = [...reel.querySelectorAll('video')];
  const line = reel.querySelector('.cap-line');
  const EVERY = 3000;
  let cur = 0, muted = true;
  const warm = v => { if (v.preload !== 'auto') { v.preload = 'auto'; v.load(); } };
  const snd = document.querySelector('[data-sound]');
  const label = () => { if (snd) snd.textContent = muted ? 'включить звук' : 'выключить звук'; };
  // Если браузер не дал играть со звуком (iOS без жеста), ролик не встаёт: продолжаем без звука
  const play = v => v.play().catch(() => { if (!v.muted) { muted = true; label(); vids.forEach(o => { o.muted = true; }); v.play().catch(() => {}); } });
  const show = n => {
    vids.forEach((v, k) => {
      if (k === n) { warm(v); v.muted = muted; play(v); v.classList.add('on'); }
      else { v.classList.remove('on'); setTimeout(() => { if (!v.classList.contains('on')) v.pause(); }, 600); }
    });
    warm(vids[(n + 1) % vids.length]);
    if (line) { line.style.opacity = 0; setTimeout(() => { line.textContent = vids[n].dataset.caption || ''; line.style.opacity = 1; }, 300); }
  };
  show(0);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (vids.length > 1 && !reduce) setInterval(() => { cur = (cur + 1) % vids.length; show(cur); }, EVERY);
  if (snd) snd.addEventListener('click', e => {
    e.preventDefault(); muted = !muted;
    vids.forEach((v, k) => {
      v.muted = muted;
      // Safari разрешает звук только ролику, запущенному по нажатию, — поэтому в момент клика трогаем play у всех и тут же ставим невидимые на паузу
      if (!muted && k !== cur) { v.play().catch(() => {}); v.pause(); }
    });
    if (!muted) play(vids[cur]);
    label();
  });
}

// Карточки проектов: ролик грузится и играет только при наведении
document.querySelectorAll('.card').forEach(card => {
  const v = card.querySelector('video');
  if (!v) return;
  card.addEventListener('mouseenter', () => {
    if (v.preload !== 'auto') { v.preload = 'auto'; v.load(); }
    v.play().then(() => v.classList.add('ready')).catch(() => {});
  });
  card.addEventListener('mouseleave', () => v.pause());
});

// Ролики в портфолио: играют без звука, пока видны на экране; звук включается на конкретном ролике
const clipObserver = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target;
  if (e.isIntersecting) { if (v.preload !== 'auto') { v.preload = 'auto'; v.load(); } v.play().catch(() => {}); }
  else v.pause();
}), { threshold: .35 });
document.querySelectorAll('.clip video, .vtile video').forEach(v => clipObserver.observe(v));
document.addEventListener('click', e => {
  const b = e.target.closest('.clip .snd');
  if (!b) return;
  e.preventDefault();
  const v = b.closest('.clip').querySelector('video');
  const turnOn = v.muted;
  document.querySelectorAll('.clip video').forEach(o => { o.muted = true; });
  document.querySelectorAll('.clip .snd').forEach(o => { o.textContent = 'звук'; });
  v.muted = !turnOn; b.textContent = turnOn ? 'без звука' : 'звук';
  if (turnOn) v.play().catch(() => {});
});

// Фото на весь экран, со стрелками по всем фото страницы (список собирается при открытии — чтобы учесть фото из слотов)
const lb = document.getElementById('lightbox');
if (lb) {
  const img = lb.querySelector('img');
  let tiles = [], at = 0;
  const open = n => { tiles = [...document.querySelectorAll('.tile')]; at = (n + tiles.length) % tiles.length; img.src = tiles[at].getAttribute('href'); img.alt = tiles[at].querySelector('img').alt; if (!lb.open) lb.showModal(); };
  document.addEventListener('click', e => { const t = e.target.closest('.tile'); if (!t) return; e.preventDefault(); open([...document.querySelectorAll('.tile')].indexOf(t)); });
  lb.querySelector('.prev').addEventListener('click', () => open(at - 1));
  lb.querySelector('.next').addEventListener('click', () => open(at + 1));
  lb.addEventListener('click', e => { if (e.target.closest('[data-close]') || e.target.classList.contains('wrap')) lb.close(); });
  addEventListener('keydown', e => { if (!lb.open) return; if (e.key === 'ArrowLeft') open(at - 1); if (e.key === 'ArrowRight') open(at + 1); });
}

// Серия фото: ширина строки по числу кадров, которые реально стоят на странице (слоты без файла не в счёт)
const fitSeries = g => g.style.setProperty('--n', g.querySelectorAll('.row > .tile').length);
document.querySelectorAll('.group.series').forEach(fitSeries);

// Слоты под будущие ролики и фото: блок появляется, только если его файл уже лежит в репозитории
document.querySelectorAll('template.slot').forEach(t => {
  fetch(t.dataset.probe, { method: 'HEAD' }).then(r => {
    if (!r.ok) return;
    const node = t.content.cloneNode(true);
    const vs = [...node.querySelectorAll('.clip video')];
    const series = t.closest('.group.series');
    t.replaceWith(node);
    vs.forEach(v => clipObserver.observe(v));
    if (series) fitSeries(series);
  }).catch(() => {});
});

// Вход → выход: блок собирается из case.json и показывается, только если кейс уже лежит в репозитории
document.querySelectorAll('[data-case]').forEach(sec => {
  const base = sec.dataset.case;
  fetch(base + 'case.json').then(r => r.ok ? r.json() : null).then(c => {
    if (!c || !c.photos || !c.photos.length || !c.result) return;
    sec.querySelector('.io-photos').innerHTML = c.photos.map((p, i) => `<img src="${base + p}" alt="" loading="lazy" style="--i:${i}">`).join('');
    sec.querySelector('.io-out .clip').innerHTML =
      `<video poster="${base + c.result}.jpg" preload="none" muted loop playsinline>` +
      `<source src="${base + c.result}.h264.mp4" type="video/mp4; codecs=avc1.4d401f">` +
      `<source src="${base + c.result}.av1.mp4" type="video/mp4; codecs=av01.0.05M.08"></video><a class="snd" href="#">звук</a>`;
    sec.querySelector('.io-cap').textContent = c.caption || '';
    sec.hidden = false;
    clipObserver.observe(sec.querySelector('.io-out video'));
  }).catch(() => {});
});

// Проявление блоков при прокрутке; без JS и при «уменьшить движение» всё видно сразу
if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('js-reveal');
  const targets = document.querySelectorAll('.about > *, .section-title, .latest .card, .row > *, .group .note, .plan, .steps li, .io-grid');
  targets.forEach(el => {
    el.classList.add('reveal');
    const row = el.parentElement;
    if (row && (row.classList.contains('row') || row.classList.contains('latest'))) el.style.setProperty('--k', [...row.children].indexOf(el));
  });
  const ro = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  targets.forEach(el => ro.observe(el));
}

// Плеер: превью открывает ролик со звуком и управлением, стрелки листают все ролики страницы
const player = document.getElementById('player');
if (player) {
  const v = player.querySelector('video'), count = player.querySelector('.count'), cap = player.querySelector('.cap');
  let list = [], at = 0;
  const collect = () => { list = [...document.querySelectorAll('.vtile')]; };
  const open = n => {
    collect(); at = (n + list.length) % list.length;
    const t = list[at];
    v.poster = t.dataset.poster;
    v.innerHTML = `<source src="${t.dataset.h264}" type="video/mp4; codecs=avc1.4d401f"><source src="${t.dataset.av1}" type="video/mp4; codecs=av01.0.05M.08">`;
    v.load(); v.muted = false; v.play().catch(() => {});
    count.textContent = `${at + 1} / ${list.length}`;
    cap.textContent = t.dataset.caption || '';
    if (!player.open) player.showModal();
  };
  document.addEventListener('click', e => { const t = e.target.closest('.vtile'); if (!t) return; e.preventDefault(); collect(); open(list.indexOf(t)); });
  player.querySelector('.prev').addEventListener('click', () => open(at - 1));
  player.querySelector('.next').addEventListener('click', () => open(at + 1));
  player.querySelector('[data-close]').addEventListener('click', () => player.close());
  player.addEventListener('click', e => { if (e.target.classList.contains('stage')) player.close(); });
  player.addEventListener('close', () => v.pause());
  addEventListener('keydown', e => { if (!player.open) return; if (e.key === 'ArrowLeft') open(at - 1); if (e.key === 'ArrowRight') open(at + 1); });
}
