// Entry point. Feature modules are wired in here as they are added.
// The `js-motion` class (hidden start states) is set by an inline script in <head>.
import { initContact } from './contact.js';
import { initScroll } from './scroll.js';
import { initPointer } from './pointer.js';
import { initField } from './field.js';
import { initHero } from './hero.js';

// Each init is isolated so one failure cannot block the others.
function boot(name, fn) {
  try {
    fn();
  } catch (err) {
    console.error(`${name} failed`, err);
    // never leave content hidden if the hero could not start
    if (name === 'hero') document.documentElement.classList.remove('js-motion');
  }
}

boot('hero', initHero);
boot('contact', initContact);
boot('scroll', initScroll);
boot('pointer', initPointer);
boot('field', () => initField(document.getElementById('field')));
