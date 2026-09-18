# Creative Coding with WebGL

---

# Creative Coding with WebGL

## Hi! I'm Lea Rosema

Senior Software Engineer

adesso

---

# Agenda

- Quick recap: render pipeline, vertex & fragment shaders
- Which platform do we use? (Browser/WebGL + teaser on other platforms)
- Drawing shapes in the fragment shader (SDFs, live coding)
- Combining shapes
- From 2D to 3D
- Perlin noise & co
- Further learning resources

---

# What is WebGL?

- it's not a 3D engine
- it's about drawing points, lines, triangles
- it's a low-level API to run code on the GPU

---

# The Render Pipeline

1. **Vertices** go in (positions, from a buffer)
2. **Vertex shader** runs once per vertex → computes the final position (`gl_Position`)
3. **Rasterization**: the GPU figures out which pixels ("fragments") lie inside the resulting triangle
4. **Fragment shader** runs once per fragment → computes the final color
5. Result lands in the **framebuffer** (= what you see on screen)

---

# Shaders

![A triangle](https://github.com/learosema/hello-webgl/raw/master/talk-webgl/tri.png)

## Drawing shapes with shaders

The vertex shader computes vertex positions

The fragment shader handles rasterization

---

# GL Shader Language

## How does it look like?

- GPU-specific language: GL Shader Language (GLSL)
- It's like C with a `void main()`
- ...but with built-in datatypes and functions useful for 2D/3D

---

# Vertex shader code

```glsl
#version 300 es

in vec3 position;

void main() {
  gl_Position = vec4(position, 1.0);
}
```

- via the `position` attribute (`in`), the shader gets data from a buffer
- the shader is run for each position in the position buffer
- the vertex position is set via `gl_Position`

---

# Fragment shader code

```glsl
#version 300 es
precision highp float;

out vec4 fragColor;

void main() {
  vec2 p = gl_FragCoord.xy;
  fragColor = vec4(1.0, 0.5, 0.0, 1.0);
}
```

- the fragment shader is run for each fragment (pixel)
- the pixel coordinate can be read from `gl_FragCoord`
- the output color is written to a self-declared `out vec4` (here: `fragColor`) instead of `gl_FragColor`

---

# Passing Data from JS

- `in` (vertex shader): the vertex shader pulls a value from a buffer and stores it in here
- `uniform`: pass variables you set in JS before you execute the shader
- `out` / `in`: pass values from the vertex shader (`out`) to the fragment shader (`in`)

---

# Let's try GLSL

## [DEMO: Draw a triangle](https://codepen.io/learosema/pen/OKVpYV?editors=0010)

---

# GL Shader Language

## Datatypes

- primitives (`bool`, `int`, `float`)
- vectors (`vec2`, `vec3`, `vec4`)
- matrices (`mat2`, `mat3`, `mat4`)
- texture data (`sampler2D`)

---

# GL Shader Language

## Cool built-in functions

- `sin`, `cos`, `atan`
- Linear Interpolation (`mix`)
- Vector arithmetics (`+`, `-`, `*`, `/`, `dot`, `cross`, `length`)
- Matrix arithmetics (`+`, `-`, `*`)

---

# Running it in JS

## Get the WebGL Context

```js
const gl = canvas.getContext("webgl2");
```

...just like initializing a 2D canvas

---

# Running it in JS

## Compile the Shaders

```js
const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragmentCode);
gl.compileShader(fragmentShader);

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexCode);
gl.compileShader(vertexShader);
```

Like in C, you have to compile your shaders first.

---

# Running it in JS

## Create the program

```js
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
```

The two shaders are linked into a `WebGLProgram`.

You can check if the program is valid via `gl.validateProgram(program)`

---

# Running it in JS

## Defining attributes for the vertex shader

```js
const positionLoc = gl.getAttribLocation(program, "position");
gl.enableVertexAttribArray(positionLoc);
```

Activate your attribute via `enableVertexAttribArray`

---

# Running it in JS

## Assign a buffer to the attribute

```js
// provide 2D data for a triangle
const data = [-1, -1, -1, 1, 1, -1];
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
```

Create a buffer and provide data in a `Float32Array`

---

# Running it in JS

## Set the attribute pointer

```js
const recordSize = 2;
const stride = 0; // 0 = advance through the buffer by recordSize * sizeof(data type)
const offset = 0; // the starting point in the buffer
const type = gl.FLOAT; // data type
const normalized = false; // normalize the data (unused for gl.FLOAT)
gl.vertexAttribPointer(
  positionLoc,
  recordSize,
  type,
  normalized,
  stride,
  offset
);
```

Assign an attribute to a buffer

---

# Running it in JS

## Passing uniform variables

```js
const uTime = gl.getUniformLocation(program, "time");
gl.uniform1f(uTime, tickCount);
```

- Possible types: floats, ints, bools, vectors, matrices
- Pass variables from JavaScript to WebGL
- For example: pass the screen resolution, elapsed time, mouse position

---

# Running it in JS

## Draw

```js
createBuffers();
setAttributes();

function animLoop(time = 0) {
  setUniforms();
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  requestAnimationFrame(animLoop);
}

animLoop();
```

---

# Useful GLSL functions

```glsl
// normalize coords and set (0, 0) to center
vec2 coords() {
  float vmin = min(width, height);
  return vec2((gl_FragCoord.x - width * .5) / vmin,
              (gl_FragCoord.y - height * .5) / vmin);
}

// rotate
vec2 rotate(vec2 p, float a) {
  return vec2(p.x * cos(a) - p.y * sin(a),
              p.x * sin(a) + p.y * cos(a));
}

// repeat
vec2 repeat(in vec2 p, in vec2 c) {
  return mod(p, c) - 0.5 * c;
}
```

---

# Which platform do we use?

For today: the browser, with WebGL 🙂

- runs everywhere, no setup, get started right away
- perfect for learning shaders & GPU fundamentals

---

# What about beyond that?

WebGL isn't the end of the line:

- **WebGPU** – the successor in the browser (compute shaders, more modern API design)
- **wgpu** – a WebGPU implementation in Rust, also runs natively (not just in the browser)
- **Vulkan**, **Metal**, **DirectX** – the native GPU APIs underneath, depending on the platform

The cool part: the concepts (shaders, buffers, pipeline) stay the same – only the API around them changes

---

# Drawing shapes in the fragment shader

So far: shapes come from triangles (vertex data)

Now: a single fullscreen rectangle made of two triangles – the actual shape is created entirely inside the fragment shader, using math 🧮

---

# To illustrate

At its core, a fragment shader is just a function that returns a color for **every pixel**

- [tixy.land](https://tixy.land) – exactly this idea, taken to the extreme (a single `t, i, x, y` formula per pixel/frame)
- [Lea's Shader Simulator](https://codepen.io/learosema/pen/BaeQXyr) – the same idea, rebuilt in JS to play around with before it becomes "real" GLSL

---

# What is a Signed Distance Field?

A function that returns the **distance to the edge of a shape** for every point `p`:

- `d < 0` → the point lies **inside** the shape
- `d > 0` → the point lies **outside**
- `d == 0` → the point lies exactly **on the edge**

In short: SDF = "signed distance field" ("field" = returns a value for every point in space)

---

# SDF for a circle

```glsl
float sdCircle(vec2 p, float r) {
  return length(p) - r;
}
```

- `length(p)` = distance from point `p` to the origin
- minus the radius `r` → 0 exactly on the circle's edge, negative inside, positive outside

Hard to get shorter than that 🙂

---

# Turning distance into color

```glsl
#version 300 es
precision highp float;

out vec4 fragColor;
uniform vec2 resolution;

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * resolution) / min(resolution.x, resolution.y);
  float d = sdCircle(uv, 0.3);
  vec3 color = vec3(step(0.0, d)); // white outside, black inside
  fragColor = vec4(color, 1.0);
}
```

- `step(0.0, d)`: a hard edge at the boundary of the shape
- for a soft/anti-aliased edge: use `smoothstep` instead of `step`

---

# Let's try it: Live coding

## DEMO: draw a circle and soften the edge

*(live during the talk, no finished CodePen)*

---

# Combining shapes

SDFs can be combined like boolean operations on shapes:

- **union** – true if the point is inside *either* shape
- **intersection** – true if the point is inside *both* shapes
- **subtraction** – cut one shape out of another

---

# Union & subtraction

```glsl
// union: the smaller (= closer) distance wins
float add(float a, float b) {
  return min(a, b);
}

// subtraction: cut b out of a
float sub(float a, float b) {
  return max(-b, a);
}
```

- `add`: combine two shapes into one
- `sub`: carve a hole (`b`) out of shape `a`

---

# One more primitive: a box

```glsl
float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}
```

- `b` is the half-size of the box (width/2, height/2)
- works the same way as `sdCircle`: negative inside, positive outside

---

# Example: a ring

```glsl
float ring(vec2 p) {
  float d = 999.0;         // start "empty" (nothing is inside yet)
  d = add(d, sdCircle(p, 0.4)); // union in the outer circle
  d = sub(d, sdCircle(p, 0.3)); // subtract the inner circle
  return d;
}
```

Union + subtraction of two circles = a ring/donut shape

---

# DEMO: building a symbol from combined shapes

## [DEMO](https://codepen.io/learosema/pen/oNGEMVM)

- a ring (union + subtraction of two circles)
- a cross and two arrows (unions of rotated boxes)
- combined together → the transgender symbol ⚧
- animated with a subtle ripple deform + a gradient background in trans flag colors

---

# From 2D to 3D

Same idea, one more dimension: `sdCircle` becomes `sdSphere`

```glsl
float sdSphere(vec3 p, float r) {
  return length(p) - r;
}
```

But there's a catch...

---

# The catch: no more 1:1 pixel-to-point mapping

In 2D, every pixel *was* a point we could plug straight into the SDF

In 3D, every pixel corresponds to a **ray** shooting into the scene – we don't know yet *where* along that ray we should evaluate the SDF

---

# Raymarching

Idea: step along the ray, using the SDF's distance value as a **safe step size** (it's the guaranteed distance to the nearest surface in any direction)

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

- keep stepping forward by `d`
- close enough to the surface (`d` near 0) → hit!
- gone too far without hitting anything → nothing there

---

# Getting a camera ray per pixel

```glsl
vec3 getCameraRayDir(vec2 uv, vec3 camPos, vec3 camTarget) {
  vec3 camForward = normalize(camTarget - camPos);
  vec3 camRight = normalize(cross(vec3(0.0, 1.0, 0.0), camForward));
  vec3 camUp = normalize(cross(camForward, camRight));
  return normalize(uv.x * camRight + uv.y * camUp + camForward * 2.0);
}
```

- `uv` = the pixel's screen-space coordinate (like before, but now it steers a ray direction instead of a color directly)

---

# Hollowing out a pumpkin

Same `add`/`sub` combinators as in 2D – just with spheres now:

```glsl
float pumpkin(vec3 p) {
  float shell = sdSphere(p, 3.0);
  shell = sub(sdSphere(p, 2.9), shell);          // hollow it out
  shell = sub(sdSphere(p - eyeLeft, 0.7), shell);  // carve an eye
  shell = sub(sdSphere(p - eyeRight, 0.7), shell); // carve an eye
  shell = sub(mouth, shell);                       // carve the mouth
  return shell;
}
```

- subtraction removes material – exactly like cutting a hole in 2D, just in 3D space now

---

# Shading: surface normals

To make it look like a solid object, we need lighting – which needs a surface normal

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

- sample the SDF slightly offset in each axis → the direction of steepest change *is* the surface normal
- feed that into a simple diffuse lighting calculation

---

# DEMO: Spooky Raymarch Pumpkin Armada 🎃

## [DEMO](https://codepen.io/learosema/pen/MWeYvPv)

- an infinite field of hollowed-out pumpkins, all built from spheres via `add`/`sub`
- animated eyes, wobbly mouth, subtle deformation for that hand-carved look
- full raymarched camera orbiting the scene + a synced chiptune soundtrack

---

# Beyond live-coding: real SDF tools

These same building blocks (primitives + boolean ops) power actual modeling software, not just shader demos:

## [SDF Modeler](https://sascha-rode.itch.io/sdf-modeler) by Sascha Rode

- a free, standalone 3D modeling tool – think "Blender, but everything is SDFs"
- non-destructive: combine primitives with boolean ops (union/subtract/intersect), blend, repeat
- exports to a regular mesh (.ply/.stl) once you're happy with the shape

---

# Perlin noise & co

Sometimes you don't want a clean geometric shape – you want something that looks organic: fire, clouds, water, terrain, wood grain...

That's where **noise functions** come in: smooth, pseudo-random values that vary continuously across space (and time)

---

# It starts with a hash

A hash function turns a coordinate into a pseudo-random number – no two nearby inputs should look related

```glsl
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
```

- deterministic: same input → same output every time (important for a stable-looking scene!)
- but looks completely random from one pixel to the next

---

# From hash to noise

Plain hash values are just static, "salt and pepper" random – noise needs to be **smooth**

The trick: hash the 4 corners of a grid cell, then interpolate between them based on where inside the cell we are

```glsl
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f); // smoothstep-like easing

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
```

This is "value noise" – Perlin noise works similarly, but interpolates gradients instead of values (smoother, but a bit more math)

---

# Layering noise: fractal Brownian motion (fBm)

A single noise call looks a bit too uniform/blobby. Stack multiple octaves at different frequencies & amplitudes for natural-looking detail:

```glsl
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.0;          // double the frequency
    amplitude *= 0.5;  // halve the amplitude
  }
  return value;
}
```

This is the classic recipe behind procedural clouds, fire, marble, terrain heightmaps...

---

# Using it

```glsl
void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  float n = fbm(uv * 5.0 + time * 0.2);
  fragColor = vec4(vec3(n), 1.0);
}
```

- animate it by adding `time` to the input coordinates
- use it to drive color, or feed it into an SDF as a `deformation()` term (remember the wobbly pumpkin? 👀 – same principle, just with structured noise instead of a simple `sin`)

---

# Further learning materials

- <https://github.com/learosema/hello-webgl/> – this talk's repo
- <https://learosema.github.io/hello-webgl/talk-webgl/> – the slides, live
- <https://thebookofshaders.com/> – noise & fBm chapter especially worth it
- <https://github.com/ashima/webgl-noise> – battle-tested, optimized noise implementations to just drop in
- <https://iquilezles.org/articles/> – Inigo Quilez's articles on SDFs, raymarching & noise (the deep end)
- <https://webglfundamentals.org> – solid WebGL fundamentals reference
- <https://github.com/vaneenige/phenomenon/>

---

# Putting it all together

- [DEMO](https://codepen.io/learosema/pen/eqNjjY?editors=0010)

---

# Thank you 👩‍💻

## Feedback and Questions

- talk to me afterwards 🙂
- DM me on Mastodon (`@lea@lea.lgbt`)
- or file an issue in my repo
