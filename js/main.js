// Entry point. Feature modules are wired in here as they are added.
import { initContact } from './contact.js';
import { initScroll } from './scroll.js';
import { initPointer } from './pointer.js';
import { initField } from './field.js';

initContact();
initScroll();
initPointer();
initField(document.getElementById('field'));
