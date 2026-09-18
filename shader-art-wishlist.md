# shader-art wishlist

Notes on planned improvements for the `shader-art` web component (npm: `shader-art`),
collected while building the interactive shader demo in `src/demo/`. The package hasn't
been actively maintained for a while.

## Ideas

- [ ] **Rework the plugin system** (`ShaderArtPlugin` interface: `setup`/`dispose`)
- [ ] **Drop WebGL1 support** — WebGL2 is universally available now, no need to keep
      the `attribute`/`varying` fallback path and the `webgl2` version-sniffing getter
- [ ] **Bugfix: default plane winding order** — one of the two triangles in the default
      position buffer is wound clockwise (the other counter-clockwise), inconsistent
      winding on the built-in fullscreen quad
- [ ] Simple way to set up primitive geometries (not just the fullscreen-quad buffer)
- [ ] Particle mode

- **Packaging bug: `semantic-release` & `@semantic-release/npm` are listed under
  `dependencies`, not `devDependencies`.** They're release tooling, only ever needed
  in the package's own CI, but because they're in `dependencies`, every consumer who
  runs `npm install shader-art` pulls in semantic-release's entire transitive tree —
  in this repo that was **580 extra packages** and **33 vulnerabilities (1 critical,
  29 high)**, gone the moment `shader-art` was removed and re-added as a CDN import
  instead. Straightforward fix: move both to `devDependencies` in `shader-art`'s
  `package.json` and cut a patch release.

## Observations from building the demo

- Current gotcha: `ShaderArt` decides WebGL1 vs. WebGL2 once, in `setup()`, based on
  whether the *initial* frag shader source contains `#version 300 es`. `reinitialize()`
  reuses the existing `gl` context and never re-checks this — so if the element connects
  to the DOM with an empty/default frag script (e.g. before JS has populated it), it
  locks into a WebGL1 context, and a later `reinitialize()` with GLSL ES 3.00 source
  fails. Had to work around this by setting the frag `<script>` content *before* calling
  `ShaderArt.register()`. Dropping WebGL1 support would remove this whole class of bug.

- **Bug: `dpr="auto"` silently breaks rendering entirely (canvas collapses to 0×0).**
  The README documents `dpr="auto|number"` with "default is auto, which uses
  `window.devicePixelRatio`". The actual getter is
  `Math.min(parseFloat(this.getAttribute("dpr")||"1"), window.devicePixelRatio)` —
  it never special-cases the string `"auto"`. `parseFloat("auto")` is `NaN`, so
  `devicePixelRatio` returns `NaN`, `canvas.width = clientWidth * NaN` is `NaN`, and
  the `width`/`height` IDL attributes silently coerce that to `0`. Result: a fully
  zero-sized framebuffer that the browser then stretches over the CSS-sized box —
  looks exactly like a single flat, wrong-colored fill (this is what "the whole demo
  renders as one flat color" turned out to be, not a layout timing race as first
  suspected). Also, simply *omitting* the `dpr` attribute does **not** match the
  documented default either: with no attribute, `getAttribute("dpr")` is `null` ->
  falls back to `"1"` -> `Math.min(1, window.devicePixelRatio)`, which is `1` on any
  screen with `devicePixelRatio >= 1` (i.e. effectively every screen) — so the
  "default is auto / uses devicePixelRatio" behavior described in the README doesn't
  actually happen by default or via the literal string `"auto"`; only passing an
  explicit numeric value (or removing the `Math.min` cap) gets real DPR scaling.
  Either implement the `"auto"` string in code, or fix the docs — and guard against
  non-numeric `dpr` values collapsing the canvas instead of failing loudly/falling
  back.

- **Bug: canvas size can get stuck at 0×0 (or stale), no `ResizeObserver`.**
  `onResize()` is only called once, from inside the `setupActivePlugins().then(...)`
  microtask right after `setup()`, and then again only on the global `window` `resize`
  event. If the host element's layout isn't settled yet at that first call (e.g. an
  external stylesheet giving it `width:100%;height:100%` hasn't finished loading, or
  it sits in a flex/grid layout that hasn't resolved), `clientWidth`/`clientHeight` read
  as 0 (or wrong), `canvas.width`/`height` get set to 0, and nothing ever corrects it
  since a plain window resize is the only other trigger. The canvas' CSS box still
  fills its container (via the inline `width:100%;height:100%;display:block` style
  `setup()` applies), so the browser just stretches whatever tiny/degenerate
  framebuffer exists across that box — visually this looks like a single flat color
  filling the whole element instead of the actual shader output. Reproduced reliably
  while building `src/demo`. Worked around it in the demo by adding our own
  `ResizeObserver` on the element and calling the (undocumented but public)
  `el.onResize()` whenever it fires — `ResizeObserver` also fires once immediately on
  `observe()`, which fixes the initial-load race too. `shader-art` itself should own a
  `ResizeObserver` internally instead of relying on `window`'s `resize` event.
