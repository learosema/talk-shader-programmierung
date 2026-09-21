// GitHub Gist import/export for the shader lab.
// Reading a public gist needs no auth; creating/updating one needs a personal
// access token with the `gist` scope (GitHub no longer allows anonymous gists).

const API = 'https://api.github.com/gists';
const GIST_FILENAME = 'shader.frag';
const SHADER_EXTENSIONS = /\.(frag|fs|glsl)$/i;

// Errors thrown here carry a `code` (invalid-id, no-files, no-token) instead of a
// message, so the UI layer can show them in the current language.
function codedError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

/** Accepts a gist URL (with or without username) or a bare gist ID. */
export function parseGistId(input) {
  const cleaned = String(input).trim().replace(/[?#].*$/, '').replace(/\/+$/, '');
  const last = cleaned.split('/').pop() ?? '';
  const id = last.replace(/\.git$/, '');
  return /^[0-9a-f]{20,}$/i.test(id) ? id : null;
}

async function githubFetch(url, options, token) {
  const headers = { Accept: 'application/vnd.github+json', ...options?.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const error = new Error(`GitHub: ${response.status} ${response.statusText}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

/** Loads the shader source of a gist: prefers .frag/.glsl files, else the first file. */
export async function importGist(idOrUrl) {
  const id = parseGistId(idOrUrl);
  if (!id) throw codedError('invalid-id');

  const gist = await githubFetch(`${API}/${id}`);
  const files = Object.values(gist.files ?? {});
  const file = files.find((f) => SHADER_EXTENSIONS.test(f.filename)) ?? files[0];
  if (!file) throw codedError('no-files');

  // Large files come back truncated; the raw URL has the full content.
  const code = file.truncated ? await (await fetch(file.raw_url)).text() : file.content;
  return { id, code, filename: file.filename, url: gist.html_url };
}

/**
 * Publishes the code as a gist. If `existingId` is given we try to update that gist
 * first; that fails with 404 for gists the token owner doesn't own, in which case
 * a fresh gist is created instead.
 */
export async function exportGist({ code, token, existingId, description = 'Shader Lab' }) {
  if (!token) throw codedError('no-token');
  const body = JSON.stringify({
    description,
    public: false,
    files: { [GIST_FILENAME]: { content: code } },
  });
  const json = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body };

  let gist;
  if (existingId) {
    try {
      gist = await githubFetch(`${API}/${existingId}`, { ...json, method: 'PATCH' }, token);
    } catch (err) {
      if (err.status !== 404) throw err;
    }
  }
  gist ??= await githubFetch(API, json, token);
  return { id: gist.id, url: gist.html_url, updated: gist.id === existingId };
}
