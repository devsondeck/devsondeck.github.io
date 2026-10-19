export const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const callbacks = [];
let running = false;

// Re-arm first and isolate each callback, so one bad consumer cannot stop all motion.
function tick(t) {
  requestAnimationFrame(tick);
  for (const cb of callbacks.slice()) {
    try {
      cb(t);
    } catch (err) {
      console.error('frame callback failed', err);
    }
  }
}

// One shared rAF loop; every registered callback gets the rAF timestamp.
// Returns a function that unregisters the callback.
export function onFrame(cb) {
  callbacks.push(cb);
  if (!running) {
    running = true;
    requestAnimationFrame(tick);
  }
  return () => {
    const i = callbacks.indexOf(cb);
    if (i >= 0) callbacks.splice(i, 1);
  };
}

// Runs `play` in a loop while `el` is at least 35% visible. Each run has its own
// token; `stopped()` is true once that run is stale, and play must check it after every await.
export function story(el, play) {
  if (reduce) return;
  let run = 0;
  let seq = 0;
  const loop = async (id) => {
    while (run === id) {
      try {
        await play(() => run !== id);
      } catch (err) {
        console.error('story failed', err);
        return;
      }
    }
  };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !run) {
      run = ++seq;
      loop(run);
    } else if (!e.isIntersecting) {
      run = 0;
    }
  }, { threshold: 0.35 }).observe(el);
}
