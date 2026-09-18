import Reveal from 'reveal.js';
import Markdown from 'reveal.js/plugin/markdown';
import Highlight from 'reveal.js/plugin/highlight';
import Notes from 'reveal.js/plugin/notes';
import 'reveal.js/reveal.css';
import 'reveal.js/theme/black.css';
import 'reveal.js/plugin/highlight/monokai.css';
// Imported last (and no longer a <link> in index.html) so these overrides
// actually win against reveal's own styles, which Vite injects in import order.
import './style.css';

const params = new URLSearchParams(location.search);
const lang = params.get('lang') === 'en' ? 'en' : 'de';

document.title =
  lang === 'en' ? 'Creative Coding with WebGL' : 'Creative Coding mit WebGL';
document
  .querySelectorAll('.lang-switch a')
  .forEach((a) => a.classList.toggle('active', a.dataset.lang === lang));

// Fetched at runtime, so the file must live in Vite's public/ dir (copied
// as-is into the build output) rather than a path only valid in dev.
document
  .querySelector('section[data-markdown]')
  .setAttribute('data-markdown', `/SLIDES-${lang}.md`);

const deck = new Reveal({
  hash: true,
  plugins: [Markdown, Highlight, Notes],
});

deck.initialize();
