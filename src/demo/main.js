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
import { snippets, snippetGroups, planInsert } from './snippets.js';
import { openShaderFile, downloadShaderFiles } from './files.js';
import { openInCodePen } from './codepen.js';
import { createOrbitControlsPlugin } from './orbit-controls-plugin.js';
import { lang, t, localize, applyTranslations } from './i18n.js';

const STORAGE_KEY = 'shader-lab:code';
const VERT_STORAGE_KEY = 'shader-lab:vert-code';

// Default vertex shader: a fullscreen quad in clip space, with a uv attribute and
// both handed on to the fragment shader as varyings (vUv/vPos) for anyone who wants
// them - the fragment shader only receives them if it declares a matching `in`.
const DEFAULT_VERT = `#version 300 es
precision highp float;

in vec4 position;
in vec2 uv;

out vec2 vUv;
out vec4 vPos;

void main() {
  vUv = uv;
  vPos = position;
  gl_Position = position;
}
`;

const shaderEl = document.getElementById('shader');
const fragScript = document.getElementById('frag-source');
const vertScript = document.getElementById('vert-source');
const editorTabs = document.querySelectorAll('.editor-tabs .tab');
const errorEl = document.getElementById('error');
const presetSelect = document.getElementById('preset');
const playPauseBtn = document.getElementById('play-pause');
const resetTimeBtn = document.getElementById('reset-time');
const snippetSelect = document.getElementById('snippets');
const fileOpenBtn = document.getElementById('file-open');
const fileDownloadBtn = document.getElementById('file-download');
const codepenOpenBtn = document.getElementById('codepen-open');

applyTranslations();
document.title = 'Shader Lab';
document.querySelectorAll('.lang-switch a').forEach((a) => {
  a.classList.toggle('active', a.dataset.lang === lang);
});

const savedCode = window.localStorage.getItem(STORAGE_KEY);
const matchedPreset = presets.find((preset) => preset.code === savedCode);
const initialCode = savedCode || presets[0].code;

// Current source per editor tab. Both the frag and the vert script need real GLSL
// ES 3.00 source *before* the element upgrades, otherwise shader-art falls back to
// its default (WebGL1) shader on first connect and locks into a WebGL1 context that
// a later reinitialize() with #version 300 es source can't recover from. See
// shader-art-wishlist.md.
const source = {
  frag: initialCode,
  vert: window.localStorage.getItem(VERT_STORAGE_KEY) || DEFAULT_VERT,
};
let activeTarget = 'frag';

fragScript.textContent = source.frag;
vertScript.textContent = source.vert;
// Registered globally, but a no-op for any shader that doesn't declare
// `uniform vec3 cameraPos;` - the plugin just no-ops when the uniform's location
// isn't found. See orbit-controls-plugin.js.
ShaderArt.register([createOrbitControlsPlugin()]);

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
  option.textContent = localize(preset.label);
  presetSelect.appendChild(option);
}

function showCustomOption() {
  if (!presetSelect.querySelector('option[value="__custom__"]')) {
    const customOption = document.createElement('option');
    customOption.value = '__custom__';
    customOption.textContent = t('customCode');
    presetSelect.prepend(customOption);
  }
  presetSelect.value = '__custom__';
}

if (savedCode && !matchedPreset) {
  showCustomOption();
} else {
  presetSelect.value = matchedPreset ? matchedPreset.id : presets[0].id;
}

let compileTimer = null;

const storageKeyFor = (target) => (target === 'frag' ? STORAGE_KEY : VERT_STORAGE_KEY);

function compile() {
  fragScript.textContent = source.frag;
  vertScript.textContent = source.vert;
  try {
    shaderEl.reinitialize();
    errorEl.hidden = true;
    errorEl.textContent = '';
  } catch (err) {
    errorEl.hidden = false;
    errorEl.textContent = String(err);
  }
}

function scheduleCompile() {
  clearTimeout(compileTimer);
  compileTimer = setTimeout(compile, 400);
}

function runNow(view) {
  clearTimeout(compileTimer);
  const code = view.state.doc.toString();
  source[activeTarget] = code;
  window.localStorage.setItem(storageKeyFor(activeTarget), code);
  compile();
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
        const code = update.state.doc.toString();
        source[activeTarget] = code;
        window.localStorage.setItem(storageKeyFor(activeTarget), code);
        scheduleCompile();
      }
    }),
  ],
});

function setEditorContent(code) {
  editor.dispatch({
    changes: { from: 0, to: editor.state.doc.length, insert: code },
  });
}

// Switches the tab's active/aria-selected state without touching editor content -
// shared by the tab buttons and by preset/file loading (which always jump to frag).
function activateTab(target) {
  activeTarget = target;
  for (const tab of editorTabs) {
    const isActive = tab.dataset.target === target;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  }
}

