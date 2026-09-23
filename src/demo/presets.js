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
    id: 'pumpkin-2d',
    label: { en: '4. 🎃 2D pumpkin face', de: '4. 🎃 2D-Kürbisgesicht' },
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

float face(vec2 p) {
  float d = sdCircle(p, 0.4);
  d -= abs(cos(p.x * 24.0)) * .03; // a ridged pumpkin outline, via deform
  d = sub(d, sdCircle(p - vec2(-0.18, 0.1), 0.08)); // left eye
  d = sub(d, sdCircle(p - vec2( 0.18, 0.1), 0.08)); // right eye
  return d;
}

float mouth(vec2 p) {
  p -= vec2(0.0, -0.15);
  vec2 mScale = vec2(1.0, 1.5);
  float d = sdCircle(p * mScale, .22);
  d = sub(d, sdCircle(p * mScale - vec2(0, .2), .21)); // crescent: circle minus a shifted circle
  d += abs(sin(p.x * 64.0) * 0.02); // jagged teeth, via deform
  return d;
}

float scene(vec2 p) {
  float d = face(p);
  d = sub(d, mouth(p)); // cut the mouth out of the face
  return d;
}

void main() {
  vec2 uv = (vUv - 0.5) * vec2(1.0, -1.0) * resolution / min(resolution.x, resolution.y);
  float d = scene(uv);
  vec3 color = d < 0.0 ? vec3(1.0, 0.55, 0.1) : vec3(0.05, 0.05, 0.08);
  fragColor = vec4(color, 1.0);
}
`,
  },
  {
    id: 'raymarch-sphere',
    label: { en: '5. Raymarching: sphere', de: '5. Raymarching: Kugel' },
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
    label: { en: '6. Pumpkin: ridges', de: '6. Kürbis: Rillen' },
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
    label: { en: '7. Pumpkin: eyes', de: '7. Kürbis: Augen' },
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
    label: { en: '8. Pumpkin: hollowed out', de: '8. Kürbis: ausgehöhlt' },
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
    label: { en: '9. 🎃 Pumpkin', de: '9. 🎃 Kürbis' },
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
vec3 candleHole = vec3(0.0, 0.1, -0.85);

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
  mouth = mouth + cos(p.x * 64.) * .01; // a bit of a jagged mouth edge
  d = opSubtract(d, mouth);

  d = opSubtract(d, sdSphere(p - candleHole, 0.5)); // 6. a hole in the back for the candle

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
    id: 'pumpkin-textured',
    label: { en: '10. 🎃 Pumpkin: texture', de: '10. 🎃 Kürbis: Textur' },
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
vec3 candleHole = vec3(0.0, 0.1, -0.85);

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
  mouth = mouth + cos(p.x * 64.) * .01; // a bit of a jagged mouth edge
  d = opSubtract(d, mouth);

  d = opSubtract(d, sdSphere(p - candleHole, 0.5)); // 6. a hole in the back for the candle

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

// 7. texture: a bit of noise sampled at the hit position, so the color sticks
// to the surface instead of swimming around as the camera moves.
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

// everything about lighting a raymarched hit, bundled into one call
vec3 shade(vec3 rayOrigin, vec3 rayDir) {
  float t = castRay(rayOrigin, rayDir);
  vec3 color = vec3(0.05, 0.05, 0.08); // background

  if (t < 80.0) {
    vec3 pos = rayOrigin + rayDir * t;
    vec3 normal = calcNormal(pos);
    vec3 lightDir = normalize(vec3(0.6, 0.8, 0.4));
    float diffuse = max(dot(normal, lightDir), 0.0);

    float n = fbm(pos.xz * 6.0 + pos.y * 3.0);
    vec3 pumpkinColor = mix(vec3(0.85, 0.3, 0.05), vec3(1.0, 0.6, 0.15), n);

    color = pumpkinColor * diffuse + vec3(0.1);
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
    id: 'pumpkin-materials',
    label: { en: '11. 🎃 Pumpkin: materials (stem)', de: '11. 🎃 Kürbis: Materialien (Stiel)' },
    code: `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;
uniform vec2 resolution;
uniform vec3 cameraPos; // drag to orbit, wheel to zoom - see the "Variables" help

float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

// a cone with the tip cut off - h = half-height, r1 = bottom radius, r2 = top
// radius. centered on the y axis, from -h to h.
float sdCappedCone(vec3 p, float h, float r1, float r2) {
  vec2 q = vec2(length(p.xz), p.y);
  vec2 k1 = vec2(r2, h);
  vec2 k2 = vec2(r2 - r1, 2.0 * h);
  vec2 ca = vec2(q.x - min(q.x, (q.y < 0.0) ? r1 : r2), abs(q.y) - h);
  vec2 cb = q - k1 + k2 * clamp(dot(k1 - q, k2) / dot(k2, k2), 0.0, 1.0);
  float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
  return s * sqrt(min(dot(ca, ca), dot(cb, cb)));
}

float opSubtract(float a, float b) {
  return max(a, -b);
}

