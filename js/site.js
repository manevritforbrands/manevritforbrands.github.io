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
  // Цены на «Стоимости»: пустая — остаётся «по запросу»
  Object.entries(c.prices || {}).forEach(([k, text]) => {
    const el = text && document.querySelector(`[data-price="${k}"]`);
    if (el) el.textContent = text;
  });
}).catch(() => {});

// Главный экран: ролики в одном кадре сменяют друг друга каждые 3 секунды. Только картинка, без звука и подписей
const reel = document.querySelector('.reel');
if (reel) {
  // Вертикальные ролики (data-only="phone") — только в кадре 4:5 на телефоне; в широком кадре компьютера от них осталась бы узкая полоса
  const phone = matchMedia('(max-width:760px)').matches;
  reel.querySelectorAll('video[data-only="phone"]').forEach(v => { if (!phone) v.remove(); });
  const vids = [...reel.querySelectorAll('video')];
  const EVERY = 3000;
  let cur = 0;
  const warm = v => { if (v.preload !== 'auto') { v.preload = 'auto'; v.load(); } };
  const show = n => {
    vids.forEach((v, k) => {
      if (k === n) { warm(v); v.muted = true; v.play().catch(() => {}); v.classList.add('on'); }
      else { v.classList.remove('on'); setTimeout(() => { if (!v.classList.contains('on')) v.pause(); }, 600); }
    });
    warm(vids[(n + 1) % vids.length]);
  };
  show(0);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (vids.length > 1 && !reduce) setInterval(() => { cur = (cur + 1) % vids.length; show(cur); }, EVERY);
}

