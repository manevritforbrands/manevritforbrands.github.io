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
