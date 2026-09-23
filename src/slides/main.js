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

// the markdown plugin converts links as plain <a href>, with no way to add
// target="_blank" from markdown syntax itself - so patch them once the slide
// content exists, rather than hand-writing raw HTML for every link. Every link
// in the deck content points away from the deck (external sites, or the
// Shader Lab), so none of them should navigate the current tab away mid-talk.
deck.on('ready', () => {
  document.querySelectorAll('.reveal .slides a[href]:not([href^="#"])').forEach((a) => {
    a.target = '_blank';
    a.rel = 'noopener';
  });
});
