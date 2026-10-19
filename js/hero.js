import { reduce, onFrame } from './motion.js';
import { target } from './pointer.js';

const WORD_MS = 3200;
const CHAT_LOOP_MS = 9000;
// [message index | 't' for typing, delay in ms]
const CHAT_SEQ = [[0, 700], [1, 1500], [2, 2400], ['t', 3100], [3, 4700]];

function initIntro() {
  // two frames so the hidden start state is painted before the transition begins
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      document.getElementById('h1')?.classList.add('in');
      document.getElementById('sub')?.classList.add('show');
      document.getElementById('ctas')?.classList.add('show');
    })
  );
}

function initWords() {
  const words = [...document.querySelectorAll('#rot .word')];
  if (words.length < 2) return;
  let i = 0;
  setInterval(() => {
    const cur = words[i];
    i = (i + 1) % words.length;
    cur.classList.remove('on');
    cur.classList.add('out');
    words[i].classList.add('on');
    // once it has left, snap it back below the mask with no transition
    setTimeout(() => {
      cur.style.transition = 'none';
      cur.classList.remove('out');
      cur.offsetWidth;
      cur.style.transition = '';
    }, 900);
  }, WORD_MS);
}

function initChat() {
  const msgs = [...document.querySelectorAll('#chat .msg')];
  const typing = document.getElementById('typing');
  if (!msgs.length || !typing) return;
  const play = () => {
    msgs.forEach((m) => m.classList.remove('on'));
    typing.classList.remove('on');
    for (const [what, ms] of CHAT_SEQ) {
      setTimeout(() => {
        if (what === 't') {
          typing.classList.add('on');
          return;
        }
        if (what === msgs.length - 1) typing.classList.remove('on');
        msgs[what].classList.add('on');
      }, ms);
    }
  };
  play();
  setInterval(play, CHAT_LOOP_MS);
}

function initTilt() {
  const chat = document.getElementById('chat');
  const inner = document.getElementById('chatInner');
  if (!chat || !inner) return;
  let cx = 0;
  let cy = 0;
  const measure = () => {
    const r = chat.getBoundingClientRect();
    cx = r.left + r.width / 2;
    cy = r.top + r.height / 2;
  };
  measure();
  addEventListener('resize', measure, { passive: true });
  addEventListener('scroll', measure, { passive: true });
  onFrame(() => {
    const x = (target.x - cx) / innerWidth;
    const y = (target.y - cy) / innerHeight;
    inner.style.transform = `perspective(900px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg)`;
  });
}

export function initHero() {
  if (reduce) return;
  initIntro();
  initWords();
  initChat();
  initTilt();
}
