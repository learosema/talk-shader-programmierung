# Creative Coding with WebGL

---

# Creative Coding with WebGL

## Hi! Ich bin Lea Rosema

Senior Software Engineer

adesso

---

# Heute Abend: 🎃

Wir schnitzen einen Kürbis.

Nicht mit dem Messer — sondern mit einem **Signed Distance Field**.

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

Das ist es. Das ist das komplette Mental Model für heute Abend.

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

Fünf Stationen, von links nach rechts — die GPU führt die mittleren drei für jeden Vertex und jeden Pixel aus, alles parallel.

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

Langweilig. Lass uns das davon abhängig machen, *wo* der Pixel ist.

---

# Einfacher Einstieg: `length(p)`

```glsl
vec2 uv = (gl_FragCoord.xy - 0.5 * resolution) / min(resolution.x, resolution.y);
float d = length(uv);
fragColor = vec4(vec3(d), 1.0);
```

- `uv`: Pixel-Koordinaten, neu zentriert, sodass `(0, 0)` die Bildschirmmitte ist
- `length(uv)`: Abstand vom Zentrum
- je weiter außen, desto heller → ein radialer Verlauf

Wir haben gerade für jeden Pixel einen Abstand berechnet. Merk dir den Gedanken.

---

# `step()` drumherumbauen

```glsl
float d = length(uv) - 0.3;
vec3 color = vec3(step(0.0, d));
fragColor = vec4(color, 1.0);
```

- `step(0.0, d)`: `1.0` (weiß) wenn `d >= 0`, `0.0` (schwarz) wenn `d < 0`
- eine harte Kante genau dort, wo der Verlauf durch null geht

## 🎃 Live-Coding: einen Kreis zeichnen, dann die Kante mit `smoothstep` weichzeichnen

---

# Auftritt: Signed Distance Fields

Das haben wir gerade aus Versehen geschrieben.

Ein **Signed Distance Field** gibt für jeden Punkt `p` den Abstand zum Rand einer Form zurück:

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

Wir leiten heute Abend nicht jede Form von Hand her — das hat schon jemand gemacht, und veröffentlicht:

## [iquilezles.org/articles](https://iquilezles.org/articles/)

- **2D distance functions** — Boxen, Sechsecke, Sterne, ...
- **3D SDFs** — dasselbe, eine Dimension mehr
- quasi das Referenz-Cheat-Sheet für alles, was irgendwie SDF-förmig ist

---

# Formen kombinieren

SDFs lassen sich wie boolesche Operationen auf Formen kombinieren. Heute Abend fünf Moves:

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

Dieselbe Idee wie `add`, aber die Naht zwischen den beiden Formen **verschmilzt**, statt eine harte Kante zu bilden — super für organisch aussehende Kürbis-Rillen.

---

# Split (Subtraktion)

```glsl
// schneidet b aus a heraus
float sub(float a, float b) {
  return max(-b, a);
}
```

Schneidet ein Loch. So schnitzen wir Augen, einen Mund, alles Hohle.

---

# Deform

```glsl
float d = sdCircle(p, r);
d += sin(p.y * 10.0) * 0.02; // ein bisschen Wabern
return d;
```

Die Distanz (oder den eingehenden Punkt) mit etwas zusätzlicher Mathematik stören — ein `sin()`, ein bisschen Noise, irgendwas. Macht aus einer perfekten Form etwas Handgeschnitztes.

---

# Round

```glsl
float d = sdBox(p, size) - 0.05;
```

Runden gibt's quasi umsonst: eine Konstante von *jedem* SDF abziehen, und die Ecken werden um genau diesen Betrag runder.

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

Derselbe Trick wie bei `deform`, dieses Mal ganz bewusst: ein bisschen `sin()` macht aus einer geraden Box ein gezacktes Jack-o'-Lantern-Grinsen.

## 🎃 Live-Coding: das Gesicht zusammensetzen

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

In 2D *war* jeder Pixel ein Punkt, den wir direkt ins SDF stecken konnten.

In 3D entspricht jeder Pixel einem **Strahl**, der in die Szene schießt — wir wissen noch nicht, *wo* entlang dieses Strahls wir das SDF auswerten sollen.

---

# Raymarching

Entlang des Strahls vortasten, mit der SDF-Distanz als **sichere Schrittweite** — sie ist der garantierte Abstand zur nächsten Oberfläche, in jede Richtung:

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

Nah an einer Oberfläche (`d` nahe 0) → Treffer. Zu weit gegangen, ohne etwas zu treffen → da ist nichts.

---

# Ein Kamera-Strahl pro Pixel

```glsl
vec3 getCameraRayDir(vec2 uv, vec3 camPos, vec3 camTarget) {
  vec3 camForward = normalize(camTarget - camPos);
  vec3 camRight = normalize(cross(vec3(0.0, 1.0, 0.0), camForward));
  vec3 camUp = normalize(cross(camForward, camRight));
  return normalize(uv.x * camRight + uv.y * camUp + camForward * 2.0);
}
```

Dasselbe `uv` wie zuvor — es steuert jetzt nur eine Strahlrichtung, statt direkt eine Farbe.

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

Subtraktion entfernt Material — genau wie ein Loch in 2D auszuschneiden, nur im 3D-Raum.

---

# Shading: Oberflächennormalen

Damit es wie ein festes Objekt aussieht, brauchen wir Licht — und dafür eine Oberflächennormale:

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

Das SDF an jeder Achse leicht versetzt abtasten → die Richtung der steilsten Änderung *ist* die Normale. Die füttern wir in einfaches diffuses Licht.

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
