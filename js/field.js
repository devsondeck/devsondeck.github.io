import { reduce, onFrame } from './motion.js';
import { target } from './pointer.js';

const COLORS = { acc: '#f95721', acc2: '#ffab85', ink: '#ede8df' };

export function initField(canvas) {
  const glow = document.querySelector('.glow');
  let gx = innerWidth * 0.6;
  let gy = innerHeight * 0.4;
  let gw = glow ? glow.offsetWidth : 0;
  const place = () => {
    if (glow) glow.style.transform = `translate3d(${gx - gw / 2}px, ${gy - gw / 2}px, 0)`;
  };

  if (reduce) {
    // static glow only; nothing is drawn and nothing animates
    place();
    return;
  }

  const ctx = canvas.getContext('2d');
  let W = 0;
  let H = 0;
  let dpr = 1;
  let pts = [];

  function init() {
    dpr = Math.min(devicePixelRatio || 1, 1.75);
    W = canvas.width = Math.round(innerWidth * dpr);
    H = canvas.height = Math.round(innerHeight * dpr);
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    if (glow) gw = glow.offsetWidth;
    pts = [];
    const gap = (innerWidth < 860 ? 30 : 38) * dpr;
    for (let y = gap / 2; y < H; y += gap) {
      for (let x = gap / 2; x < W; x += gap) {
        const r = Math.random();
        pts.push({
          ox: x + (Math.random() - 0.5) * gap * 0.5,
          oy: y + (Math.random() - 0.5) * gap * 0.5,
          x, y, vx: 0, vy: 0,
          k: r < 0.22 ? 'acc' : r < 0.36 ? 'acc2' : 'ink',
          a: Math.random() * 0.22 + 0.08,
          ph: Math.random() * 6.28,
        });
      }
    }
  }
  init();
  addEventListener('resize', init);

  onFrame((t) => {
    const time = t / 1000;
    gx += (target.x - gx) * 0.04;
    gy += (target.y - gy) * 0.04;
    place();

    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.5 * dpr;
    const mx = target.x * dpr;
    const my = target.y * dpr;
    const R = 180 * dpr;
    for (const p of pts) {
      const wx = Math.sin(time * 0.8 + p.oy * 0.004 + p.ph * 0.3) * 5 * dpr;
      const wy = Math.cos(time * 0.6 + p.ox * 0.004) * 5 * dpr;
      const dx = p.x - mx;
      const dy = p.y - my;
      const d = Math.hypot(dx, dy) || 1;
      if (d < R) {
        const f = (1 - d / R) ** 2 * 2.2 * target.strength;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }
      p.vx += (p.ox + wx - p.x) * 0.035;
      p.vy += (p.oy + wy - p.y) * 0.035;
      p.vx *= 0.86;
      p.vy *= 0.86;
      p.x += p.vx;
      p.y += p.vy;
      const near = Math.max(0, 1 - d / (R * 1.7)) * target.strength;
      const ang = Math.atan2(my - p.y, mx - p.x) + Math.sin(time + p.ph) * 0.25 * (1 - near);
      const len = (2.2 + near * 9 + Math.sin(time * 1.4 + p.ph) * 0.8) * dpr;
      ctx.globalAlpha = Math.min(1, p.a + near * 0.65);
      ctx.strokeStyle = COLORS[p.k];
      const cx = Math.cos(ang) * len;
      const cy = Math.sin(ang) * len;
      ctx.beginPath();
      ctx.moveTo(p.x - cx, p.y - cy);
      ctx.lineTo(p.x + cx, p.y + cy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}
