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

    gistTitle: 'Import/Export via GitHub Gist',
    gistImportLabel: 'Gist-URL oder -ID',
    gistImport: 'Importieren',
    gistTokenLabel: 'GitHub-Token (Scope: gist)',
    gistTokenHint:
      'Wird im localStorage dieses Browsers gespeichert. Nur auf einem Rechner verwenden, dem du vertraust.',
    gistTokenCreate: 'Token erstellen',
    gistExport: 'Als Gist speichern',
    gistForgetToken: 'Token vergessen',
    close: 'Schließen',
    loading: 'Lade …',
    saving: 'Speichere …',
    gistImported: '„{name}“ importiert.',
    gistCreated: 'Gist erstellt:',
    gistUpdated: 'Gist aktualisiert:',
    gistShareLink: 'Shader-Lab-Link',
    gistTokenRemoved: 'Token entfernt.',
    gistLoadFailed: 'Gist konnte nicht geladen werden: {error}',
    gistInvalidId: 'Keine gültige Gist-URL oder -ID.',
    gistNoFiles: 'Der Gist enthält keine Dateien.',
    gistNoToken: 'Für den Export wird ein GitHub-Token (Scope: gist) benötigt.',
    gistBadToken: ' (Token ungültig oder ohne gist-Scope?)',
  },
  en: {
    pause: 'Pause',
    resume: 'Resume',
    resetTime: 'Reset time',
    customCode: '✏️ Custom code',
    snippetPlaceholder: '＋ Snippet …',
    snippetLabel: 'Insert snippet',
    snippetExists: '{name}() is already defined in the code.',

    gistTitle: 'Import/export via GitHub Gist',
    gistImportLabel: 'Gist URL or ID',
    gistImport: 'Import',
    gistTokenLabel: 'GitHub token (scope: gist)',
    gistTokenHint:
      "Stored in this browser's localStorage. Only use this on a machine you trust.",
    gistTokenCreate: 'Create token',
    gistExport: 'Save as gist',
    gistForgetToken: 'Forget token',
    close: 'Close',
    loading: 'Loading …',
    saving: 'Saving …',
    gistImported: '“{name}” imported.',
    gistCreated: 'Gist created:',
    gistUpdated: 'Gist updated:',
    gistShareLink: 'Shader Lab link',
    gistTokenRemoved: 'Token removed.',
    gistLoadFailed: 'Could not load gist: {error}',
    gistInvalidId: 'Not a valid gist URL or ID.',
    gistNoFiles: 'The gist contains no files.',
    gistNoToken: 'Exporting needs a GitHub token (scope: gist).',
    gistBadToken: ' (invalid token, or missing the gist scope?)',
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
