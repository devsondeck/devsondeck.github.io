// The three card stories: each card plays a short loop while it is on screen.
// Every play() resets its own DOM first; the shipped HTML is the finished state.
import { story, wait, onFrame } from './motion.js';

const $ = (id) => document.getElementById(id);

function initFlow() {
  const flow = $('flow');
  const edges = flow.querySelectorAll('.edge');
  const sparks = flow.querySelectorAll('.spark');
  const sub = (id, t) => { $(id).querySelector('small').textContent = t; };
  const nodes = [...flow.querySelectorAll('.node')];

  const reset = () => {
    for (const s of sparks) s.getAnimations().forEach((a) => a.cancel());
    for (const e of edges) e.classList.remove('hot');
    for (const n of nodes) n.classList.remove('active', 'work', 'pop');
    for (const id of ['n-sheet', 'n-slack']) { $(id).classList.remove('done'); sub(id, '—'); }
    sub('n-inbox', '142 new');
    sub('n-inv', '38 unpaid');
    sub('n-agent', 'waiting…');
  };

  // resolves true if the run went stale
  const travel = async (i, stop, ms = 900) => {
    edges[i].classList.add('hot');
    try {
      await sparks[i].animate([{ strokeDashoffset: 14 }, { strokeDashoffset: -100 }],
        { duration: ms, easing: 'cubic-bezier(.55,0,.45,1)' }).finished;
    } catch { return true; }
    if (stop()) return true;
    edges[i].classList.remove('hot');
    return false;
  };
  const done = (id, text) => {
    const n = $(id);
    sub(id, text);
    n.classList.add('done', 'pop');
    setTimeout(() => n.classList.remove('pop'), 500);
  };
  const agent = (text, working) => {
    sub('n-agent', text);
    $('n-agent').classList.toggle('work', working);
  };

  story(flow, async (stop) => {
    reset();
    await wait(700); if (stop()) return;
    $('n-inbox').classList.add('active'); sub('n-inbox', '141 new');
    if (await travel(0, stop)) return;
    $('n-inbox').classList.remove('active');
    agent('reading order email', true);
    await wait(1100); if (stop()) return;
    sub('n-agent', 'logging the order');
    if (await travel(2, stop)) return;
    done('n-sheet', '✓ row added');
    await wait(700); if (stop()) return;
    $('n-inv').classList.add('active'); sub('n-inv', '37 unpaid');
    agent('waiting…', false);
    if (await travel(1, stop)) return;
    $('n-inv').classList.remove('active');
    agent('spotting overdue', true);
    await wait(1100); if (stop()) return;
    sub('n-agent', 'flagging finance');
    if (await travel(3, stop)) return;
    done('n-slack', '✓ team pinged');
    agent('2 done · 0 humans', false);
    await wait(3200);
  });
}

function initBuild() {
  const build = $('build');
  const win = build.querySelector('.win');
  const bar = $('b-bar'), pct = $('b-pct'), btn = $('b-btn'), ptr = $('b-ptr'), url = $('b-url');

  // button centre relative to the window, from offsets (immune to the card tilt)
  const target = () => {
    let x = btn.offsetWidth * 0.55, y = btn.offsetHeight * 0.45;
    for (let n = btn; n && n !== win; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; }
    return [x, y];
  };

  story(build, async (stop) => {
    build.className = 'viz';
    bar.style.transform = 'scaleX(0)'; pct.textContent = '0%'; url.textContent = 'localhost:3000';
    ptr.style.transition = 'none';
    ptr.style.setProperty('--px', win.offsetWidth * 0.78 + 'px');
    ptr.style.setProperty('--py', win.offsetHeight * 0.24 + 'px');
    void ptr.offsetWidth; // one reflow per run, so the pointer snaps back before it moves again
    ptr.style.transition = '';
    const [x, y] = target(); // measured once per run
    await wait(900); if (stop()) return; build.classList.add('s1');
    await wait(600); if (stop()) return; build.classList.add('s2');
    await wait(700); if (stop()) return; build.classList.add('s3');
    await wait(500); if (stop()) return; build.classList.add('s4');
    ptr.style.setProperty('--px', x + 'px'); ptr.style.setProperty('--py', y + 'px');
    await wait(1000); if (stop()) return;
    build.classList.add('s5'); url.textContent = 'building…';
    await wait(160); if (stop()) return;
    build.classList.remove('s5');
    const t0 = performance.now();
    await new Promise((resolve) => {
      const off = onFrame((t) => {
        const k = Math.min(1, Math.max(0, (t - t0) / 1400));
        if (stop()) { off(); resolve(); return; }
        const e = 1 - Math.pow(1 - k, 3);
        bar.style.transform = `scaleX(${e})`; pct.textContent = Math.round(e * 100) + '%';
        if (k >= 1) { off(); resolve(); }
      });
    });
    if (stop()) return;
    build.classList.remove('s4'); build.classList.add('s7'); url.textContent = 'checkout.yourstore.com';
    await wait(3400);
  });
}

function initTerm() {
  const term = $('term');
  const cmd = 'dod crawl --target competitors';
  const out = [
    '↳ 14 sites queued · 3 need a real browser',
    '<span class="p">✓</span> 1,284 products scraped <span class="dimmer">(2m 41s)</span>',
    '<span class="p">✓</span> prices diffed vs yesterday',
    '<span class="p">→</span> 23 price drops posted to #pricing',
  ];
  const line = (html, on) => {
    const d = document.createElement('div');
    d.className = on ? 'l on' : 'l';
    d.innerHTML = html;
    term.appendChild(d);
    return d;
  };

  story(term, async (stop) => {
    term.classList.add('run');
    term.replaceChildren();
    line('<span class="p">$</span> <span class="g"></span><span class="caret"></span>', true);
    const typed = term.querySelector('.g');
    await wait(600); if (stop()) return;
    for (const ch of cmd) {
      typed.textContent += ch;
      await wait(38 + Math.random() * 40); if (stop()) return;
    }
    term.querySelector('.caret').remove();
    await wait(350);
    for (const [i, html] of out.entries()) {
      if (stop()) return;
      const d = line(html, false);
      requestAnimationFrame(() => d.classList.add('on'));
      await wait(i === 0 ? 1100 : 650);
    }
    if (stop()) return;
    line('<span class="p">$</span> <span class="caret"></span>', true);
    await wait(3600);
  });
}

export function initStories() {
  initFlow();
  initBuild();
  initTerm();
}
