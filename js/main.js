// Entry point. Feature modules are wired in here as they are added.
import { initContact } from './contact.js';
import { initScroll } from './scroll.js';
import { initPointer } from './pointer.js';
import { initField } from './field.js';
import { initHero } from './hero.js';
import { reduce } from './motion.js';

// Hidden start states in the CSS only apply under this class.
if (!reduce) document.documentElement.classList.add('js-motion');

initContact();
initScroll();
initPointer();
initField(document.getElementById('field'));
initHero();
