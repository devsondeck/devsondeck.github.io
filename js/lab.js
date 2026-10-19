import { reduce, wait, onFrame } from './motion.js';
import { target } from './pointer.js';

const GLYPHS = '#$%&@!?*<>/\\=+';
const TICKS = 10;

function initStamp() {
  const stamp = document.getElementById('stamp');
  const dossier = document.getElementById('dossier');
  if (!stamp || !dossier || reduce) return;
  const io = new IntersectionObserver(
    ([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      wait(450).then(() => {
        stamp.classList.add('slam');
        dossier.classList.add('shake');
      });
    },
    { threshold: 0.6 }
  );
  io.observe(stamp);
}

function initRedactions() {
  document.querySelectorAll('.red').forEach((red) => {
    const len = +red.dataset.len || 6;
    const orig = red.textContent;
    let timer = 0;
    red.tabIndex = 0;
    red.setAttribute('role', 'img');
    red.setAttribute('aria-label', 'redacted');
    const crack = () => {
      clearInterval(timer);
      red.classList.add('cracking');
      let n = 0;
      timer = setInterval(() => {
        if (++n >= TICKS) {
          clearInterval(timer);
          red.textContent = 'nice try';
          return;
        }
        red.textContent = Array.from({ length: len }, () => GLYPHS[(Math.random() * GLYPHS.length) | 0]).join('');
      }, 55);
    };
    const restore = () => {
      clearInterval(timer);
      red.classList.remove('cracking');
      red.textContent = orig;
    };
    red.addEventListener('mouseenter', crack);
    red.addEventListener('focus', crack);
    red.addEventListener('mouseleave', restore);
    red.addEventListener('blur', restore);
  });
}

function initLean() {
  const big = document.getElementById('big');
  if (!big || reduce) return;
  let pageTop = 0;
  let left = 0;
  let w = 0;
  let h = 0;
  let sy = scrollY;
  const measure = () => {
    const r = big.getBoundingClientRect();
    sy = scrollY;
    pageTop = r.top + sy;
    left = r.left;
    w = r.width;
    h = r.height;
  };
  measure();
  addEventListener('scroll', () => (sy = scrollY), { passive: true });
  addEventListener('resize', measure, { passive: true });
  addEventListener('load', measure);
  onFrame(() => {
    const top = pageTop - sy;
    if (top > innerHeight || top + h < 0) return;
    const x = (target.x - (left + w / 2)) / innerWidth;
    const y = (target.y - (top + h / 2)) / innerHeight;
    big.style.transform = `perspective(1000px) rotateY(${x * 18}deg) rotateX(${-y * 14}deg)`;
  });
}

export function initLab() {
  initStamp();
  initRedactions();
  initLean();
}
