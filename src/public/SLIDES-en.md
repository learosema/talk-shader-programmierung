# Creative Coding with WebGL

---

# Creative Coding with WebGL

## Hi! I'm Lea Rosema

Senior Software Engineer

adesso

---

# Tonight: 🎃

We're carving a pumpkin.

Not with a knife — with a **signed distance field**.

---

# Agenda

- Quick shader basics recap
- Fragment shader "Hello World"
- Starting simple: `length(p)`
- Wrapping `step()` around it
- Enter: Signed Distance Fields
- Combining shapes
- Giving our circle a face
- The same idea in 3D
- Raymarching
- 🎃 Done!

---

# What's a shader, really?

A tiny function...

- ...that runs **massively parallel** — thousands of times at once
- ...once per pixel
- ...and returns a **color**

That's it. That's the whole mental model for tonight.

---

# The render pipeline

<svg width="100%" height="220" viewBox="0 0 1000 200" xmlns="http://www.w3.org/2000/svg" style="max-width: 800px">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#999" />
    </marker>
  </defs>

  <!-- arrows -->
  <line x1="122" y1="70" x2="233" y2="70" stroke="#999" stroke-width="2" marker-end="url(#arrow)" />
  <line x1="357" y1="70" x2="468" y2="70" stroke="#999" stroke-width="2" marker-end="url(#arrow)" />
  <line x1="532" y1="70" x2="638" y2="70" stroke="#999" stroke-width="2" marker-end="url(#arrow)" />
  <line x1="772" y1="70" x2="881" y2="70" stroke="#999" stroke-width="2" marker-end="url(#arrow)" />

  <!-- 1: vertices -->
  <circle cx="78" cy="55" r="5" fill="#ff9f1c" />
  <circle cx="100" cy="85" r="5" fill="#ff9f1c" />
  <circle cx="60" cy="90" r="5" fill="#ff9f1c" />
  <text x="90" y="145" fill="#ddd" font-size="16" text-anchor="middle" font-family="sans-serif">vertices</text>

  <!-- 2: vertex shader -->
  <rect x="235" y="45" width="120" height="50" rx="8" fill="#2a2a2a" stroke="#ff9f1c" stroke-width="2" />
  <text x="295" y="75" fill="#fff" font-size="13" text-anchor="middle" font-family="monospace">vertex</text>
  <text x="295" y="145" fill="#ddd" font-size="16" text-anchor="middle" font-family="sans-serif">shader</text>

  <!-- 3: rasterize (triangle of pixels) -->
  <polygon points="500,45 470,95 530,95" fill="#3a3a3a" stroke="#ff9f1c" stroke-width="2" />
  <g fill="#ff9f1c">
    <rect x="492" y="78" width="7" height="7" />
    <rect x="501" y="78" width="7" height="7" />
    <rect x="488" y="86" width="7" height="7" />
    <rect x="497" y="86" width="7" height="7" />
    <rect x="506" y="86" width="7" height="7" />
  </g>
  <text x="500" y="145" fill="#ddd" font-size="16" text-anchor="middle" font-family="sans-serif">rasterize</text>

  <!-- 4: fragment shader -->
  <rect x="640" y="45" width="130" height="50" rx="8" fill="#2a2a2a" stroke="#ff9f1c" stroke-width="2" />
  <text x="705" y="75" fill="#fff" font-size="13" text-anchor="middle" font-family="monospace">fragment</text>
  <text x="705" y="145" fill="#ddd" font-size="16" text-anchor="middle" font-family="sans-serif">shader</text>

  <!-- 5: pixels (colorful output) -->
  <g>
    <rect x="884" y="46" width="16" height="16" fill="#ff9f1c" />
    <rect x="902" y="46" width="16" height="16" fill="#8a4fff" />
    <rect x="920" y="46" width="16" height="16" fill="#ff5e5e" />
    <rect x="884" y="64" width="16" height="16" fill="#ff5e5e" />
    <rect x="902" y="64" width="16" height="16" fill="#ff9f1c" />
    <rect x="920" y="64" width="16" height="16" fill="#8a4fff" />
    <rect x="884" y="82" width="16" height="16" fill="#8a4fff" />
    <rect x="902" y="82" width="16" height="16" fill="#ff5e5e" />
    <rect x="920" y="82" width="16" height="16" fill="#ff9f1c" />
  </g>
  <text x="902" y="145" fill="#ddd" font-size="16" text-anchor="middle" font-family="sans-serif">pixels</text>
