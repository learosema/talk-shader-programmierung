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
import { importGist, exportGist } from './gist.js';
import { lang, t, localize, applyTranslations } from './i18n.js';

const STORAGE_KEY = 'shader-lab:code';
const TOKEN_KEY = 'shader-lab:gist-token';
const GIST_ID_KEY = 'shader-lab:gist-id';

const shaderEl = document.getElementById('shader');
const fragScript = document.getElementById('frag-source');
const errorEl = document.getElementById('error');
const presetSelect = document.getElementById('preset');
const playPauseBtn = document.getElementById('play-pause');
const resetTimeBtn = document.getElementById('reset-time');
const snippetSelect = document.getElementById('snippets');
const gistDialog = document.getElementById('gist-dialog');
const gistOpenBtn = document.getElementById('gist-open');
const gistImportInput = document.getElementById('gist-import-input');
const gistImportBtn = document.getElementById('gist-import');
const gistExportBtn = document.getElementById('gist-export');
const gistTokenInput = document.getElementById('gist-token');
const gistForgetTokenBtn = document.getElementById('gist-forget-token');
const gistStatus = document.getElementById('gist-status');

applyTranslations();
document.title = 'Shader Lab';
document.querySelectorAll('.lang-switch a').forEach((a) => {
  a.classList.toggle('active', a.dataset.lang === lang);
  // keep a #gist=<id> when switching language (read at click time, it changes on import/export)
  a.addEventListener('click', () => {
    a.hash = location.hash;
  });
});

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

// --- GitHub Gist import/export --------------------------------------------

const gistErrorKeys = {
  'invalid-id': 'gistInvalidId',
  'no-files': 'gistNoFiles',
  'no-token': 'gistNoToken',
};

function describeGistError(err) {
  if (gistErrorKeys[err.code]) return t(gistErrorKeys[err.code]);
  // 401 from GitHub: bad credentials or a token without the gist scope.
  return `${err.message ?? err}${err.status === 401 ? t('gistBadToken') : ''}`;
}

function showGistStatus(message, failed = false) {
  gistStatus.hidden = false;
  gistStatus.classList.toggle('failed', failed);
  gistStatus.replaceChildren(message);
}

function showGistLink(prefix, url, shareHref) {
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = url;
  const share = document.createElement('a');
  share.href = shareHref;
  share.textContent = t('gistShareLink');
  gistStatus.hidden = false;
  gistStatus.classList.remove('failed');
  gistStatus.replaceChildren(prefix, ' ', link, ' · ', share);
}

function shareUrl(id) {
  return `${location.origin}${location.pathname}${location.search}#gist=${id}`;
}

function loadCode(code) {
  setEditorContent(code);
  clearTimeout(compileTimer);
  compile(code);
  window.localStorage.setItem(STORAGE_KEY, code);

  const preset = presets.find((p) => p.code === code);
  presetSelect.querySelector('option[value="__custom__"]')?.remove();
  if (preset) {
    presetSelect.value = preset.id;
  } else {
    showCustomOption();
  }
}

async function runGistImport(idOrUrl) {
  const gist = await importGist(idOrUrl);
  loadCode(gist.code);
  window.localStorage.setItem(GIST_ID_KEY, gist.id);
  history.replaceState(null, '', `#gist=${gist.id}`);
  return gist;
}

gistTokenInput.value = window.localStorage.getItem(TOKEN_KEY) ?? '';

gistOpenBtn.addEventListener('click', () => {
  gistStatus.hidden = true;
  gistDialog.showModal();
});

gistImportBtn.addEventListener('click', async () => {
  const input = gistImportInput.value.trim();
  if (!input) return;
  showGistStatus(t('loading'));
  try {
    const gist = await runGistImport(input);
    showGistStatus(t('gistImported', { name: gist.filename }));
    gistDialog.close();
  } catch (err) {
    showGistStatus(describeGistError(err), true);
  }
});

gistExportBtn.addEventListener('click', async () => {
  const token = gistTokenInput.value.trim();
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  showGistStatus(t('saving'));
  try {
    const result = await exportGist({
      code: editor.state.doc.toString(),
      token,
      existingId: window.localStorage.getItem(GIST_ID_KEY),
    });
    window.localStorage.setItem(GIST_ID_KEY, result.id);
    history.replaceState(null, '', `#gist=${result.id}`);
    showGistLink(t(result.updated ? 'gistUpdated' : 'gistCreated'), result.url, shareUrl(result.id));
  } catch (err) {
    showGistStatus(describeGistError(err), true);
  }
});

gistForgetTokenBtn.addEventListener('click', () => {
  window.localStorage.removeItem(TOKEN_KEY);
  gistTokenInput.value = '';
  showGistStatus(t('gistTokenRemoved'));
});

// Opening ".../demo/#gist=<id>" loads that gist, so exported shaders are shareable.
const hashGist = /^#gist=([0-9a-f]+)$/i.exec(location.hash);
if (hashGist) {
  runGistImport(hashGist[1]).catch((err) => {
    errorEl.hidden = false;
    errorEl.textContent = t('gistLoadFailed', { error: describeGistError(err) });
  });
}
