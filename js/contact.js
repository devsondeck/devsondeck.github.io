import { CONFIG } from './config.js';

export function initContact(cfg = CONFIG) {
  const mailto = `mailto:${cfg.email}?subject=${encodeURIComponent(cfg.subject)}&body=${encodeURIComponent(cfg.body)}`;
  document.querySelectorAll('.js-mail').forEach((a) => { a.href = mailto; });
  document.querySelectorAll('.js-mail-text').forEach((a) => {
    a.textContent = cfg.email;
    a.href = mailto;
  });
  const book = document.getElementById('book-call');
  if (book && cfg.calLink) {
    book.href = cfg.calLink;
    book.target = '_blank';
    book.rel = 'noopener';
    book.hidden = false;
  }
}
