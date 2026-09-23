// Helper snippets for the Snippets dropdown. Distance functions follow
// Inigo Quilez's collection (https://iquilezles.org/articles/distfunctions2d/ and
// /distfunctions/).
//
// A snippet with a `name` is a function definition: it is inserted above
// `void main` and skipped if a function of that name already exists. Snippets
// without a name are inserted at the cursor.

export const snippetGroups = {
  sdf2d: { en: '2D SDFs', de: '2D SDFs' },
  sdf3d: { en: '3D SDFs', de: '3D SDFs' },
  ops: { en: 'Operations', de: 'Operationen' },
  helpers: { en: 'Helpers', de: 'Hilfen' },
  raymarch: { en: 'Raymarching', de: 'Raymarching' },
  noise: { en: 'Noise', de: 'Rauschen' },
};

export const snippets = [
  {
    group: 'sdf2d',
    id: 'sdCircle',
    label: { en: 'Circle', de: 'Kreis' },
    name: 'sdCircle',
    code: `float sdCircle(vec2 p, float r) {
  return length(p) - r;
}
`,
  },
  {
    group: 'sdf2d',
    id: 'sdBox',
    label: { en: 'Rectangle', de: 'Rechteck' },
    name: 'sdBox',
    code: `float sdBox(vec2 p, vec2 halfSize) {
  vec2 d = abs(p) - halfSize;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}
`,
  },
  {
    group: 'sdf2d',
    id: 'sdRoundedBox',
    label: { en: 'Rounded rectangle', de: 'Abgerundetes Rechteck' },
    name: 'sdRoundedBox',
    code: `float sdRoundedBox(vec2 p, vec2 halfSize, float radius) {
  vec2 q = abs(p) - halfSize + radius;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
}
`,
  },
  {
    group: 'sdf2d',
    id: 'sdSegment',
    label: { en: 'Line segment', de: 'Linie (Segment)' },
    name: 'sdSegment',
    code: `float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}
`,
  },
  {
    group: 'sdf2d',
    id: 'sdTriangle',
    label: { en: 'Triangle', de: 'Dreieck' },
    name: 'sdTriangle',
    code: `float sdTriangle(vec2 p, vec2 p0, vec2 p1, vec2 p2) {
  vec2 e0 = p1 - p0, e1 = p2 - p1, e2 = p0 - p2;
  vec2 v0 = p - p0, v1 = p - p1, v2 = p - p2;
  vec2 pq0 = v0 - e0 * clamp(dot(v0, e0) / dot(e0, e0), 0.0, 1.0);
  vec2 pq1 = v1 - e1 * clamp(dot(v1, e1) / dot(e1, e1), 0.0, 1.0);
  vec2 pq2 = v2 - e2 * clamp(dot(v2, e2) / dot(e2, e2), 0.0, 1.0);
  float s = sign(e0.x * e2.y - e0.y * e2.x);
  vec2 d = min(min(vec2(dot(pq0, pq0), s * (v0.x * e0.y - v0.y * e0.x)),
                   vec2(dot(pq1, pq1), s * (v1.x * e1.y - v1.y * e1.x))),
                   vec2(dot(pq2, pq2), s * (v2.x * e2.y - v2.y * e2.x)));
  return -sqrt(d.x) * sign(d.y);
}
`,
  },
  {
    group: 'sdf3d',
    id: 'sdSphere',
    label: { en: 'Sphere', de: 'Kugel' },
    name: 'sdSphere',
    code: `float sdSphere(vec3 p, float r) {
  return length(p) - r;
}
`,
  },
  {
    group: 'sdf3d',
    id: 'sdBox3',
    label: { en: 'Box', de: 'Quader' },
    name: 'sdBox3',
    code: `float sdBox3(vec3 p, vec3 halfSize) {
  vec3 q = abs(p) - halfSize;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}
`,
  },
  {
    group: 'sdf3d',
    id: 'sdTorus',
    label: { en: 'Torus', de: 'Torus' },
    name: 'sdTorus',
    code: `float sdTorus(vec3 p, vec2 t) {
  // t.x = major radius, t.y = tube radius
  vec2 q = vec2(length(p.xz) - t.x, p.y);
  return length(q) - t.y;
}
`,
  },
  {
    group: 'sdf3d',
    id: 'sdCapsule',
    label: { en: 'Capsule (line with radius)', de: 'Kapsel (Linie mit Radius)' },
    name: 'sdCapsule',
    code: `float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a;
  vec3 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}
`,
  },
  {
    group: 'sdf3d',
    id: 'sdPlane',
    label: { en: 'Plane (y = h)', de: 'Ebene (y = h)' },
    name: 'sdPlane',
    code: `float sdPlane(vec3 p, float h) {
  return p.y - h;
}
`,
  },
  {
    group: 'ops',
    id: 'opUnion',
    label: { en: 'Union (min)', de: 'Vereinigung (min)' },
    name: 'opUnion',
    code: `float opUnion(float a, float b) {
  return min(a, b);
}
`,
  },
  {
    group: 'ops',
    id: 'opSubtract',
    label: { en: 'Subtraction (a without b)', de: 'Differenz (a ohne b)' },
    name: 'opSubtract',
    code: `float opSubtract(float a, float b) {
  return max(a, -b);
}
`,
  },
  {
    group: 'ops',
    id: 'opIntersect',
    label: { en: 'Intersection (max)', de: 'Schnittmenge (max)' },
    name: 'opIntersect',
    code: `float opIntersect(float a, float b) {
  return max(a, b);
}
`,
  },
  {
    group: 'ops',
    id: 'opSmoothUnion',
    label: { en: 'Smooth union', de: 'Weiche Vereinigung' },
    name: 'opSmoothUnion',
    code: `float opSmoothUnion(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}
`,
  },
  {
    group: 'ops',
    id: 'opOnion',
    label: { en: 'Outline / ring (onion)', de: 'Outline / Ring (Onion)' },
    name: 'opOnion',
    code: `float opOnion(float d, float thickness) {
  return abs(d) - thickness;
}
`,
  },
  {
    group: 'ops',
    id: 'opRepeat',
    label: { en: 'Repeat (tiling)', de: 'Wiederholen (Kacheln)' },
    name: 'opRepeat',
    code: `vec2 opRepeat(vec2 p, float cell) {
  return mod(p + 0.5 * cell, cell) - 0.5 * cell;
}
`,
  },
  {
    group: 'helpers',
    id: 'debugSdf',
    label: { en: 'Visualize distance field', de: 'Distanzfeld visualisieren' },
    name: 'debugSdf',
    code: `// Colours a signed distance: orange outside, blue inside, with iso-lines.
vec3 debugSdf(float d) {
  vec3 col = d > 0.0 ? vec3(0.9, 0.6, 0.3) : vec3(0.65, 0.85, 1.0);
  col *= 1.0 - exp(-6.0 * abs(d));
  col *= 0.8 + 0.2 * cos(150.0 * d);
  return mix(col, vec3(1.0), 1.0 - smoothstep(0.0, 0.01, abs(d)));
}
`,
  },
  {
    group: 'helpers',
    id: 'centeredUv',
    label: { en: 'Centered UV (aspect-correct)', de: 'UV zentriert (aspektkorrekt)' },
    code: `vec2 uv = (vUv - 0.5) * vec2(1.0, -1.0) * resolution / min(resolution.x, resolution.y);
`,
  },
  {
    group: 'helpers',
    id: 'aa',
    label: { en: 'Antialias edge (fwidth)', de: 'Kante antialiasen (fwidth)' },
    code: `float mask = 1.0 - smoothstep(0.0, fwidth(d), d);
`,
  },
  {
    group: 'helpers',
    id: 'colormix',
    label: { en: 'Nonlinear color mix', de: 'Nichtlineare Farbmischung' },
    name: 'colormix',
    code: `// mixes in "linear light" instead of sRGB — avoids the muddy grey mix() gives
vec3 colormix(vec3 a, vec3 b, float t) {
  return sqrt((1.0 - t) * pow(a, vec3(2.0)) + t * pow(b, vec3(2.0)));
}
`,
  },
  {
    group: 'noise',
    id: 'hash',
    label: { en: 'Hash (pseudo-random)', de: 'Hash (Pseudo-Zufall)' },
    name: 'hash',
    code: `float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
`,
  },
  {
    group: 'noise',
    id: 'noise',
    label: { en: 'Value noise', de: 'Value Noise' },
    name: 'noise',
    code: `float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f); // smoothstep-like easing

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
`,
  },
  {
    group: 'noise',
    id: 'fbm',
    label: { en: 'fBm (fractal noise)', de: 'fBm (fraktales Rauschen)' },
    name: 'fbm',
    code: `// layers several octaves of noise() on top of each other - assumes
// hash() and noise() already exist.
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
`,
  },
  {
    group: 'noise',
    id: 'noiseTexture',
    label: { en: 'Texture a surface with fbm', de: 'Oberfläche mit fbm texturieren' },
    code: `float n = fbm(pos.xz * 6.0 + pos.y * 3.0); // sample at the hit position, not screen uv - sticks to the surface
vec3 surfaceColor = mix(colorA, colorB, n);
`,
  },
  {
    group: 'raymarch',
    id: 'shade',
    label: { en: 'Light a raymarched hit', de: 'Raymarch-Treffer beleuchten' },
    name: 'shade',
    code: `// bundles casting the ray + normal + diffuse lighting into one call.
// assumes castRay() and calcNormal() (and a scene() SDF) already exist.
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
`,
  },
  {
    group: 'raymarch',
    id: 'shadeAA',
    label: { en: 'Antialiasing (supersample)', de: 'Antialiasing (Supersampling)' },
    name: 'shadeAA',
    code: `// shades a small grid of sub-pixel rays and averages them - a raymarched
// edge doesn't get free MSAA like triangle rasterization does. Assumes
// shade() and getCameraRayDir() already exist, and resolution is in scope.
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
`,
  },
];

function hasFunction(doc, name) {
  return new RegExp(`\\b(?:float|int|vec[234]|mat[234]|void)\\s+${name}\\s*\\(`).test(doc);
}

/**
 * Works out the edit that inserts `snippet` into `doc`.
 * Returns `{ from, insert }`, or `{ skipped: true }` when a function snippet is
 * already defined in the document.
 */
export function planInsert(doc, cursor, snippet) {
  if (!snippet.name) {
    return { from: cursor, insert: snippet.code };
  }
  if (hasFunction(doc, snippet.name)) {
    return { skipped: true };
  }
  const main = /^[ \t]*void\s+main\s*\(/m.exec(doc);
  if (!main) {
    return { from: cursor, insert: snippet.code };
  }
  return { from: main.index, insert: `${snippet.code}\n` };
}
