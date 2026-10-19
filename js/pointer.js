import { reduce, onFrame } from './motion.js';

const IDLE_MS = 1800;

export const pointer = { x: innerWidth * 0.65, y: innerHeight * 0.45, last: -1e9 };
export const target = { x: pointer.x, y: pointer.y, strength: 0 };

addEventListener(
  'pointermove',
  (e) => {
    if (e.pointerType === 'touch') return;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.last = performance.now();
  },
  { passive: true }
);

// Keeps easing even with no real pointer: the idle ghost drifts across the page.
function updateTarget(t) {
  const time = t / 1000;
  const idle = t - pointer.last > IDLE_MS;
  const tx = idle ? innerWidth * (0.5 + 0.32 * Math.sin(time * 0.23)) : pointer.x;
  const ty = idle ? innerHeight * (0.5 + 0.28 * Math.sin(time * 0.31 + 1.2)) : pointer.y;
  const k = idle ? 0.02 : 0.25;
  target.x += (tx - target.x) * k;
  target.y += (ty - target.y) * k;
  target.strength += ((idle ? 0.55 : 1) - target.strength) * 0.05;
}

function initCursor() {
  const dot = document.querySelector('.cur-dot');
  const ring = document.querySelector('.cur-ring');
  if (!dot || !ring) return;
  const show = (e) => {
    if (e.pointerType === 'touch') return;
    document.documentElement.classList.add('has-cursor');
    removeEventListener('pointermove', show);
  };
  addEventListener('pointermove', show, { passive: true });
  let rx = pointer.x;
  let ry = pointer.y;
  onFrame(() => {
    rx += (pointer.x - rx) * 0.16;
    ry += (pointer.y - ry) * 0.16;
    dot.style.transform = `translate3d(${pointer.x}px,${pointer.y}px,0)`;
    ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
  });
  document.querySelectorAll('a, button, .tile').forEach((el) => {
    el.addEventListener('mouseenter', () => ring.classList.add('big'));
    el.addEventListener('mouseleave', () => ring.classList.remove('big'));
  });
}

function initMagnetic() {
  document.querySelectorAll('.mag').forEach((mag) => {
    const t = mag.querySelector('.t');
    mag.addEventListener('mousemove', (e) => {
      const r = mag.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      mag.style.transition = 'transform .15s ease-out';
      mag.style.transform = `translate(${x * 0.35}px,${y * 0.45}px)`;
      if (t) t.style.transform = `translate(${x * 0.15}px,${y * 0.2}px)`;
    });
    mag.addEventListener('mouseleave', () => {
      mag.style.transition = 'transform .7s cubic-bezier(.16,1,.3,1)';
      mag.style.transform = '';
      if (t) t.style.transform = '';
    });
  });
}

export function initPointer() {
  onFrame(updateTarget);
  if (reduce) return;
  if (matchMedia('(pointer: fine)').matches) initCursor();
  // hover-only effects never bind on touch, so nothing can get stuck after a tap
  if (matchMedia('(hover: hover)').matches) initMagnetic();
}
