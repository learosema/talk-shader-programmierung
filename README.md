# Creative Coding with WebGL 🎃

Slides and an interactive shader playground for the talk "Creative Coding with WebGL", in which we carve a jack-o'-lantern out of nothing but math — signed distance fields, raymarching, and a bit of noise.

**Live:** https://learosema.github.io/talk-shader-programmierung/

## What's in here

- **`src/slides/`** — the reveal.js deck (`?lang=de` / `?lang=en`), rendered from `src/public/SLIDES-de.md` and `SLIDES-en.md`
- **`src/demo/`** — the "Shader Lab": a live WebGL2 fragment shader editor (CodeMirror + [shader-art](https://github.com/learosema/shader-art)) with presets that walk through the whole talk, from a plain gradient to the finished pumpkin, plus a library of reusable SDF/raymarching snippets
- **`src/index.html`** — a small landing page linking to both

## Getting started

```sh
npm install
npm run dev
```

Then open the printed local URL — the landing page links to the slides and the Shader Lab.

```sh
npm run build    # production build into dist/
npm run preview  # preview the production build locally
```

## License

MIT, see [LICENSE](LICENSE).
