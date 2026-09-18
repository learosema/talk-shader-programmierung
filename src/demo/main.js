import { EditorView, basicSetup } from 'codemirror';
import { keymap } from '@codemirror/view';
import { cpp } from '@codemirror/lang-cpp';
import { oneDark } from '@codemirror/theme-one-dark';
// shader-art is intentionally loaded from a CDN instead of npm: its package.json
// lists semantic-release & @semantic-release/npm as regular `dependencies` (not
// devDependencies), which drags ~580 extra packages incl. 33 vulnerabilities into
// node_modules. The CDN build only serves the compiled bundle, sidestepping that
// tree entirely. See shader-art-wishlist.md.
import { ShaderArt } from 'https://esm.sh/shader-art@1.3.0';
import { presets } from './presets.js';

const STORAGE_KEY = 'shader-lab:code';

const shaderEl = document.getElementById('shader');
const fragScript = document.getElementById('frag-source');
const errorEl = document.getElementById('error');
const presetSelect = document.getElementById('preset');
const playPauseBtn = document.getElementById('play-pause');
const resetTimeBtn = document.getElementById('reset-time');

const savedCode = window.localStorage.getItem(STORAGE_KEY);
const matchedPreset = presets.find((preset) => preset.code === savedCode);
const initialCode = savedCode || presets[0].code;

// The frag script needs real GLSL ES 3.00 source *before* the element upgrades,
// otherwise shader-art falls back to its default (WebGL1) shader on first connect
// and locks into a WebGL1 context that a later reinitialize() with #version 300 es
// source can't recover from. See shader-art-wishlist.md.
fragScript.textContent = initialCode;
ShaderArt.register();

// Workaround for a shader-art bug: it only sizes its canvas once (right after
// setup) and on window "resize" events, with no ResizeObserver. If the host
// element's layout isn't settled yet at that first call, the canvas gets stuck
// at a stale/zero size and never recovers. ResizeObserver also fires once
// immediately on observe(), which covers the initial-load race too.
// See shader-art-wishlist.md.
new ResizeObserver(() => shaderEl.onResize()).observe(shaderEl);

for (const preset of presets) {
  const option = document.createElement('option');
  option.value = preset.id;
  option.textContent = preset.label;
  presetSelect.appendChild(option);
}

if (savedCode && !matchedPreset) {
  const customOption = document.createElement('option');
  customOption.value = '__custom__';
  customOption.textContent = '✏️ Eigener Code';
  presetSelect.prepend(customOption);
  presetSelect.value = '__custom__';
} else {
  presetSelect.value = matchedPreset ? matchedPreset.id : presets[0].id;
}

let compileTimer = null;

function compile(code) {
  fragScript.textContent = code;
  try {
    shaderEl.reinitialize();
    errorEl.hidden = true;
    errorEl.textContent = '';
  } catch (err) {
    errorEl.hidden = false;
    errorEl.textContent = String(err);
  }
}

function scheduleCompile(code) {
  window.localStorage.setItem(STORAGE_KEY, code);
  clearTimeout(compileTimer);
  compileTimer = setTimeout(() => compile(code), 400);
}

function runNow(view) {
  clearTimeout(compileTimer);
  const code = view.state.doc.toString();
  window.localStorage.setItem(STORAGE_KEY, code);
  compile(code);
  return true;
}

const editor = new EditorView({
  doc: initialCode,
  parent: document.getElementById('editor'),
  extensions: [
    basicSetup,
    cpp(),
    oneDark,
    keymap.of([{ key: 'Mod-Enter', run: runNow }]),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        scheduleCompile(update.state.doc.toString());
      }
    }),
  ],
});

function setEditorContent(code) {
  editor.dispatch({
    changes: { from: 0, to: editor.state.doc.length, insert: code },
  });
}

presetSelect.addEventListener('change', () => {
  const preset = presets.find((p) => p.id === presetSelect.value);
  if (!preset) return;
  setEditorContent(preset.code);
  clearTimeout(compileTimer);
  compile(preset.code);
  window.localStorage.setItem(STORAGE_KEY, preset.code);
  presetSelect.querySelector('option[value="__custom__"]')?.remove();
});

playPauseBtn.addEventListener('click', () => {
  const running = shaderEl.playState !== 'stopped';
  shaderEl.playState = running ? 'stopped' : 'running';
  playPauseBtn.textContent = running ? '▶' : '⏸';
  playPauseBtn.title = running ? 'Weiter' : 'Pause';
});

resetTimeBtn.addEventListener('click', () => {
  // Removing + re-inserting forces shader-art through dispose()/setup(), which is
  // the only way to reset its internal elapsed-time stopwatch to zero.
  const parent = shaderEl.parentNode;
  const next = shaderEl.nextSibling;
  parent.removeChild(shaderEl);
  parent.insertBefore(shaderEl, next);
  playPauseBtn.textContent = '⏸';
  playPauseBtn.title = 'Pause';
});