for (const tab of editorTabs) {
  tab.addEventListener('click', () => {
    if (tab.dataset.target === activeTarget) return;
    activateTab(tab.dataset.target);
    setEditorContent(source[activeTarget]);
    clearTimeout(compileTimer);
    compile();
    editor.focus();
  });
}

presetSelect.addEventListener('change', () => {
  const preset = presets.find((p) => p.id === presetSelect.value);
  if (!preset) return;
  source.frag = preset.code;
  window.localStorage.setItem(STORAGE_KEY, preset.code);
  activateTab('frag');
  setEditorContent(preset.code);
  clearTimeout(compileTimer);
  compile();
  presetSelect.querySelector('option[value="__custom__"]')?.remove();
});

playPauseBtn.addEventListener('click', () => {
  const running = shaderEl.playState !== 'stopped';
  shaderEl.playState = running ? 'stopped' : 'running';
  playPauseBtn.textContent = running ? '▶' : '⏸';
  playPauseBtn.title = t(running ? 'resume' : 'pause');
});

resetTimeBtn.addEventListener('click', () => {
  // Removing + re-inserting forces shader-art through dispose()/setup(), which is
  // the only way to reset its internal elapsed-time stopwatch to zero.
  const parent = shaderEl.parentNode;
  const next = shaderEl.nextSibling;
  parent.removeChild(shaderEl);
  parent.insertBefore(shaderEl, next);
  playPauseBtn.textContent = '⏸';
  playPauseBtn.title = t('pause');
});

// --- Snippets -------------------------------------------------------------

const snippetPlaceholder = document.createElement('option');
snippetPlaceholder.value = '';
snippetPlaceholder.textContent = t('snippetPlaceholder');
snippetSelect.appendChild(snippetPlaceholder);

let snippetGroup = null;
let snippetOptGroup = null;
for (const snippet of snippets) {
  if (snippet.group !== snippetGroup) {
    snippetGroup = snippet.group;
    snippetOptGroup = document.createElement('optgroup');
    snippetOptGroup.label = localize(snippetGroups[snippetGroup]);
    snippetSelect.appendChild(snippetOptGroup);
  }
  const option = document.createElement('option');
  option.value = snippet.id;
  option.textContent = localize(snippet.label);
  snippetOptGroup.appendChild(option);
}

snippetSelect.addEventListener('change', () => {
  const snippet = snippets.find((s) => s.id === snippetSelect.value);
  snippetSelect.value = '';
  if (!snippet) return;

  const doc = editor.state.doc.toString();
  const plan = planInsert(doc, editor.state.selection.main.head, snippet);
  if (plan.skipped) {
    errorEl.hidden = false;
    errorEl.textContent = t('snippetExists', { name: snippet.name });
    return;
  }
  editor.dispatch({
    changes: { from: plan.from, insert: plan.insert },
    selection: { anchor: plan.from + plan.insert.length },
    scrollIntoView: true,
  });
  editor.focus();
});

// --- Local file open/download ------------------------------------------------

// A loaded fragment shader replaces the active preset (or falls back to "custom
// code") the same way typing in the editor does; a vertex shader has no presets
// to match against, so it just lands in its own tab.
function loadFragCode(code) {
  source.frag = code;
  window.localStorage.setItem(STORAGE_KEY, code);
  activateTab('frag');
  setEditorContent(code);
  clearTimeout(compileTimer);
  compile();

  const preset = presets.find((p) => p.code === code);
  presetSelect.querySelector('option[value="__custom__"]')?.remove();
  if (preset) {
    presetSelect.value = preset.id;
  } else {
    showCustomOption();
  }
}

function loadVertCode(code) {
  source.vert = code;
  window.localStorage.setItem(VERT_STORAGE_KEY, code);
  activateTab('vert');
  setEditorContent(code);
  clearTimeout(compileTimer);
  compile();
}

fileOpenBtn.addEventListener('click', async () => {
  try {
    const { target, code } = await openShaderFile();
    if (target === 'vert') {
      loadVertCode(code);
    } else {
      loadFragCode(code);
    }
  } catch (err) {
    if (err?.name === 'AbortError') return; // user cancelled the picker
    errorEl.hidden = false;
    errorEl.textContent = t('openFailed', { error: String(err?.message ?? err) });
  }
});

fileDownloadBtn.addEventListener('click', async () => {
  const preset = presets.find((p) => p.id === presetSelect.value);
  try {
    await downloadShaderFiles({ frag: source.frag, vert: source.vert, baseName: preset?.id ?? 'shader' });
  } catch (err) {
    if (err?.name === 'AbortError') return; // user cancelled the folder picker
    errorEl.hidden = false;
    errorEl.textContent = t('downloadFailed', { error: String(err?.message ?? err) });
  }
});

// --- CodePen export -----------------------------------------------------------

codepenOpenBtn.addEventListener('click', () => {
  const preset = presets.find((p) => p.id === presetSelect.value);
  openInCodePen({
    frag: source.frag,
    vert: source.vert,
    title: preset ? localize(preset.label) : undefined,
  });
});
