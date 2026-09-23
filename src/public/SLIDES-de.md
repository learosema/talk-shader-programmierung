# Creative Coding with WebGL

<svg width="100%" height="220" viewBox="0 0 800 240" xmlns="http://www.w3.org/2000/svg" style="max-width: 520px; margin-top: 0.5rem;">
  <g transform="translate(580,0) scale(2.2)" stroke="#e8c99b" stroke-width="0.8" fill="none" opacity="0.6">
    <path d="M 100.0,0.0 L 0.0,0.0"/>
    <path d="M 100.0,0.0 L 0.0,33.3"/>
    <path d="M 100.0,0.0 L 0.0,100.0"/>
    <path d="M 100.0,0.0 L 66.7,100.0"/>
    <path d="M 100.0,0.0 L 100.0,100.0"/>
    <path d="M 65.0,0.0 L 65.0,11.7 L 65.0,35.0 L 88.3,35.0 L 100.0,35.0"/>
    <path d="M 35.0,0.0 L 35.0,21.7 L 35.0,65.0 L 78.3,65.0 L 100.0,65.0"/>
    <path d="M 0.0,0.0 L 0.0,33.3 L 0.0,100.0 L 66.7,100.0 L 100.0,100.0"/>
  </g>
  <line x1="640" y1="55" x2="640" y2="170" stroke="#e8c99b" stroke-width="1.2" opacity="0.6"/>
  <g transform="translate(618,160) scale(1.1)" stroke="#d8d8d8" stroke-width="2" fill="none">
    <ellipse cx="30" cy="22" rx="8" ry="10" fill="#d8d8d8" stroke="none"/>
    <circle cx="30" cy="10" r="5" fill="#d8d8d8" stroke="none"/>
    <path d="M22 15 L5 8 M22 20 L2 20 M22 25 L5 32 M22 28 L8 38"/>
    <path d="M38 15 L55 8 M38 20 L58 20 M38 25 L55 32 M38 28 L52 38"/>
  </g>
  <g transform="translate(130,60) scale(0.8)" fill="#ff9f1c">
    <path d="M 2,-2 C 20,-15 35,-25 55,-18 C 45,-15 40,-8 48,-2 C 60,5 75,10 85,25 C 65,15 45,18 30,20 C 20,22 10,15 6,18 Z"/>
    <path d="M -2,-2 C -20,-15 -35,-25 -55,-18 C -45,-15 -40,-8 -48,-2 C -60,5 -75,10 -85,25 C -65,15 -45,18 -30,20 C -20,22 -10,15 -6,18 Z"/>
    <ellipse cx="0" cy="5" rx="6" ry="10"/>
    <path d="M -4,-6 L -7,-18 L -1,-8 Z"/>
    <path d="M 4,-6 L 7,-18 L 1,-8 Z"/>
  </g>
  <g transform="translate(120,60) scale(1.6)">
    <path d="M50 5 C25 5 10 25 10 50 L10 100 L22 88 L34 100 L50 88 L66 100 L78 88 L90 100 L90 50 C90 25 75 5 50 5 Z" fill="#f5f0e6"/>
    <circle cx="35" cy="45" r="5" fill="#191919"/>
    <circle cx="65" cy="45" r="5" fill="#191919"/>
    <path d="M38 62 Q50 70 62 62" stroke="#191919" stroke-width="3" fill="none" stroke-linecap="round"/>
  </g>
</svg>

---

# Creative Coding with WebGL

## Hi! Ich bin Lea Rosema

Senior Software Engineer

adesso

---

# Heute Abend: 🎃

Wir schnitzen einen Kürbis — nicht mit dem Messer, sondern mit einem **Signed Distance Field**.

---

# Agenda

- Kurze Wiederholung: Shader-Grundlagen
- Fragment-Shader „Hello World"
- Einfacher Einstieg: `length(p)`
- `step()` drumherumbauen
- Auftritt: Signed Distance Fields
- Formen kombinieren
- Unser Kreis bekommt ein Gesicht
- Dieselbe Idee in 3D
- Raymarching
- 🎃 Fertig!

---

# Was ist eigentlich ein Shader?

Eine winzige Funktion...

- ...die **massiv parallel** läuft — tausende Male gleichzeitig
- ...einmal pro Pixel
- ...und eine **Farbe** zurückgibt

Das komplette Mental Model für heute Abend.

---

## [tixy.land](https://tixy.land)

Dasselbe Mental Model, eine Zeile: `t => ...` pro Pixel, live im Browser.

---

# Die Render-Pipeline

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

Fünf Stationen, links nach rechts — die GPU führt die mittleren drei parallel aus, pro Vertex und Pixel.

---

# Die Render-Pipeline (kurze Wiederholung)

