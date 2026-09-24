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

// Главный экран: ролики в одном кадре сменяют друг друга каждые 3 секунды
const reel = document.querySelector('.reel');
if (reel) {
  const vids = [...reel.querySelectorAll('video')];
  const line = reel.querySelector('.cap-line');
  const EVERY = 3000;
  let cur = 0, muted = true;
  const warm = v => { if (v.preload !== 'auto') { v.preload = 'auto'; v.load(); } };
  const show = n => {
    vids.forEach((v, k) => {
      if (k === n) { warm(v); v.muted = muted; v.play().catch(() => {}); v.classList.add('on'); }
      else { v.classList.remove('on'); setTimeout(() => { if (!v.classList.contains('on')) v.pause(); }, 600); }
    });
    warm(vids[(n + 1) % vids.length]);
    if (line) { line.style.opacity = 0; setTimeout(() => { line.textContent = vids[n].dataset.caption || ''; line.style.opacity = 1; }, 300); }
  };
  show(0);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (vids.length > 1 && !reduce) setInterval(() => { cur = (cur + 1) % vids.length; show(cur); }, EVERY);
  const snd = document.querySelector('[data-sound]');
  if (snd) snd.addEventListener('click', e => {
    e.preventDefault(); muted = !muted; vids[cur].muted = muted;
    snd.textContent = muted ? 'включить звук' : 'выключить звук';
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
document.querySelectorAll('.clip video').forEach(v => clipObserver.observe(v));
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

// Фото на весь экран, со стрелками по всем фото страницы
const lb = document.getElementById('lightbox');
if (lb) {
  const tiles = [...document.querySelectorAll('.tile')];
  const img = lb.querySelector('img');
  let at = 0;
  const open = n => { at = (n + tiles.length) % tiles.length; img.src = tiles[at].getAttribute('href'); if (!lb.open) lb.showModal(); };
  tiles.forEach((t, n) => t.addEventListener('click', e => { e.preventDefault(); open(n); }));
  lb.querySelector('.prev').addEventListener('click', () => open(at - 1));
  lb.querySelector('.next').addEventListener('click', () => open(at + 1));
  lb.addEventListener('click', e => { if (e.target.closest('[data-close]') || e.target.classList.contains('wrap')) lb.close(); });
  addEventListener('keydown', e => { if (!lb.open) return; if (e.key === 'ArrowLeft') open(at - 1); if (e.key === 'ArrowRight') open(at + 1); });
}

// Слоты под будущие ролики: блок появляется, только если его файл уже лежит в репозитории
document.querySelectorAll('template.slot').forEach(t => {
  fetch(t.dataset.probe, { method: 'HEAD' }).then(r => {
    if (!r.ok) return;
    const node = t.content.cloneNode(true);
    const vs = [...node.querySelectorAll('.clip video')];
    t.replaceWith(node);
    vs.forEach(v => clipObserver.observe(v));
  }).catch(() => {});
});
