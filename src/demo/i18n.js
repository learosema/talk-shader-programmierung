// UI strings for the shader lab. Language is picked via ?lang=de|en (default: de),
// the same convention as the slides. Labels of presets and snippets carry their own
// { de, en } objects; use localize() on those.

const messages = {
  de: {
    pause: 'Pause',
    resume: 'Weiter',
    resetTime: 'Zeit zurücksetzen',
    customCode: '✏️ Eigener Code',
    snippetPlaceholder: '＋ Snippet …',
    snippetLabel: 'Snippet einfügen',
    snippetExists: '{name}() ist bereits im Code definiert.',

    tabFragment: 'Fragment',
    tabVertex: 'Vertex',

    varsButton: 'Variablen',
    varsTitle: 'Vordefinierte Variablen',
    varsVertHeading: 'Vertex-Shader (Eingaben)',
    varsPosition: 'Eckpunkt der Vollbild-Geometrie im Clip Space, Bereich −1…1.',
    varsUv: 'Flächenkoordinate der Geometrie, Bereich 0…1.',
    varsVaryingHeading: 'Vertex → Fragment (Varyings)',
    varsVUv: '„uv“ vom Vertex-Shader weitergereicht. Im Fragment-Shader mit „in vec2 vUv;“ deklarieren, um sie zu nutzen.',
    varsVPos: '„position“ vom Vertex-Shader weitergereicht. Im Fragment-Shader mit „in vec4 vPos;“ deklarieren, um sie zu nutzen.',
    varsVaryingHint: 'Kommen im Fragment-Shader nur an, wenn dort eine gleichnamige „in“-Variable deklariert ist.',
    varsFragHeading: 'Fragment-Shader',
    varsResolution: 'Canvas-Größe in Pixeln.',
    varsTime: 'Vergangene Zeit in Sekunden seit Start/Reset.',
    varsFragCoord: 'Pixelkoordinate des aktuellen Fragments (Bildschirmraum).',
    varsFragColor: 'Ausgabefarbe des Fragments (RGBA).',

    varsOrbitHeading: 'Orbit-Controls (optional)',
    varsCameraPos: 'Kameraposition in Weltkoordinaten, per Maus/Touch steuerbar. Ziehen dreht die Kamera um den Ursprung, Mausrad zoomt.',
    varsOrbitHint: 'Wird nur gefüllt, wenn der Fragment-Shader „uniform vec3 cameraPos;“ deklariert - siehe Preset „Raymarching: Kugel“.',

    codepenTitle: 'Als CodePen öffnen (kein GitHub-Token nötig)',

    openTitle: 'Shader-Datei öffnen (.frag/.vert/.glsl/.vs/.fs)',
    downloadTitle: 'Fragment- und Vertex-Shader herunterladen',
    close: 'Schließen',
    openFailed: 'Datei konnte nicht geöffnet werden: {error}',
    downloadFailed: 'Download fehlgeschlagen: {error}',
  },
  en: {
    pause: 'Pause',
    resume: 'Resume',
    resetTime: 'Reset time',
    customCode: '✏️ Custom code',
    snippetPlaceholder: '＋ Snippet …',
    snippetLabel: 'Insert snippet',
    snippetExists: '{name}() is already defined in the code.',

    tabFragment: 'Fragment',
    tabVertex: 'Vertex',

    varsButton: 'Variables',
    varsTitle: 'Predefined variables',
    varsVertHeading: 'Vertex shader (inputs)',
    varsPosition: 'Vertex of the fullscreen geometry in clip space, range −1…1.',
    varsUv: 'Surface coordinate of the geometry, range 0…1.',
    varsVaryingHeading: 'Vertex → fragment (varyings)',
    varsVUv: '"uv" passed on from the vertex shader. Declare it in the fragment shader with "in vec2 vUv;" to use it.',
    varsVPos: '"position" passed on from the vertex shader. Declare it in the fragment shader with "in vec4 vPos;" to use it.',
    varsVaryingHint: 'Only reach the fragment shader if it declares a matching "in" variable there.',
    varsFragHeading: 'Fragment shader',
    varsResolution: 'Canvas size in pixels.',
    varsTime: 'Elapsed time in seconds since start/reset.',
    varsFragCoord: 'Pixel coordinate of the current fragment (screen space).',
    varsFragColor: 'Output color of the fragment (RGBA).',

    varsOrbitHeading: 'Orbit controls (optional)',
    varsCameraPos: 'Camera position in world space, driven by mouse/touch. Drag to orbit around the origin, wheel to zoom.',
    varsOrbitHint: 'Only filled in if the fragment shader declares "uniform vec3 cameraPos;" - see the "Raymarching: sphere" preset.',

    codepenTitle: 'Open as a CodePen (no GitHub token needed)',

    openTitle: 'Open a shader file (.frag/.vert/.glsl/.vs/.fs)',
    downloadTitle: 'Download the fragment and vertex shader',
    close: 'Close',
    openFailed: 'Could not open file: {error}',
    downloadFailed: 'Download failed: {error}',
  },
};

export const lang = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'de';

/** Looks up a UI string and fills `{placeholders}` from `params`. */
export function t(key, params = {}) {
  return messages[lang][key].replace(/\{(\w+)\}/g, (_, name) => params[name]);
}

/** Picks the current language from a `{ de, en }` label (plain strings pass through). */
export function localize(label) {
  return typeof label === 'string' ? label : label[lang];
}

/**
 * Fills static markup from data attributes:
 * data-i18n (text), data-i18n-title, data-i18n-placeholder, data-i18n-aria-label.
 */
export function applyTranslations(root = document) {
  document.documentElement.lang = lang;
  for (const el of root.querySelectorAll('[data-i18n]')) {
    el.textContent = t(el.dataset.i18n);
  }
  for (const attr of ['title', 'placeholder', 'aria-label']) {
    const dataKey = `data-i18n-${attr}`;
    for (const el of root.querySelectorAll(`[${dataKey}]`)) {
      el.setAttribute(attr, t(el.getAttribute(dataKey)));
    }
  }
}