// the smooth-union style blend, but for subtraction: rounds off the seam instead of leaving a hard edge
float opSmoothSubtract(float a, float b, float k) {
  float h = clamp(0.5 - 0.5 * (a + b) / k, 0.0, 1.0);
  return mix(a, -b, h) + k * h * (1.0 - h);
}

// 8. multiple materials: carry a material id alongside the distance. x = distance,
// y = material id. Union just keeps whichever candidate is closer, id included.
vec2 opUnionMat(vec2 a, vec2 b) {
  return a.x < b.x ? a : b;
}

vec3 eyeLeft = vec3(-0.35, 0.15, 0.85);
vec3 eyeRight = vec3(0.35, 0.15, 0.85);
vec3 mouthPos = vec3(0.0, -0.35, 0.85);
vec3 candleHole = vec3(0.0, 0.1, -0.85);

float sdStem(vec3 p) {
  vec3 sp = p - vec3(0.0, 1.15, 0.0); // centered on the pumpkin's top pole
  sp.x += sin(p.y * 4.0) * 0.2 + 0.1; // a little bend for character
  return sdCappedCone(sp, 0.18, 0.14, 0.08); // a frustum: wide base, cut-off top
}

vec2 scene(vec3 p) {
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
  mouth = mouth + cos(p.x * 64.) * .01; // a bit of a jagged mouth edge
  d = opSubtract(d, mouth);

  d = opSubtract(d, sdSphere(p - candleHole, 0.5)); // 6. a hole in the back for the candle

  vec2 result = vec2(d, 0.0);                    // material 0: pumpkin shell
  result = opUnionMat(result, vec2(sdStem(p), 1.0)); // 8. material 1: the stem

  return result;
}

float castRay(vec3 rayOrigin, vec3 rayDir) {
  float t = 0.1;
  for (int i = 0; i < 100; i++) {
    float d = scene(rayOrigin + rayDir * t).x;
    if (d < 0.001 * t || t > 80.0) break;
    // the angle-based ridges make scene() a bit steeper than a true distance
    // field (its gradient isn't exactly 1 everywhere) - stepping only half the
    // reported distance keeps marching safe instead of overshooting the surface.
    t += d * 0.5;
  }
  return t;
}

vec3 calcNormal(vec3 pos) {
  float c = scene(pos).x;
  vec2 e = vec2(0.001, 0.0);
  return normalize(vec3(
    scene(pos + e.xyy).x,
    scene(pos + e.yxy).x,
    scene(pos + e.yyx).x
  ) - c);
}

// 7. texture: a bit of noise sampled at the hit position, so the color sticks
// to the surface instead of swimming around as the camera moves.
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

