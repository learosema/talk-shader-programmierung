# Creative Coding with WebGL

<img src="../cauldron-title.png" alt="Witch's kitchen" style="max-height: 340px; margin-top: 0.5rem;">

---

# Creative Coding with WebGL

## Hi! I'm Lea Rosema

- Senior Software Engineer, at adesso since 2024
- volunteers with the German Red Cross (DRK)
- hobby: creative coding

---

# Tonight: 🎃

We're carving a pumpkin — not with a knife, with a **signed distance field**.

---

# 🎃 The inspiration

## [Spooky Raymarch Pumpkin Armada](https://codepen.io/learosema/pen/MWeYvPv)

An old CodePen of mine — what kicked off this talk. All math, no polygons.

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

The whole mental model for tonight.

---

## [tixy.land](https://tixy.land)

Same mental model, one line: `t => ...` per pixel, live in the browser.

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

Five stages, left to right — the GPU runs the middle three in parallel, per vertex and pixel.

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

Let's make it depend on *where* the pixel is.

---

# Starting simple: `length(p)`

```glsl
float d = length(vPos.xy);
fragColor = vec4(vec3(d), 1.0);
```

- `vUv`: texture coordinate
- `vPos`: vertex position
- `length(vPos.xy)`: distance from center
- the farther out, the brighter → a radial gradient

Computed a distance for every pixel — keep that thought.

---

# `step(edge, x)`

<svg width="100%" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg" style="max-width: 380px">
  <line x1="40" y1="170" x2="290" y2="170" stroke="#888" stroke-width="1.5"/>
  <polygon points="290,170 282,166 282,174" fill="#888"/>
  <line x1="40" y1="180" x2="40" y2="10" stroke="#888" stroke-width="1.5"/>
  <polygon points="40,10 36,18 44,18" fill="#888"/>
  <line x1="160" y1="170" x2="160" y2="20" stroke="#666" stroke-width="1" stroke-dasharray="4 4"/>
  <line x1="40" y1="20" x2="160" y2="20" stroke="#666" stroke-width="1" stroke-dasharray="4 4"/>
  <path d="M45,160 L160,160 L160,20 L285,20" fill="none" stroke="#ff9f1c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="295" y="175" fill="#ccc" font-size="14">x</text>
  <text x="18" y="24" fill="#ccc" font-size="14">1</text>
  <text x="18" y="164" fill="#ccc" font-size="14">0</text>
  <text x="145" y="188" fill="#e8c99b" font-size="13">edge</text>
</svg>

- `x < edge` → `0.0`
- `x >= edge` → `1.0`
- a hard edge, no in-between

---

# Wrapping `step()` around it

```glsl
float d = length(vPos.xy) - 0.3;
vec3 color = vec3(step(0.0, d));
fragColor = vec4(color, 1.0);
```

- `step(0.0, d)`: `1.0` (white) where `d >= 0`, `0.0` (black) where `d < 0`
- a hard edge exactly where the gradient crosses zero

---

# Other colors

```glsl
vec3 color = vec3(1.0, 0.5, 0.0) * step(0.0, d);
```

- multiply by a color — 0 stays black, 1 becomes the color
- or `mix(colorA, colorB, step(0.0, d))`: interpolate between two colors

---

# Nonlinear color mixing

```glsl
vec3 colormix(vec3 a, vec3 b, float t) {
  return sqrt((1.0 - t) * pow(a, vec3(2.0)) + t * pow(b, vec3(2.0)));
}
```

- `mix()` interpolates linearly and often dips through a muddy grey
- `colormix()` mixes in "linear light" instead of sRGB — looks more natural
- ready to drop in as a snippet in the Shader Lab (`src/demo`)

---

# `smoothstep(edge0, edge1, x)`

<svg width="100%" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg" style="max-width: 380px">
  <line x1="40" y1="170" x2="290" y2="170" stroke="#888" stroke-width="1.5"/>
  <polygon points="290,170 282,166 282,174" fill="#888"/>
  <line x1="40" y1="180" x2="40" y2="10" stroke="#888" stroke-width="1.5"/>
  <polygon points="40,10 36,18 44,18" fill="#888"/>
  <line x1="125.7" y1="170" x2="125.7" y2="20" stroke="#666" stroke-width="1" stroke-dasharray="4 4"/>
  <line x1="194.3" y1="170" x2="194.3" y2="20" stroke="#666" stroke-width="1" stroke-dasharray="4 4"/>
  <line x1="40" y1="20" x2="194.3" y2="20" stroke="#666" stroke-width="1" stroke-dasharray="4 4"/>
  <path d="M45,160 L125.7,160 C163,160 157,20 194.3,20 L285,20" fill="none" stroke="#ff9f1c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="295" y="175" fill="#ccc" font-size="14">x</text>
  <text x="18" y="24" fill="#ccc" font-size="14">1</text>
  <text x="18" y="164" fill="#ccc" font-size="14">0</text>
  <text x="98" y="188" fill="#e8c99b" font-size="13">edge0</text>
  <text x="178" y="188" fill="#e8c99b" font-size="13">edge1</text>
</svg>

- before `edge0` → `0.0`, after `edge1` → `1.0`
- in between: a soft S-curve transition
- perfect for softening hard SDF edges

## 🎃 Live coding: draw a circle, then soften the edge with `smoothstep`

---

# Enter: Signed Distance Fields

We just wrote one, by accident.

**Signed distance field**: distance from point `p` to the edge of a shape:

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

# What are SDFs used for?

- digital art / demoscene — 2 triangles and math
- font rendering — scales to any size
- complex models that would otherwise need huge polygon counts

---

# More shapes: ask Inigo Quilez