1. **Vertices** kommen rein → der **Vertex-Shader** platziert sie
2. Die GPU rasterisiert das Dreieck in Pixel („Fragmente")
3. Der **Fragment-Shader** läuft einmal pro Pixel → gibt eine Farbe aus

Heute Abend leben wir fast ausschließlich in Schritt 3.

---

# Fragment-Shader „Hello World"

```glsl
#version 300 es
precision highp float;

out vec4 fragColor;

void main() {
  fragColor = vec4(1.0, 0.5, 0.0, 1.0);
}
```

- läuft für jeden Pixel auf dem Bildschirm
- jeder Pixel wird im selben flachen Orange gemalt
- `uniform`s reichen Werte aus JS rein — zum Beispiel Auflösung oder Zeit

Langweilig — machen wir's abhängig davon, *wo* der Pixel ist.

---

# Einfacher Einstieg: `length(p)`

```glsl
float d = length(vPos.xy);
fragColor = vec4(vec3(d), 1.0);
```

- `vUv`: Texturkoordinate
- `vPos`: Vertex-Position
- `length(vPos.xy)`: Abstand vom Zentrum
- je weiter außen, desto heller → ein radialer Verlauf

Für jeden Pixel einen Abstand berechnet — merk dir den Gedanken.

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
- eine harte Kante, kein Übergang dazwischen

---

# `step()` drumherumbauen

```glsl
float d = length(vPos.xy) - 0.3;
vec3 color = vec3(step(0.0, d));
fragColor = vec4(color, 1.0);
```

- `step(0.0, d)`: `1.0` (weiß) wenn `d >= 0`, `0.0` (schwarz) wenn `d < 0`
- eine harte Kante genau dort, wo der Verlauf durch null geht

---

# Andere Farben

```glsl
vec3 color = vec3(1.0, 0.5, 0.0) * step(0.0, d);
```

- mit einer Farbe multiplizieren — 0 bleibt schwarz, 1 wird die Farbe
- oder `mix(colorA, colorB, step(0.0, d))`: zwischen zwei Farben interpolieren

---

# Nichtlineare Farbmischung

```glsl
vec3 colormix(vec3 a, vec3 b, float t) {
  return sqrt((1.0 - t) * pow(a, vec3(2.0)) + t * pow(b, vec3(2.0)));
}
```

- `mix()` interpoliert linear und läuft oft durch ein muffiges Grau
- `colormix()` mischt in „linearem Licht" statt sRGB — wirkt natürlicher
- als Snippet im Shader Lab (`src/demo`) fertig zum Einfügen

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

- vor `edge0` → `0.0`, nach `edge1` → `1.0`
- dazwischen: weicher S-Kurven-Übergang
- perfekt, um harte SDF-Kanten weichzuzeichnen

## 🎃 Live-Coding: einen Kreis zeichnen, dann die Kante mit `smoothstep` weichzeichnen

---

# Auftritt: Signed Distance Fields

Das haben wir gerade aus Versehen geschrieben.

**Signed Distance Field**: Abstand von Punkt `p` zum Rand einer Form:

- `d < 0` → Punkt liegt **innerhalb** der Form
- `d > 0` → **außerhalb**
- `d == 0` → genau **auf dem Rand**

```glsl
float sdCircle(vec2 p, float r) {
  return length(p) - r;
}
```

Kürzer geht's kaum 🙂

---

# Mehr Formen: einfach Inigo Quilez fragen

- [2D SDFs](https://iquilezles.org/articles/distfunctions2d/)
- [3D SDFs](https://iquilezles.org/articles/distfunctions/)
- [YouTube: @InigoQuilez](https://www.youtube.com/c/InigoQuilez)

---

# Formen kombinieren

SDFs kombinieren wie boolesche Operationen — heute Abend fünf Moves:

**combine · merge · split · deform · round**

---

# Combine (Union)

```glsl
// die kleinere (= näher liegende) Distanz gewinnt
float add(float a, float b) {
  return min(a, b);
}
```

Zwei Formen werden eins. Simples `min()`.

---

# Merge (Smooth Union)

```glsl
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}
```

Wie `add`, aber die Naht **verschmilzt** statt harter Kante — super für organische Kürbis-Rillen.

---

# Split (Subtraktion)

```glsl
// schneidet b aus a heraus
float sub(float a, float b) {
  return max(-b, a);
}
```

Schneidet ein Loch — so schnitzen wir Augen, Mund, alles Hohle.

---

# Deform

```glsl
float d = sdCircle(p, r);
d += sin(p.y * 10.0) * 0.02; // ein bisschen Wabern
return d;
```

Distanz (oder Punkt) mit etwas Mathematik stören — `sin()`, Noise, irgendwas. Macht aus perfekter Form etwas Handgeschnitztes.

---

# Round

```glsl
float d = sdBox(p, size) - 0.05;
```

Quasi umsonst: Konstante von *jedem* SDF abziehen → Ecken werden runder, um genau den Betrag.

---

# Zurück zum Kreis: Augen 👀

```glsl
float face(vec2 p) {
  float d = sdCircle(p, 0.5);
  d = sub(sdCircle(p - vec2(-0.18, 0.1), 0.08), d);
  d = sub(sdCircle(p - vec2( 0.18, 0.1), 0.08), d);
  return d;
}
```

Zwei subtrahierte Kreise. Der Kürbis kann jetzt sehen.

---

# ...und ein Mund

```glsl
float mouth(vec2 p) {
  p -= vec2(0.0, -0.15);
  float d = sdBox(p, vec2(0.22, 0.05));
  d += sin(p.x * 40.0) * 0.015; // gezackte Zähne, per deform
  return d;
}

// aus dem Gesicht von der letzten Folie herausschneiden
d = sub(mouth(p), d);
```

Wie `deform`, diesmal bewusst: `sin()` macht aus gerader Box ein gezacktes Grinsen.

## 🎃 Live-Coding: das Gesicht zusammensetzen

---

## [SDF Modeler von Sascha Rode](https://sascha-rode.itch.io/sdf-modeler)

SDFs visuell sculpten, statt jede Formel im Kopf zu simulieren — bevor wir gleich in 3D weitermachen.

---

# Dieselbe Idee funktioniert auch in 3D

`sdCircle` wird zu `sdSphere` — eine Dimension mehr, dieselbe Formel:

```glsl
float sdSphere(vec3 p, float r) {
  return length(p) - r;
}
```

Aber es gibt einen Haken...

---

# Der Haken: keine 1:1-Zuordnung mehr von Pixel zu Punkt

- 2D: jeder Pixel *war* ein Punkt — direkt ins SDF
- 3D: jeder Pixel ist ein **Strahl** in die Szene
- offene Frage: *wo* entlang des Strahls das SDF auswerten?

---

# Raymarching

Entlang des Strahls vortasten: SDF-Distanz als **sichere Schrittweite**, garantierter Abstand zur nächsten Oberfläche:

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

- `d` nahe 0 → Treffer
- zu weit, nichts getroffen → da ist nichts

---

# Ein Kamera-Strahl pro Pixel

```glsl
vec3 getCameraRayDir(vec2 uv, vec3 camPos, vec3 camTarget) {
  vec3 camForward = normalize(camTarget - camPos);
  vec3 camRight = normalize(cross(camForward, vec3(0.0, 1.0, 0.0)));
  vec3 camUp = normalize(cross(camRight, camForward));
  return normalize(uv.x * camRight + uv.y * camUp + camForward * 2.0);
}
```

Wieder `vPos.xy`, hier als Parameter `uv` — steuert jetzt eine Strahlrichtung statt einer Farbe.

---

# Einen Kürbis aushöhlen, in 3D

Dieselben `add`/`sub`-Kombinatoren wie in 2D — nur jetzt mit Kugeln:

```glsl
float pumpkin(vec3 p) {
  float shell = sdSphere(p, 3.0);
  shell = sub(sdSphere(p, 2.9), shell);            // aushöhlen
  shell = sub(sdSphere(p - eyeLeft, 0.7), shell);  // ein Auge schnitzen
  shell = sub(sdSphere(p - eyeRight, 0.7), shell); // ein Auge schnitzen
  shell = sub(mouth, shell);                       // den Mund schnitzen
  return shell;
}
```

Subtraktion entfernt Material — wie ein Loch in 2D, nur im 3D-Raum.

---

# Shading: Oberflächennormalen

Für den Look eines festen Objekts: Licht, und dafür eine Oberflächennormale:

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

SDF an jeder Achse leicht versetzt abtasten → steilste Änderung *ist* die Normale, gefüttert in einfaches diffuses Licht.

---

# 🎃 DEMO: Spooky Raymarch Pumpkin Armada

## [DEMO](https://codepen.io/learosema/pen/MWeYvPv)

- ein unendliches Feld ausgehöhlter Kürbisse, alle aus Kugeln via `add`/`sub` gebaut
- animierte Augen, wabernder Mund, dezente Deform für den handgeschnitzten Look
- eine volle Raymarching-Kamera, die um die Szene kreist + ein passender Chiptune-Soundtrack

---

# Wo geht's von hier aus weiter

- <https://iquilezles.org/articles/> — mehr Primitive, mehr Operationen, das tiefe Ende
- <https://thebookofshaders.com/> — ein sanfterer, geführter Weg durch das alles
- der **Shader Lab** aus diesem Repo (`src/demo`) — dieselben Bausteine von heute Abend, live editierbar

---

# 🎃 Fertig!

## Feedback und Fragen

- sprich mich danach einfach an 🙂
- schreib mir auf Mastodon (`@lea@lea.lgbt`)
- oder erstell ein Issue in meinem Repo
