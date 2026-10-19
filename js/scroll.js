import { reduce, onFrame } from './motion.js';

export function initScroll() {
  let lenis = null;
  if (window.Lenis && !reduce) {
    try {
      lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
      onFrame((t) => lenis.raf(t));
    } catch (e) {
      lenis = null;
    }
  }

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const href = a.getAttribute('href');
      const target = href.length > 1 ? document.querySelector(href) : null;
      if (!target) return;
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(target, {
          offset: href === '#top' ? 0 : -30,
          duration: 1.4,
          easing: (k) => 1 - Math.pow(1 - k, 4),
        });
      } else {
        target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      }
      if (!target.hasAttribute('tabindex') && !target.matches('a[href], button, input, select, textarea, [contenteditable]')) {
        target.setAttribute('tabindex', '-1');
      }
      target.focus({ preventScroll: true });
      history.replaceState(null, '', href);
    });
  });

  return { lenis, velocity: () => (lenis ? lenis.velocity : 0) };
}