// Поля по бокам от кадра на главной: зал тонкими линиями, ряды кресел и пыль в свете проектора.
// Кадр не трогаем. Только на компьютере с мышью; при «уменьшить движение» — ничего
const hall = document.querySelector('.hero .reel');
if (hall && matchMedia('(min-width:761px) and (hover:hover) and (pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const hero = hall.parentElement, c = document.createElement('canvas'), x = c.getContext('2d');
  c.className = 'hall'; c.setAttribute('aria-hidden', 'true'); hero.appendChild(c);
  let W, H, dpr, mx = 0, my = 0, tx = 0, ty = 0, px = -1e4, py = -1e4, on = true;
  const size = () => { dpr = devicePixelRatio || 1; W = hero.clientWidth; H = hero.clientHeight; c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px'; };
  size(); addEventListener('resize', size);
  addEventListener('pointermove', e => { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; const h = hero.getBoundingClientRect(); px = e.clientX - h.left; py = e.clientY - h.top; });
  new IntersectionObserver(es => { on = es[0].isIntersecting; if (on) requestAnimationFrame(draw); }).observe(hero);
  const lerp = (a, b, t) => a + (b - a) * t;
  const dust = Array.from({ length: 130 }, () => ({ x: Math.random(), y: Math.random(), z: Math.random(), vx: (Math.random() - .5) * .00012, vy: -(.00005 + Math.random() * .00016), ph: Math.random() * 6.28, ox: 0, oy: 0 }));
  const seat = (sx, yy, sw, sh) => { x.beginPath(); x.moveTo(sx, yy + sh); x.lineTo(sx, yy + sw * .32); x.quadraticCurveTo(sx, yy, sx + sw * .3, yy); x.lineTo(sx + sw * .7, yy); x.quadraticCurveTo(sx + sw, yy, sx + sw, yy + sw * .32); x.lineTo(sx + sw, yy + sh); };
  function draw(t) {
    if (!on) return;
    mx += (tx - mx) * .05; my += (ty - my) * .05;
    const L = hall.offsetLeft, T = hall.offsetTop, R = L + hall.offsetWidth, B = T + hall.offsetHeight;
    const ox = -mx * 110, oy = -my * 60, C = [[ox, oy], [W + ox, oy], [ox, H + oy], [W + ox, H + oy]];
    x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H); x.save();
    x.beginPath(); x.rect(0, 0, W, H); x.rect(L, T, R - L, B - T); x.clip('evenodd');
    // линии потолка и пола от углов кадра
    x.lineWidth = 1; x.strokeStyle = 'rgba(236,231,221,.12)';
    [[L, T, C[0]], [R, T, C[1]], [L, B, C[2]], [R, B, C[3]]].forEach(([a, b, [e, f]]) => { x.beginPath(); x.moveTo(a, b); x.lineTo(e, f); x.stroke(); });
    // стеновые панели в перспективе
    x.strokeStyle = 'rgba(236,231,221,.075)';
    for (const [ex, ct, cb] of [[L, C[0], C[2]], [R, C[1], C[3]]]) for (const p of [.12, .27, .46, .7, 1]) {
      const k = Math.pow(p, 1.7), X = lerp(ex, ct[0], k);
      x.beginPath(); x.moveTo(X, lerp(T, ct[1], k)); x.lineTo(X, lerp(B, cb[1], k)); x.stroke();
    }
    // ряды кресел: ближний ряд смещается от мыши сильнее — глубина
    for (let row = 0; row < 4; row++) {
      const k = Math.pow((row + 1) / 4.4, 1.4), par = lerp(.2, 1.3, k), sw = lerp(20, 64, k), gap = sw * .18;
      for (const left of [true, false]) {
        const x0 = lerp(left ? L : R, left ? C[2][0] : C[3][0], k) - mx * 90 * par, y0 = lerp(B, H + oy, k) - lerp(4, 40, k) - my * 30 * par;
        let sx = x0 + (left ? -sw - gap : gap);
        for (let n = 0; n < 30 && (left ? sx + sw > -20 : sx < W + 20); n++) {
          seat(sx, y0 + Math.abs(sx - x0) * .05, sw, sw * .9);
          x.fillStyle = '#050505'; x.fill(); x.strokeStyle = 'rgba(236,231,221,' + (.07 + k * .08) + ')'; x.stroke();
          sx += (left ? -1 : 1) * (sw + gap);
        }
      }
    }
    // пыль: плывёт вверх, мерцает, расходится от мыши
    for (const d of dust) {
      d.x += d.vx; d.y += d.vy; if (d.y < -.02) { d.y = 1.02; d.x = Math.random(); } d.x = (d.x + 1) % 1;
      const X = d.x < .5 ? d.x * 2 * L : R + (d.x - .5) * 2 * (W - R), Y = d.y * H;
      const dx = X - px, dy = Y - py, dist = Math.hypot(dx, dy) || 1, push = Math.max(0, 1 - dist / 170);
      d.ox += (dx / dist * push * 46 - d.ox) * .08; d.oy += (dy / dist * push * 46 - d.oy) * .08;
      x.fillStyle = 'rgba(236,231,221,' + (.18 + d.z * .5) * (.6 + .4 * Math.sin(t / 900 + d.ph)) + ')';
      x.beginPath(); x.arc(X + d.ox - mx * 40 * d.z, Y + d.oy - my * 20 * d.z, .7 + d.z * 1.5, 0, 6.283); x.fill();
    }
    x.restore(); requestAnimationFrame(draw);
  }
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
  // Превью — не ссылки (иначе браузер показывает адрес файла внизу), поэтому с клавиатуры открываются по Enter и пробелу
  document.addEventListener('keydown', e => { const t = e.target.closest && e.target.closest('.vtile'); if (!t || (e.key !== 'Enter' && e.key !== ' ')) return; e.preventDefault(); collect(); open(list.indexOf(t)); });
  player.querySelector('.prev').addEventListener('click', () => open(at - 1));
  player.querySelector('.next').addEventListener('click', () => open(at + 1));
  player.querySelector('[data-close]').addEventListener('click', () => player.close());
  player.addEventListener('click', e => { if (e.target.classList.contains('stage')) player.close(); });
  player.addEventListener('close', () => v.pause());
  addEventListener('keydown', e => { if (!player.open) return; if (e.key === 'ArrowLeft') open(at - 1); if (e.key === 'ArrowRight') open(at + 1); });
}