- [2D SDFs](https://iquilezles.org/articles/distfunctions2d/)
- [3D SDFs](https://iquilezles.org/articles/distfunctions/)
- [YouTube: @InigoQuilez](https://www.youtube.com/c/InigoQuilez)

---

# Combining shapes

SDFs combine like boolean operations — five moves tonight:

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

Like `add`, but the seam **blends** instead of a hard corner — exactly what we'll need for a soft 3D mouth.

---

# Split (subtraction)

```glsl
// cut b out of a
float sub(float a, float b) {
  return max(-b, a);
}
```

Carves a hole — how we'll cut eyes, mouth, anything hollow.

---

# Deform

```glsl
float d = sdCircle(p, r);
d += sin(p.y * 10.0) * 0.02; // a bit of wobble
return d;
```

Perturb the distance (or point) with a bit of math — `sin()`, noise, anything. Turns a perfect shape into something hand-carved.

---

# Round

```glsl
float d = sdBox(p, size) - 0.05;
```

Basically free: subtract a constant from *any* SDF → corners round off by exactly that amount.

---

# Back to the circle: eyes 👀

```glsl
float face(vec2 p) {
  float d = sdCircle(p, 0.4);
  d -= abs(cos(p.x * 24.0)) * 0.03; // deform for the ridges around the edge
  d = sub(d, sdCircle(p - vec2(-0.18, 0.1), 0.08));
  d = sub(d, sdCircle(p - vec2( 0.18, 0.1), 0.08));
  return d;
}
```

Two subtracted circles for the eyes, plus `deform` for the ridged outline. The pumpkin can see now.

---

# ...and a mouth

```glsl
float mouth(vec2 p) {
  p -= vec2(0.0, -0.15);
  vec2 mScale = vec2(1.0, 1.5);
  float d = sdCircle(p * mScale, 0.22);
  d = sub(d, sdCircle(p * mScale - vec2(0.0, 0.2), 0.21)); // circle minus a shifted circle: a crescent
  d += abs(sin(p.x * 64.0) * 0.02); // jagged teeth, via deform
  return d;
}

// carve it out of the face from the previous slide
d = sub(d, mouth(p));
```

Two offset circles make a crescent, `sin()` deform turns it into jagged teeth.

## 🎃 Live coding: assemble the face

---

## [SDF Modeler by Sascha Rode](https://sascha-rode.itch.io/sdf-modeler)

Sculpt SDFs visually instead of simulating every formula in your head — before we move on to 3D.

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

- 2D: every pixel *was* a point — straight into the SDF
- 3D: every pixel is a **ray** into the scene
- open question: *where* along the ray to evaluate the SDF?

---

# Raymarching

Step along the ray: SDF distance as a **safe step size**, the guaranteed distance to the nearest surface:

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

- `d` near 0 → hit
- gone too far, no hit → nothing there

---

# A camera ray per pixel

```glsl
vec3 getCameraRayDir(vec2 uv, vec3 camPos, vec3 camTarget) {
  vec3 camForward = normalize(camTarget - camPos);
  vec3 camRight = normalize(cross(camForward, vec3(0.0, 1.0, 0.0)));
  vec3 camUp = normalize(cross(camRight, camForward));
  return normalize(uv.x * camRight + uv.y * camUp + camForward * 2.0);
}
```

Again `vPos.xy`, here as a parameter called `uv` — steers a ray direction now, instead of a color.

---

# Hollowing out a pumpkin, in 3D

Same `add`/`sub` combinators as in 2D — just with spheres now:

```glsl
float pumpkin(vec3 p) {
  float shell = sdSphere(p, 3.0);
  shell = sub(shell, sdSphere(p, 2.9));            // hollow it out
  shell = sub(shell, sdSphere(p - eyeLeft, 0.7));  // carve an eye
  shell = sub(shell, sdSphere(p - eyeRight, 0.7)); // carve an eye
  shell = sub(shell, mouth);                       // carve the mouth
  return shell;
}
```

Subtraction removes material — like cutting a hole in 2D, just in 3D space.

---

# Shading: surface normals

For that solid-object look: lighting, and for that a surface normal:

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

Sample the SDF slightly offset in each axis → steepest change *is* the normal, fed into simple diffuse lighting.

---

# Texture instead of flat color

- Color doesn't have to be constant — compute it from the hit position
- `fbm()` (Fractal Brownian Motion) gives organic noise
- blend between two tones with it → an uneven, natural-looking surface

```glsl
float n = fbm(pos.xz * 6.0);
vec3 pumpkinColor = mix(colorA, colorB, n);
```

---

# Multiple materials at once

- `vec2(dist, materialId)` travels together through the SDF combinators
- `union`: closer candidate wins, id included

```glsl
vec2 opUnionMat(vec2 a, vec2 b) {
  return a.x < b.x ? a : b;
}

vec2 hit = opUnionMat(vec2(pumpkinDist, 0.0), vec2(stemDist, 1.0));
vec3 color = hit.y < 0.5 ? pumpkinColor : stemColor; // the id decides the color
```

🎃 In the Shader Lab: the green stem on top of the pumpkin.

---

# Where to go from here

- <https://iquilezles.org/articles/> — more primitives, more operations, the deep end
- <https://thebookofshaders.com/> — a gentler, guided path through all of this
- <https://learnopengl.com/> — especially everything about lighting
- this repo's **[Shader Lab](../demo)** (`src/demo`) — the same building blocks from tonight, live-editable

---

# 🎃 Done!

## Feedback and Questions

- talk to me afterwards 🙂
- DM me on Mastodon (`@lea@lea.lgbt`)
- or file an issue in my repo
