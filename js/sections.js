// Scroll-driven sections: the stripe, the vibe text and the cards.
import { reduce, onFrame } from './motion.js';

const MARK = '<svg aria-hidden="true"><use href="#mark"/></svg>';
const ITEMS = ['ai automations', MARK, 'ui that slaps', MARK, 'custom builds', MARK, 'no cap', MARK];

const clamp = (v) => Math.min(1, Math.max(0, v));

function initStripe(scroll) {
  const track = document.querySelector('.marquee .track');
  if (!track) return;
  const html = ITEMS.map((w) => (w === MARK ? w : `<span>${w}</span>`)).join('');
  track.innerHTML = html.repeat(4);
  if (reduce) return;

  // exact copy period: distance between the first item of copy 1 and copy 2 (includes the gap)
  let half = 0;
  const per = ITEMS.length;
  const measure = () => {
    half = track.children[per].offsetLeft - track.children[0].offsetLeft;
  };
  measure();
  window.addEventListener('resize', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  let off = 0;
  onFrame(() => {
    off -= 1 + Math.min(Math.abs(scroll.velocity()) * 0.6, 18);
    if (half && off < -half) off += half;
    track.style.transform = `translate3d(${off}px,0,0)`;
  });
}

function initVibe() {
  const mani = document.getElementById('mani');
  if (!mani) return;
  const split = (text, hot) =>
    text
      .split(/(\s+)/)
      .map((w) => (w.trim() ? `<span class="wd${hot ? ' hot' : ''}">${w}</span>` : w))
      .join('');
  mani.innerHTML = [...mani.childNodes]
    .map((n) => split(n.textContent, n.nodeType !== 3))
    .join('');
  if (reduce) return;

  const wds = [...mani.querySelectorAll('.wd')];
  let lit = 0;
  const update = () => {
    const r = mani.getBoundingClientRect();
    const p = clamp((innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35));
    const n = Math.round(p * wds.length);
    if (n === lit) return;
    wds.forEach((w, i) => w.classList.toggle('lit', i < n));
    lit = n;
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}

function initCards() {
  const tiles = [...document.querySelectorAll('.tile')];
  if (!tiles.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const delay = [...e.target.parentNode.children].indexOf(e.target) * 140;
        setTimeout(() => e.target.classList.add('show'), delay);
        io.unobserve(e.target);
      });
    },
    { threshold: 0.15 },
  );
  tiles.forEach((t) => io.observe(t));

  if (reduce || !window.matchMedia('(hover: hover)').matches) return;
  const invalidators = [];
  const invalidateAll = () => invalidators.forEach((fn) => fn());
  window.addEventListener('scroll', invalidateAll, { passive: true });
  window.addEventListener('resize', invalidateAll);
  tiles.forEach((tile) => {
    if (tile.id === 'dossier') return;
    const inner = tile.querySelector('.tilt');
    // pointer events live on the static tile; only the .tilt layer transforms
    let rect = null;
    const invalidate = () => {
      rect = null;
    };
    invalidators.push(invalidate);
    tile.addEventListener('mousemove', (e) => {
      if (!rect) rect = tile.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const fx = x / rect.width - 0.5;
      const fy = y / rect.height - 0.5;
      inner.style.setProperty('--mx', `${x}px`);
      inner.style.setProperty('--my', `${y}px`);
      inner.style.setProperty('--px', fx.toFixed(3));
      inner.style.setProperty('--py', fy.toFixed(3));
      inner.style.transform = `perspective(1200px) rotateY(${fx * 18}deg) rotateX(${-fy * 18}deg) translateZ(10px)`;
    });
    tile.addEventListener('mouseleave', () => {
      invalidate();
      inner.style.transform = '';
      inner.style.setProperty('--px', 0);
      inner.style.setProperty('--py', 0);
    });
  });
}

export function initSections(scroll) {
  initStripe(scroll);
  initVibe();
  initCards();
}