</svg>

Five stages, left to right — the GPU runs the middle three for every vertex and every pixel, all in parallel.

---

# The render pipeline (quick recap)

1. **Vertices** go in → the **vertex shader** places them
2. The GPU rasterizes the triangle into pixels ("fragments")
3. The **fragment shader** runs once per pixel → outputs a color

We'll live almost entirely in step 3 tonight.

---

# Fragment shader "Hello World"

```glsl
#version 300 es
precision highp float;

out vec4 fragColor;

void main() {
  fragColor = vec4(1.0, 0.5, 0.0, 1.0);
}
```

- runs for every pixel on screen
- every pixel gets painted the same flat orange
- `uniform`s (like `resolution`, `time`) let JS pass values in — that's all the JS-side wiring we need to care about tonight

Boring. Let's make it depend on *where* the pixel is.

---

# Starting simple: `length(p)`

```glsl
vec2 uv = (gl_FragCoord.xy - 0.5 * resolution) / min(resolution.x, resolution.y);
float d = length(uv);
fragColor = vec4(vec3(d), 1.0);
```

- `uv`: pixel coordinates, recentered so `(0, 0)` is the middle of the screen
- `length(uv)`: distance from the center
- the farther out, the brighter → a radial gradient

We just computed a distance for every pixel. Keep that thought.

---

# Wrapping `step()` around it

```glsl
float d = length(uv) - 0.3;
vec3 color = vec3(step(0.0, d));
fragColor = vec4(color, 1.0);
```

- `step(0.0, d)`: `1.0` (white) where `d >= 0`, `0.0` (black) where `d < 0`
- a hard edge exactly where the gradient crosses zero

## 🎃 Live coding: draw a circle, then soften the edge with `smoothstep`

---

# Enter: Signed Distance Fields

We just wrote one, by accident.

A **signed distance field** returns the distance to the edge of a shape, for every point `p`:

- `d < 0` → **inside** the shape
- `d > 0` → **outside**
- `d == 0` → exactly **on the edge**

```glsl
float sdCircle(vec2 p, float r) {
  return length(p) - r;
}
```

Hard to get shorter than that 🙂

---

# More shapes: ask Inigo Quilez

We won't derive every shape by hand — one person already has, and published it:

## [iquilezles.org/articles](https://iquilezles.org/articles/)

- **2D distance functions** — boxes, hexagons, stars, ...
- **3D SDFs** — the same, one dimension up
- basically the reference cheat sheet for anything SDF-shaped

---

# Combining shapes

SDFs combine like boolean operations on shapes. Tonight, five moves:

**combine · merge · split · deform · round**

---

# Combine (union)

```glsl
// the smaller (= closer) distance wins
float add(float a, float b) {
  return min(a, b);
}
```

Two shapes become one. Simple `min()`.

---

# Merge (smooth union)

```glsl
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}
```

Same idea as `add`, but the seam between the two shapes **blends** instead of forming a hard corner — great for organic-looking pumpkin ridges.

---

# Split (subtraction)

```glsl
// cut b out of a
float sub(float a, float b) {
  return max(-b, a);
}
```

Carves a hole. This is how we'll cut eyes, a mouth, anything hollow.

---

# Deform

```glsl
float d = sdCircle(p, r);
d += sin(p.y * 10.0) * 0.02; // a bit of wobble
return d;
```

Perturb the distance (or the point going in) with a bit of extra math — a `sin()`, some noise, anything. Turns a perfect shape into something hand-carved.

---

# Round

```glsl
float d = sdBox(p, size) - 0.05;
```

Rounding is basically free: subtract a constant from *any* SDF and its corners round off by that amount.

---

# Back to the circle: eyes 👀

```glsl
float face(vec2 p) {
  float d = sdCircle(p, 0.5);
  d = sub(sdCircle(p - vec2(-0.18, 0.1), 0.08), d);
  d = sub(sdCircle(p - vec2( 0.18, 0.1), 0.08), d);
  return d;
}
```

