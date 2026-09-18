// Presets follow the talk's agenda, so this can double as a live-coding tool.
export const presets = [
  {
    id: 'gradient',
    label: '1. Hello Shader',
    code: `#version 300 es
precision highp float;

out vec4 fragColor;
uniform vec2 resolution;
uniform float time;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec3 color = vec3(uv.x, uv.y, sin(time) * 0.5 + 0.5);
  fragColor = vec4(color, 1.0);
}
`,
  },
  {
    id: 'sdf-circle',
    label: '2. SDF: Kreis',
    code: `#version 300 es
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
`,
  },
  {
    id: 'combine-ring',
    label: '3. Formen kombinieren: Ring',
    code: `#version 300 es
precision highp float;

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
  vec2 uv = (gl_FragCoord.xy - 0.5 * resolution) / min(resolution.x, resolution.y);
  float d = ring(uv);
  vec3 color = vec3(step(0.0, d));
  fragColor = vec4(color, 1.0);
}
`,
  },
  {
    id: 'raymarch-sphere',
    label: '4. Raymarching: Kugel',
    code: `#version 300 es
precision highp float;

out vec4 fragColor;
uniform vec2 resolution;
uniform float time;

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

vec3 getCameraRayDir(vec2 uv, vec3 camPos, vec3 camTarget) {
  vec3 camForward = normalize(camTarget - camPos);
  vec3 camRight = normalize(cross(vec3(0.0, 1.0, 0.0), camForward));
  vec3 camUp = normalize(cross(camForward, camRight));
  return normalize(uv.x * camRight + uv.y * camUp + camForward * 2.0);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * resolution) / min(resolution.x, resolution.y);

  vec3 camPos = vec3(sin(time * 0.3) * 4.0, 1.5, cos(time * 0.3) * 4.0);
  vec3 camTarget = vec3(0.0);
  vec3 rayDir = getCameraRayDir(uv, camPos, camTarget);

  float t = castRay(camPos, rayDir);
  vec3 color = vec3(0.05, 0.05, 0.08); // background

  if (t < 80.0) {
    vec3 pos = camPos + rayDir * t;
    vec3 normal = calcNormal(pos);
    vec3 lightDir = normalize(vec3(0.6, 0.8, 0.4));
    float diffuse = max(dot(normal, lightDir), 0.0);
    color = vec3(1.0, 0.4, 0.1) * diffuse + vec3(0.1);
  }

  fragColor = vec4(color, 1.0);
}
`,
  },
  {
    id: 'noise-fbm',
    label: '5. Perlin Noise / fBm',
    code: `#version 300 es
precision highp float;

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
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  float n = fbm(uv * 5.0 + time * 0.2);
  fragColor = vec4(vec3(n), 1.0);
}
`,
  },
];