// everything about lighting a raymarched hit, bundled into one call
vec3 shade(vec3 rayOrigin, vec3 rayDir) {
  float t = castRay(rayOrigin, rayDir);
  vec3 color = vec3(0.05, 0.05, 0.08); // background

  if (t < 80.0) {
    vec3 pos = rayOrigin + rayDir * t;
    vec2 hit = scene(pos); // hit.y tells us which material we landed on
    vec3 normal = calcNormal(pos);
    vec3 lightDir = normalize(vec3(0.6, 0.8, 0.4));
    float diffuse = max(dot(normal, lightDir), 0.0);

    vec3 baseColor;
    if (hit.y < 0.5) {
      float n = fbm(pos.xz * 6.0 + pos.y * 3.0);
      baseColor = mix(vec3(0.85, 0.3, 0.05), vec3(1.0, 0.6, 0.15), n); // material 0: pumpkin
    } else {
      baseColor = vec3(0.25, 0.55, 0.15); // material 1: stem
    }

    color = baseColor * diffuse + vec3(0.1);
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
    id: 'pumpkin-aa',
    label: { en: '12. 🎃 Pumpkin: antialiasing', de: '12. 🎃 Kürbis: Antialiasing' },
    code: `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;
uniform vec2 resolution;
uniform vec3 cameraPos; // drag to orbit, wheel to zoom - see the "Variables" help

float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

// a cone with the tip cut off - h = half-height, r1 = bottom radius, r2 = top
// radius. centered on the y axis, from -h to h.
float sdCappedCone(vec3 p, float h, float r1, float r2) {
  vec2 q = vec2(length(p.xz), p.y);
  vec2 k1 = vec2(r2, h);
  vec2 k2 = vec2(r2 - r1, 2.0 * h);
  vec2 ca = vec2(q.x - min(q.x, (q.y < 0.0) ? r1 : r2), abs(q.y) - h);
  vec2 cb = q - k1 + k2 * clamp(dot(k1 - q, k2) / dot(k2, k2), 0.0, 1.0);
  float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
  return s * sqrt(min(dot(ca, ca), dot(cb, cb)));
}

float opSubtract(float a, float b) {
  return max(a, -b);
}

// the smooth-union style blend, but for subtraction: rounds off the seam instead of leaving a hard edge
float opSmoothSubtract(float a, float b, float k) {
  float h = clamp(0.5 - 0.5 * (a + b) / k, 0.0, 1.0);
  return mix(a, -b, h) + k * h * (1.0 - h);
}

// 8. multiple materials: carry a material id alongside the distance. x = distance,
// y = material id. Union just keeps whichever candidate is closer, id included.
vec2 opUnionMat(vec2 a, vec2 b) {
  return a.x < b.x ? a : b;
}

vec3 eyeLeft = vec3(-0.35, 0.15, 0.85);
vec3 eyeRight = vec3(0.35, 0.15, 0.85);
vec3 mouthPos = vec3(0.0, -0.35, 0.85);
vec3 candleHole = vec3(0.0, 0.1, -0.85);

float sdStem(vec3 p) {
  vec3 sp = p - vec3(0.0, 1.15, 0.0); // centered on the pumpkin's top pole
  sp.x += sin(p.y * 4.0) * 0.2 + 0.1; // a little bend for character
  return sdCappedCone(sp, 0.18, 0.14, 0.08); // a frustum: wide base, cut-off top
}

vec2 scene(vec3 p) {
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
  mouth = mouth + cos(p.x * 64.) * .01; // a bit of a jagged mouth edge
  d = opSubtract(d, mouth);

  d = opSubtract(d, sdSphere(p - candleHole, 0.5)); // 6. a hole in the back for the candle

  vec2 result = vec2(d, 0.0);                    // material 0: pumpkin shell
  result = opUnionMat(result, vec2(sdStem(p), 1.0)); // 8. material 1: the stem

  return result;
}

float castRay(vec3 rayOrigin, vec3 rayDir) {
  float t = 0.1;
  for (int i = 0; i < 100; i++) {
    float d = scene(rayOrigin + rayDir * t).x;
    if (d < 0.001 * t || t > 80.0) break;
    // the angle-based ridges make scene() a bit steeper than a true distance
    // field (its gradient isn't exactly 1 everywhere) - stepping only half the
    // reported distance keeps marching safe instead of overshooting the surface.
    t += d * 0.5;
  }
  return t;
}

vec3 calcNormal(vec3 pos) {
  float c = scene(pos).x;
  vec2 e = vec2(0.001, 0.0);
  return normalize(vec3(
    scene(pos + e.xyy).x,
    scene(pos + e.yxy).x,
    scene(pos + e.yyx).x
  ) - c);
}

// 7. texture: a bit of noise sampled at the hit position, so the color sticks
// to the surface instead of swimming around as the camera moves.
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

// everything about lighting a raymarched hit, bundled into one call
vec3 shade(vec3 rayOrigin, vec3 rayDir) {
  float t = castRay(rayOrigin, rayDir);
  vec3 color = vec3(0.05, 0.05, 0.08); // background

  if (t < 80.0) {
    vec3 pos = rayOrigin + rayDir * t;
    vec2 hit = scene(pos); // hit.y tells us which material we landed on
    vec3 normal = calcNormal(pos);
    vec3 lightDir = normalize(vec3(0.6, 0.8, 0.4));
    float diffuse = max(dot(normal, lightDir), 0.0);

    vec3 baseColor;
    if (hit.y < 0.5) {
      float n = fbm(pos.xz * 6.0 + pos.y * 3.0);
      baseColor = mix(vec3(0.85, 0.3, 0.05), vec3(1.0, 0.6, 0.15), n); // material 0: pumpkin
    } else {
      baseColor = vec3(0.25, 0.55, 0.15); // material 1: stem
    }

    color = baseColor * diffuse + vec3(0.1);
  }

  return color;
}

vec3 getCameraRayDir(vec2 uv, vec3 camPos, vec3 camTarget) {
  vec3 camForward = normalize(camTarget - camPos);
  vec3 camRight = normalize(cross(camForward, vec3(0.0, 1.0, 0.0)));
  vec3 camUp = normalize(cross(camRight, camForward));
  return normalize(uv.x * camRight + uv.y * camUp + camForward * 2.0);
}

// 9. antialiasing: a jagged raymarched edge doesn't get free MSAA like triangle
// rasterization does, so fake it by shading a small grid of sub-pixel rays and
// averaging them.
vec3 shadeAA(vec2 uv, vec3 camPos, vec3 camTarget) {
  float px = 1.0 / min(resolution.x, resolution.y); // one pixel, in the same units as uv
  vec3 color = vec3(0.0);
  const int AA = 2; // 2x2 = 4 samples per pixel
  for (int y = 0; y < AA; y++) {
    for (int x = 0; x < AA; x++) {
      vec2 offset = (vec2(x, y) / float(AA) - 0.5) * px;
      vec3 rayDir = getCameraRayDir(uv + offset, camPos, camTarget);
      color += shade(camPos, rayDir);
    }
  }
  return color / float(AA * AA);
}

void main() {
  vec2 uv = (vUv - 0.5) * vec2(1.0, -1.0) * resolution / min(resolution.x, resolution.y);

  vec3 camPos = cameraPos;
  vec3 camTarget = vec3(0.0);
  vec3 color = shadeAA(uv, camPos, camTarget);

  fragColor = vec4(color, 1.0);
}
`,
  },
  {
    id: 'noise-fbm',
    label: { en: '13. Perlin noise / fBm', de: '13. Perlin Noise / fBm' },
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
