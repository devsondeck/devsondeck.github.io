export const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const callbacks = [];
let running = false;

function tick(t) {
  for (const cb of callbacks) cb(t);
  requestAnimationFrame(tick);
}

// One shared rAF loop; every registered callback gets the rAF timestamp.
export function onFrame(cb) {
  callbacks.push(cb);
  if (!running) {
    running = true;
    requestAnimationFrame(tick);
  }
}

// Stub: Task 7 replaces this with the run-when-visible rules.
export function story(el, play) {
  play(() => false);
}
