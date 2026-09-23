// Presets follow the talk's agenda, so this can double as a live-coding tool.
export const presets = [
  {
    id: 'gradient',
    label: { en: '1. Hello Shader', de: '1. Hello Shader' },
    code: `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;
uniform vec2 resolution;
uniform float time;

void main() {
  vec2 uv = vUv;
  vec3 color = vec3(uv.x, uv.y, sin(time) * 0.5 + 0.5);
  fragColor = vec4(color, 1.0);
}
`,
  },
  {
    id: 'sdf-circle',
    label: { en: '2. SDF: Circle', de: '2. SDF: Kreis' },
    code: `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;
uniform vec2 resolution;

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

void main() {
  vec2 uv = (vUv - 0.5) * vec2(1.0, -1.0) * resolution / min(resolution.x, resolution.y);
  float d = sdCircle(uv, 0.3);
  vec3 color = vec3(step(0.0, d)); // white outside, black inside
  fragColor = vec4(color, 1.0);
}
`,
  },
  {
    id: 'combine-ring',
    label: { en: '3. Combining shapes: ring', de: '3. Formen kombinieren: Ring' },
    code: `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;
uniform vec2 resolution;

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

// union: the smaller (= closer) distance wins
float add(float a, float b) {
  return min(a, b);
}

// subtraction: cut b out of a
float sub(float a, float b) {
  return max(-b, a);
}

float ring(vec2 p) {
  float d = 999.0;              // start "empty" (nothing is inside yet)
  d = add(d, sdCircle(p, 0.4)); // union in the outer circle
  d = sub(d, sdCircle(p, 0.3)); // subtract the inner circle
  return d;
}

void main() {
  vec2 uv = (vUv - 0.5) * vec2(1.0, -1.0) * resolution / min(resolution.x, resolution.y);
  float d = ring(uv);
  vec3 color = vec3(step(0.0, d));
  fragColor = vec4(color, 1.0);
}
`,
  },
  {
    id: 'raymarch-sphere',
    label: { en: '4. Raymarching: sphere', de: '4. Raymarching: Kugel' },
    code: `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;
uniform vec2 resolution;
uniform vec3 cameraPos; // drag to orbit, wheel to zoom - see the "Variables" help

float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

float scene(vec3 p) {
  return sdSphere(p, 1.0);
}

float castRay(vec3 rayOrigin, vec3 rayDir) {
  float t = 0.1;
  for (int i = 0; i < 100; i++) {
    float d = scene(rayOrigin + rayDir * t);
    if (d < 0.001 * t || t > 80.0) break;
    t += d;
  }
  return t;
}

vec3 calcNormal(vec3 pos) {
  float c = scene(pos);
  vec2 e = vec2(0.001, 0.0);
  return normalize(vec3(
    scene(pos + e.xyy),
    scene(pos + e.yxy),
    scene(pos + e.yyx)
  ) - c);
}

// everything about lighting a raymarched hit, bundled into one call
vec3 shade(vec3 rayOrigin, vec3 rayDir) {
  float t = castRay(rayOrigin, rayDir);
  vec3 color = vec3(0.05, 0.05, 0.08); // background

  if (t < 80.0) {
    vec3 pos = rayOrigin + rayDir * t;
    vec3 normal = calcNormal(pos);
    vec3 lightDir = normalize(vec3(0.6, 0.8, 0.4));
    float diffuse = max(dot(normal, lightDir), 0.0);
    color = vec3(1.0, 0.4, 0.1) * diffuse + vec3(0.1);
  }

  return color;
}

vec3 getCameraRayDir(vec2 uv, vec3 camPos, vec3 camTarget) {
  vec3 camForward = normalize(camTarget - camPos);
  vec3 camRight = normalize(cross(camForward, vec3(0.0, 1.0, 0.0)));
  vec3 camUp = normalize(cross(camRight, camForward));
  return normalize(uv.x * camRight + uv.y * camUp + camForward * 2.0);
}

void main() {
  vec2 uv = (vUv - 0.5) * vec2(1.0, -1.0) * resolution / min(resolution.x, resolution.y);

  vec3 camPos = cameraPos;
  vec3 camTarget = vec3(0.0);
  vec3 rayDir = getCameraRayDir(uv, camPos, camTarget);

  vec3 color = shade(camPos, rayDir);

  fragColor = vec4(color, 1.0);
}
`,
  },
  {
    id: 'pumpkin-ridges',
    label: { en: '5. Pumpkin: ridges', de: '5. Kürbis: Rillen' },
    code: `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;
uniform vec2 resolution;
uniform vec3 cameraPos; // drag to orbit, wheel to zoom - see the "Variables" help

float scene(vec3 p) {
  float angle = atan(p.z, p.x);
  float fade = smoothstep(0.3, 0.9, length(p.xz)); // ridges taper off toward the top/bottom, like a real pumpkin
  float r = 1.0 + 0.06 * cos(angle * 10.0) * fade; // 1+2. a sphere with ridges - the "deform" trick
  return length(p) - r;
}

float castRay(vec3 rayOrigin, vec3 rayDir) {
  float t = 0.1;
  for (int i = 0; i < 100; i++) {
    float d = scene(rayOrigin + rayDir * t);
    if (d < 0.001 * t || t > 80.0) break;
    // the angle-based ridges make scene() a bit steeper than a true distance
    // field (its gradient isn't exactly 1 everywhere) - stepping only half the
    // reported distance keeps marching safe instead of overshooting the surface.
    t += d * 0.5;
  }
  return t;
}

vec3 calcNormal(vec3 pos) {
  float c = scene(pos);
  vec2 e = vec2(0.001, 0.0);
  return normalize(vec3(
    scene(pos + e.xyy),
    scene(pos + e.yxy),
    scene(pos + e.yyx)
  ) - c);
}

// everything about lighting a raymarched hit, bundled into one call
vec3 shade(vec3 rayOrigin, vec3 rayDir) {
  float t = castRay(rayOrigin, rayDir);
  vec3 color = vec3(0.05, 0.05, 0.08); // background

  if (t < 80.0) {
    vec3 pos = rayOrigin + rayDir * t;
    vec3 normal = calcNormal(pos);
    vec3 lightDir = normalize(vec3(0.6, 0.8, 0.4));
    float diffuse = max(dot(normal, lightDir), 0.0);
    color = vec3(1.0, 0.4, 0.1) * diffuse + vec3(0.1);
  }

  return color;
}

vec3 getCameraRayDir(vec2 uv, vec3 camPos, vec3 camTarget) {
  vec3 camForward = normalize(camTarget - camPos);
  vec3 camRight = normalize(cross(camForward, vec3(0.0, 1.0, 0.0)));
  vec3 camUp = normalize(cross(camRight, camForward));
  return normalize(uv.x * camRight + uv.y * camUp + camForward * 2.0);
}

void main() {
  vec2 uv = (vUv - 0.5) * vec2(1.0, -1.0) * resolution / min(resolution.x, resolution.y);

  vec3 camPos = cameraPos;
  vec3 camTarget = vec3(0.0);
  vec3 rayDir = getCameraRayDir(uv, camPos, camTarget);

  vec3 color = shade(camPos, rayDir);

  fragColor = vec4(color, 1.0);
}
`,
  },
  {
    id: 'pumpkin-eyes',
    label: { en: '6. Pumpkin: eyes', de: '6. Kürbis: Augen' },
    code: `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;
uniform vec2 resolution;
uniform vec3 cameraPos; // drag to orbit, wheel to zoom - see the "Variables" help

float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

float opSubtract(float a, float b) {
  return max(a, -b);
}

vec3 eyeLeft = vec3(-0.35, 0.15, 0.85);
vec3 eyeRight = vec3(0.35, 0.15, 0.85);

float scene(vec3 p) {
  float angle = atan(p.z, p.x);
  float fade = smoothstep(0.3, 0.9, length(p.xz)); // ridges taper off toward the top/bottom, like a real pumpkin
  float r = 1.0 + 0.06 * cos(angle * 10.0) * fade; // 1+2. a sphere with ridges - the "deform" trick
  float d = length(p) - r;

  d = opSubtract(d, sdSphere(p - eyeLeft, 0.18));  // 3. cut the eyes
  d = opSubtract(d, sdSphere(p - eyeRight, 0.18)); // 3. cut the eyes

  return d;
}

float castRay(vec3 rayOrigin, vec3 rayDir) {
  float t = 0.1;
  for (int i = 0; i < 100; i++) {
    float d = scene(rayOrigin + rayDir * t);
    if (d < 0.001 * t || t > 80.0) break;
    t += d * 0.5; // conservative step - see the "ridges" preset
  }
  return t;
}

vec3 calcNormal(vec3 pos) {
  float c = scene(pos);
  vec2 e = vec2(0.001, 0.0);
  return normalize(vec3(
    scene(pos + e.xyy),
    scene(pos + e.yxy),
    scene(pos + e.yyx)
  ) - c);
}

// everything about lighting a raymarched hit, bundled into one call
vec3 shade(vec3 rayOrigin, vec3 rayDir) {
  float t = castRay(rayOrigin, rayDir);
  vec3 color = vec3(0.05, 0.05, 0.08); // background

  if (t < 80.0) {
    vec3 pos = rayOrigin + rayDir * t;
    vec3 normal = calcNormal(pos);
    vec3 lightDir = normalize(vec3(0.6, 0.8, 0.4));
    float diffuse = max(dot(normal, lightDir), 0.0);
    color = vec3(1.0, 0.4, 0.1) * diffuse + vec3(0.1);
  }

  return color;
}

vec3 getCameraRayDir(vec2 uv, vec3 camPos, vec3 camTarget) {
  vec3 camForward = normalize(camTarget - camPos);
  vec3 camRight = normalize(cross(camForward, vec3(0.0, 1.0, 0.0)));
  vec3 camUp = normalize(cross(camRight, camForward));
  return normalize(uv.x * camRight + uv.y * camUp + camForward * 2.0);
}

void main() {
  vec2 uv = (vUv - 0.5) * vec2(1.0, -1.0) * resolution / min(resolution.x, resolution.y);

  vec3 camPos = cameraPos;
  vec3 camTarget = vec3(0.0);
  vec3 rayDir = getCameraRayDir(uv, camPos, camTarget);

  vec3 color = shade(camPos, rayDir);

  fragColor = vec4(color, 1.0);
}
`,
  },
  {
    id: 'pumpkin-hollow',
    label: { en: '7. Pumpkin: hollowed out', de: '7. Kürbis: ausgehöhlt' },
    code: `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;
uniform vec2 resolution;
uniform vec3 cameraPos; // drag to orbit, wheel to zoom - see the "Variables" help

float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

float opSubtract(float a, float b) {
  return max(a, -b);
}

vec3 eyeLeft = vec3(-0.35, 0.15, 0.85);
vec3 eyeRight = vec3(0.35, 0.15, 0.85);

float scene(vec3 p) {
  float angle = atan(p.z, p.x);
  float fade = smoothstep(0.3, 0.9, length(p.xz)); // ridges taper off toward the top/bottom, like a real pumpkin
  float r = 1.0 + 0.06 * cos(angle * 10.0) * fade; // 1+2. a sphere with ridges - the "deform" trick
  float d = length(p) - r;

  d = opSubtract(d, sdSphere(p - eyeLeft, 0.18));  // 3. cut the eyes
  d = opSubtract(d, sdSphere(p - eyeRight, 0.18)); // 3. cut the eyes

  d = opSubtract(d, sdSphere(p, 0.9)); // 4. hollow it out

  return d;
}

float castRay(vec3 rayOrigin, vec3 rayDir) {
  float t = 0.1;
  for (int i = 0; i < 100; i++) {
    float d = scene(rayOrigin + rayDir * t);
    if (d < 0.001 * t || t > 80.0) break;
    t += d * 0.5; // conservative step - see the "ridges" preset
  }
  return t;
}

vec3 calcNormal(vec3 pos) {
  float c = scene(pos);
  vec2 e = vec2(0.001, 0.0);
  return normalize(vec3(
    scene(pos + e.xyy),
    scene(pos + e.yxy),
    scene(pos + e.yyx)
  ) - c);
}

// everything about lighting a raymarched hit, bundled into one call
vec3 shade(vec3 rayOrigin, vec3 rayDir) {
  float t = castRay(rayOrigin, rayDir);
  vec3 color = vec3(0.05, 0.05, 0.08); // background

  if (t < 80.0) {
    vec3 pos = rayOrigin + rayDir * t;
    vec3 normal = calcNormal(pos);
    vec3 lightDir = normalize(vec3(0.6, 0.8, 0.4));
    float diffuse = max(dot(normal, lightDir), 0.0);
    color = vec3(1.0, 0.4, 0.1) * diffuse + vec3(0.1);
  }

  return color;
}

vec3 getCameraRayDir(vec2 uv, vec3 camPos, vec3 camTarget) {
  vec3 camForward = normalize(camTarget - camPos);
  vec3 camRight = normalize(cross(camForward, vec3(0.0, 1.0, 0.0)));
  vec3 camUp = normalize(cross(camRight, camForward));
  return normalize(uv.x * camRight + uv.y * camUp + camForward * 2.0);
}

void main() {
  vec2 uv = (vUv - 0.5) * vec2(1.0, -1.0) * resolution / min(resolution.x, resolution.y);

  vec3 camPos = cameraPos;
  vec3 camTarget = vec3(0.0);
  vec3 rayDir = getCameraRayDir(uv, camPos, camTarget);

  vec3 color = shade(camPos, rayDir);

  fragColor = vec4(color, 1.0);
}
`,
  },
  {
    id: 'pumpkin',
    label: { en: '8. 🎃 Pumpkin', de: '8. 🎃 Kürbis' },
    code: `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;
uniform vec2 resolution;
uniform vec3 cameraPos; // drag to orbit, wheel to zoom - see the "Variables" help

float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

float opSubtract(float a, float b) {
  return max(a, -b);
}

// the smooth-union style blend, but for subtraction: rounds off the seam instead of leaving a hard edge
float opSmoothSubtract(float a, float b, float k) {
  float h = clamp(0.5 - 0.5 * (a + b) / k, 0.0, 1.0);
  return mix(a, -b, h) + k * h * (1.0 - h);
}

vec3 eyeLeft = vec3(-0.35, 0.15, 0.85);
vec3 eyeRight = vec3(0.35, 0.15, 0.85);
vec3 mouthPos = vec3(0.0, -0.35, 0.85);

float scene(vec3 p) {
  float angle = atan(p.z, p.x);
  float fade = smoothstep(0.3, 0.9, length(p.xz)); // ridges taper off toward the top/bottom, like a real pumpkin
  float r = 1.0 + 0.06 * cos(angle * 10.0) * fade; // 1+2. a sphere with ridges - the "deform" trick
  float d = length(p) - r;

  d = opSubtract(d, sdSphere(p - eyeLeft, 0.18));  // 3. cut the eyes
  d = opSubtract(d, sdSphere(p - eyeRight, 0.18)); // 3. cut the eyes

  d = opSubtract(d, sdSphere(p, 0.9)); // 4. hollow it out

  // 5. the mouth: a sphere minus a sphere shifted upward, smoothed - a rounder grin than a jagged box
  vec3 mp = p - mouthPos;
  float mouthA = length(mp) - 0.4;
  float mouthB = length(mp - vec3(0.0, 0.28, 0.0)) - 0.38;
  float mouth = opSmoothSubtract(mouthA, mouthB, 0.25);
  d = opSubtract(d, mouth);

  return d;
}

float castRay(vec3 rayOrigin, vec3 rayDir) {
  float t = 0.1;
  for (int i = 0; i < 100; i++) {
    float d = scene(rayOrigin + rayDir * t);
    if (d < 0.001 * t || t > 80.0) break;
    // the angle-based ridges make scene() a bit steeper than a true distance
    // field (its gradient isn't exactly 1 everywhere) - stepping only half the
    // reported distance keeps marching safe instead of overshooting the surface.
    t += d * 0.5;
  }
  return t;
}

vec3 calcNormal(vec3 pos) {
  float c = scene(pos);
  vec2 e = vec2(0.001, 0.0);
  return normalize(vec3(
    scene(pos + e.xyy),
    scene(pos + e.yxy),
    scene(pos + e.yyx)
  ) - c);
}

// everything about lighting a raymarched hit, bundled into one call
vec3 shade(vec3 rayOrigin, vec3 rayDir) {
  float t = castRay(rayOrigin, rayDir);
  vec3 color = vec3(0.05, 0.05, 0.08); // background

  if (t < 80.0) {
    vec3 pos = rayOrigin + rayDir * t;
    vec3 normal = calcNormal(pos);
    vec3 lightDir = normalize(vec3(0.6, 0.8, 0.4));
    float diffuse = max(dot(normal, lightDir), 0.0);
    color = vec3(1.0, 0.4, 0.1) * diffuse + vec3(0.1);
  }

  return color;
}

vec3 getCameraRayDir(vec2 uv, vec3 camPos, vec3 camTarget) {
  vec3 camForward = normalize(camTarget - camPos);
  vec3 camRight = normalize(cross(camForward, vec3(0.0, 1.0, 0.0)));
  vec3 camUp = normalize(cross(camRight, camForward));
  return normalize(uv.x * camRight + uv.y * camUp + camForward * 2.0);
}

void main() {
  vec2 uv = (vUv - 0.5) * vec2(1.0, -1.0) * resolution / min(resolution.x, resolution.y);

  vec3 camPos = cameraPos;
  vec3 camTarget = vec3(0.0);
  vec3 rayDir = getCameraRayDir(uv, camPos, camTarget);

  vec3 color = shade(camPos, rayDir);

  fragColor = vec4(color, 1.0);
}
`,
  },
  {
    id: 'noise-fbm',
    label: { en: '9. Perlin noise / fBm', de: '9. Perlin Noise / fBm' },
    code: `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;
uniform vec2 resolution;
uniform float time;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

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

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.0;         // double the frequency
    amplitude *= 0.5; // halve the amplitude
  }
  return value;
}

void main() {
  vec2 uv = vUv;
  float n = fbm(uv * 5.0 + time * 0.2);
  fragColor = vec4(vec3(n), 1.0);
}
`,
  },
];
