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
// Там же — список заготовок, которые уже лежат в репозитории (slots, case): по нему, а не запросами вслепую, решается, что показать
const content = fetch('/content.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).catch(() => null);
content.then(c => {
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

// Главная: тонкие линии перспективы от углов кадра к краям экрана. Звёзды — общий слой .space ниже.
// Кадр не трогаем. Только на компьютере с мышью; при «уменьшить движение» — ничего
const hall = document.querySelector('.hero .reel');
if (hall && matchMedia('(min-width:761px) and (hover:hover) and (pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const hero = hall.parentElement, c = document.createElement('canvas'), x = c.getContext('2d');
  c.className = 'hall'; c.setAttribute('aria-hidden', 'true'); hero.appendChild(c);
  let W, H, dpr, mx = 0, my = 0, tx = 0, ty = 0, on = true;
  const size = () => { dpr = devicePixelRatio || 1; W = hero.clientWidth; H = hero.clientHeight; c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px'; };
  size(); addEventListener('resize', size);
  addEventListener('pointermove', e => { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; });
  // шторки съехались — полосы над и под кадром становятся прозрачными, сквозь них видно звёзды
  setTimeout(() => hero.classList.add('open'), 2100);
  new IntersectionObserver(es => { on = es[0].isIntersecting; if (on) requestAnimationFrame(draw); }).observe(hero);
  const lerp = (a, b, t) => a + (b - a) * t;
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

// Слоты под будущие ролики и фото: блок появляется, только если его имя вписано в content.json → slots
// (имя — начало имени файла из data-probe, например niche-fashion). Без списка сервер не опрашивается
content.then(c => {
  const have = new Set((c && c.slots) || []);
  document.querySelectorAll('template.slot').forEach(t => {
    if (!have.has(t.dataset.probe.split('/').pop().split('.')[0])) return;
    const node = t.content.cloneNode(true);
    const vs = [...node.querySelectorAll('.clip video')];
    const series = t.closest('.group.series');
    t.replaceWith(node);
    vs.forEach(v => clipObserver.observe(v));
    if (series) fitSeries(series);
  });
});

// Вход → выход: блок собирается из case.json и показывается, только если в content.json стоит "case": true
content.then(cfg => cfg && cfg.case && document.querySelectorAll('[data-case]').forEach(sec => {
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
}));

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

// Шлейф за курсором: несколько светлых пылинок, всплывают и гаснут меньше чем за секунду. Только мышь, без «уменьшить движение»
if (matchMedia('(hover:hover) and (pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const c = document.createElement('canvas'), x = c.getContext('2d'), P = [];
  c.className = 'trail'; c.setAttribute('aria-hidden', 'true'); document.body.appendChild(c);
  let W, H, dpr, lx = null, ly = null, run = false;
  const size = () => { dpr = devicePixelRatio || 1; W = innerWidth; H = innerHeight; c.width = W * dpr; c.height = H * dpr; };
  size(); addEventListener('resize', size);
  const tick = () => {
    x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.x += p.vx; p.y += p.vy; p.vx *= .96; p.vy = p.vy * .96 - .003; p.life -= p.decay;
      if (p.life <= 0) { P.splice(i, 1); continue; }
      x.fillStyle = 'rgba(236,231,221,' + p.life * .45 + ')'; x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.283); x.fill();
    }
    if (P.length) requestAnimationFrame(tick); else { run = false; x.clearRect(0, 0, W, H); }
  };
  addEventListener('pointermove', e => {
    if (lx !== null) {
      const dx = e.clientX - lx, dy = e.clientY - ly, n = Math.min(3, Math.floor(Math.hypot(dx, dy) / 12));
      for (let i = 0; i < n; i++) { const k = Math.random(); P.push({ x: lx + dx * k + (Math.random() - .5) * 8, y: ly + dy * k + (Math.random() - .5) * 8, vx: (Math.random() - .5) * .3 + dx * .008, vy: (Math.random() - .5) * .3 - .1 + dy * .008, life: 1, decay: .02 + Math.random() * .02, r: .5 + Math.random() * 1.1 }); }
      if (P.length && !run) { run = true; requestAnimationFrame(tick); }
    }
    lx = e.clientX; ly = e.clientY;
  });
}

// Космос по бокам на всех страницах: неподвижный слой под содержимым, звёзды только в полях шире колонки 1360px.
// Три слоя глубины: при прокрутке ближние звёзды уходят быстрее дальних, от мыши расходятся; изредка падающая звезда.
// Только компьютер с мышью, без «уменьшить движение»
if (matchMedia('(min-width:761px) and (hover:hover) and (pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const c = document.createElement('canvas'), x = c.getContext('2d');
  c.className = 'space'; c.setAttribute('aria-hidden', 'true'); document.body.prepend(c);
  let W, H, dpr, side, mx = 0, my = 0, tx = 0, ty = 0, px = -1e4, py = -1e4;
  const size = () => { dpr = devicePixelRatio || 1; W = innerWidth; H = innerHeight; side = Math.max(0, (W - 1360) / 2); c.width = W * dpr; c.height = H * dpr; };
  size(); addEventListener('resize', size);
  addEventListener('pointermove', e => { tx = e.clientX / W - .5; ty = e.clientY / H - .5; px = e.clientX; py = e.clientY; });
  // z — глубина (0 далеко, 1 близко); ближние крупнее, ярче и подвижнее
  const stars = Array.from({ length: 170 }, () => { const z = Math.pow(Math.random(), 1.8); return { x: Math.random(), y: Math.random(), z, drift: .00001 + z * .00012, ph: Math.random() * 6.28, ox: 0, oy: 0 }; });
  let shoot = null, nextShoot = performance.now() + 6000 + Math.random() * 8000;
  const draw = t => {
    mx += (tx - mx) * .05; my += (ty - my) * .05;
    x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
    if (side > 8) {
      for (const d of stars) {
        d.y = (d.y - d.drift + 1) % 1;
        const X = d.x < .5 ? d.x * 2 * side : W - side + (d.x - .5) * 2 * side;
        const Y = ((d.y * H - scrollY * (.08 + d.z * .45)) % H + H) % H;
        const dx = X - px, dy = Y - py, dist = Math.hypot(dx, dy) || 1, push = Math.max(0, 1 - dist / 170);
        d.ox += (dx / dist * push * 46 - d.ox) * .08; d.oy += (dy / dist * push * 46 - d.oy) * .08;
        x.fillStyle = 'rgba(236,231,221,' + (.24 + d.z * .55) * (.55 + .45 * Math.sin(t / (700 + d.z * 900) + d.ph)) + ')';
        x.beginPath(); x.arc(X + d.ox - mx * 70 * d.z, Y + d.oy - my * 35 * d.z, .65 + d.z * 1.6, 0, 6.283); x.fill();
      }
      // падающая звезда: раз в 10–20 с, в одном из полей
      if (!shoot && t > nextShoot) { const left = Math.random() < .5; shoot = { x: left ? Math.random() * side * .6 : W - side * (.1 + Math.random() * .5), y: Math.random() * H * .5, vx: (left ? 1 : -1) * (2.2 + Math.random()), vy: 1.4 + Math.random() * .8, life: 1, left }; }
      if (shoot) {
        const s = shoot; s.x += s.vx; s.y += s.vy; s.life -= .014;
        if (s.life <= 0 || (s.left ? s.x > side : s.x < W - side)) { shoot = null; nextShoot = t + 10000 + Math.random() * 10000; }
        else { x.strokeStyle = 'rgba(236,231,221,' + s.life * .55 + ')'; x.lineWidth = 1; x.beginPath(); x.moveTo(s.x, s.y); x.lineTo(s.x - s.vx * 16, s.y - s.vy * 16); x.stroke(); }
      }
    }
    requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
}

// Кораблик вместо полосы прокрутки: едет по тонкой линии справа в такт прокрутке, носом по направлению движения,
// за ним короткий хвост пыли. Его можно тянуть мышью. Только компьютер с мышью
if (matchMedia('(hover:hover) and (pointer:fine)').matches) {
  document.documentElement.classList.add('shipbar');
  const bar = document.createElement('div'); bar.className = 'ship-track'; bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = '<svg class="ship" viewBox="0 0 20 34" width="16" height="27"><path d="M10 1C14 7 15.5 14 15 22l3.5 4.5v4.5L14 28.5 12.5 31h-5L6 28.5 1.5 31v-4.5L5 22C4.5 14 6 7 10 1z" fill="#000" stroke="#ece7dd" stroke-width="1.2" stroke-linejoin="round"/><circle cx="10" cy="12.5" r="2.2" fill="none" stroke="#ece7dd" stroke-width="1"/></svg><canvas class="ship-exhaust"></canvas>';
  document.body.appendChild(bar);
  const ship = bar.querySelector('.ship'), cv = bar.querySelector('canvas'), cx = cv.getContext('2d'), P = [];
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let y = 0, lastScroll = scrollY, dirDown = true, ang = 180, drag = null, run = false;
  const track = () => { const h = bar.clientHeight, max = document.documentElement.scrollHeight - innerHeight; return { h, max, p: max > 0 ? scrollY / max : 0 }; };
  const size = () => { cv.width = 40 * (devicePixelRatio || 1); cv.height = bar.clientHeight * (devicePixelRatio || 1); };
  size(); addEventListener('resize', size); addEventListener('load', size);
  const frame = () => {
    const { h, p } = track(), target = 14 + p * (h - 28);
    y += (target - y) * (still ? 1 : .18);
    const want = dirDown ? 180 : 0; ang += (want - ang) * .15;
    ship.style.transform = 'translate(-50%,' + (y - 13.5) + 'px) rotate(' + ang + 'deg)';
    const d = devicePixelRatio || 1; cx.setTransform(d, 0, 0, d, 0, 0); cx.clearRect(0, 0, 40, h);
    if (!still && Math.abs(target - y) > .6) { const tail = dirDown ? -1 : 1; for (let i = 0; i < 2; i++) P.push({ x: 20 + (Math.random() - .5) * 4, y: y + tail * 15, vx: (Math.random() - .5) * .3, vy: tail * (.4 + Math.random() * .6), life: 1 }); }
    for (let i = P.length - 1; i >= 0; i--) { const q = P[i]; q.x += q.vx; q.y += q.vy; q.life -= .05; if (q.life <= 0) { P.splice(i, 1); continue; } cx.fillStyle = 'rgba(236,231,221,' + q.life * .5 + ')'; cx.beginPath(); cx.arc(q.x, q.y, .5 + q.life, 0, 6.283); cx.fill(); }
    if (Math.abs(target - y) > .3 || P.length || Math.abs(want - ang) > .5) requestAnimationFrame(frame); else run = false;
  };
  const kick = () => { if (!run) { run = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', () => { if (scrollY !== lastScroll) dirDown = scrollY > lastScroll; lastScroll = scrollY; kick(); }, { passive: true });
  // тянуть кораблик или щёлкнуть по линии — как по обычному ползунку
  const toScroll = e => { const r = bar.getBoundingClientRect(), { max } = track(); scrollTo({ top: Math.min(1, Math.max(0, (e.clientY - r.top - 14) / (r.height - 28))) * max }); };
  bar.addEventListener('pointerdown', e => { drag = e.pointerId; bar.setPointerCapture(drag); bar.classList.add('grab'); toScroll(e); });
  bar.addEventListener('pointermove', e => { if (drag === e.pointerId) toScroll(e); });
  bar.addEventListener('pointerup', () => { drag = null; bar.classList.remove('grab'); });
  y = 14 + track().p * (bar.clientHeight - 28); kick();
}