Two subtracted circles. The pumpkin can see now.

---

# ...and a mouth

```glsl
float mouth(vec2 p) {
  p -= vec2(0.0, -0.15);
  float d = sdBox(p, vec2(0.22, 0.05));
  d += sin(p.x * 40.0) * 0.015; // jagged teeth, via deform
  return d;
}

// carve it out of the face from the previous slide
d = sub(mouth(p), d);
```

Same trick as `deform`, applied on purpose this time: a bit of `sin()` turns a straight box into a jagged jack-o'-lantern grin.

## 🎃 Live coding: assemble the face

---

# The same idea works in 3D

`sdCircle` becomes `sdSphere` — one more dimension, same formula:

```glsl
float sdSphere(vec3 p, float r) {
  return length(p) - r;
}
```

But there's a catch...

---

# The catch: no more 1:1 pixel-to-point mapping

In 2D, every pixel *was* a point we could plug straight into the SDF.

In 3D, every pixel corresponds to a **ray** shooting into the scene — we don't yet know *where* along that ray to evaluate the SDF.

---

# Raymarching

Step along the ray, using the SDF's distance as a **safe step size** — it's the guaranteed distance to the nearest surface in any direction:

```glsl
float castRay(vec3 rayOrigin, vec3 rayDir) {
  float t = 0.1;
  for (int i = 0; i < 100; i++) {
    float d = scene(rayOrigin + rayDir * t);
    if (d < 0.001 * t || t > 80.0) break;
    t += d;
  }
  return t;
}
```

Close to a surface (`d` near 0) → hit. Gone too far → nothing there.

---

# A camera ray per pixel

```glsl
vec3 getCameraRayDir(vec2 uv, vec3 camPos, vec3 camTarget) {
  vec3 camForward = normalize(camTarget - camPos);
  vec3 camRight = normalize(cross(vec3(0.0, 1.0, 0.0), camForward));
  vec3 camUp = normalize(cross(camForward, camRight));
  return normalize(uv.x * camRight + uv.y * camUp + camForward * 2.0);
}
```

Same `uv` as before — it just steers a ray direction now, instead of a color directly.

---

# Hollowing out a pumpkin, in 3D

Same `add`/`sub` combinators as in 2D — just with spheres now:

```glsl
float pumpkin(vec3 p) {
  float shell = sdSphere(p, 3.0);
  shell = sub(sdSphere(p, 2.9), shell);            // hollow it out
  shell = sub(sdSphere(p - eyeLeft, 0.7), shell);  // carve an eye
  shell = sub(sdSphere(p - eyeRight, 0.7), shell); // carve an eye
  shell = sub(mouth, shell);                       // carve the mouth
  return shell;
}
```

Subtraction removes material — exactly like cutting a hole in 2D, just in 3D space.

---

# Shading: surface normals

To make it look like a solid object, we need lighting — which needs a surface normal:

```glsl
vec3 calcNormal(vec3 pos) {
  float c = scene(pos);
  vec2 e = vec2(0.001, 0.0);
  return normalize(vec3(
    scene(pos + e.xyy),
    scene(pos + e.yxy),
    scene(pos + e.yyx)
  ) - c);
}
```

Sample the SDF slightly offset in each axis → the direction of steepest change *is* the normal. Feed that into simple diffuse lighting.

---

# 🎃 DEMO: Spooky Raymarch Pumpkin Armada

## [DEMO](https://codepen.io/learosema/pen/MWeYvPv)

- an infinite field of hollowed-out pumpkins, all built from spheres via `add`/`sub`
- animated eyes, wobbly mouth, subtle deform for that hand-carved look
- full raymarched camera orbiting the scene + a synced chiptune soundtrack

---

# Where to go from here

- <https://iquilezles.org/articles/> — more primitives, more operations, the deep end
- <https://thebookofshaders.com/> — a gentler, guided path through all of this
- this repo's **Shader Lab** (`src/demo`) — the same building blocks from tonight, live-editable

---

# 🎃 Done!

## Feedback and Questions

- talk to me afterwards 🙂
- DM me on Mastodon (`@lea@lea.lgbt`)
- or file an issue in my repo
