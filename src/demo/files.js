// Local file open/download for shader source - replaces the old GitHub Gist
// integration (see git history): no token, no network, just the File System
// Access API where it's available, with a plain <input>/<a download> fallback
// for browsers that don't support it (Firefox, Safari).

const VERT_EXTENSIONS = /\.(vert|vs)$/i;

const OPEN_TYPES = [
  {
    description: 'Shader source',
    accept: { 'text/plain': ['.frag', '.vert', '.glsl', '.vs', '.fs'] },
  },
];

// Anything not recognized as a vertex extension (.frag/.fs/.glsl, or an
// unrecognized one) is treated as fragment source.
function targetForFilename(name) {
  return VERT_EXTENSIONS.test(name) ? 'vert' : 'frag';
}

function openShaderFileFallback() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.frag,.vert,.glsl,.vs,.fs';
    input.addEventListener(
      'change',
      async () => {
        const file = input.files[0];
        if (!file) {
          reject(new DOMException('No file selected', 'AbortError'));
          return;
        }
        resolve({ target: targetForFilename(file.name), code: await file.text(), name: file.name });
      },
      { once: true },
    );
    input.click();
  });
}

/** Opens a single local shader file, returning which editor tab it belongs in. */
export async function openShaderFile() {
  if (!window.showOpenFilePicker) {
    return openShaderFileFallback();
  }
  const [handle] = await window.showOpenFilePicker({ types: OPEN_TYPES });
  const file = await handle.getFile();
  return { target: targetForFilename(file.name), code: await file.text(), name: file.name };
}

async function writeFile(dirHandle, name, contents) {
  const fileHandle = await dirHandle.getFileHandle(name, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(contents);
  await writable.close();
}

function triggerDownload(filename, contents) {
  const url = URL.createObjectURL(new Blob([contents], { type: 'text/plain' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Browsers without the File System Access API restrict automatic multi-file
// downloads from a single click; spacing them out avoids the second one being
// silently dropped.
function downloadShaderFilesFallback({ frag, vert, baseName }) {
  triggerDownload(`${baseName}.frag`, frag);
  setTimeout(() => triggerDownload(`${baseName}.vert`, vert), 200);
}

/**
 * Downloads both shaders as `<baseName>.frag` / `<baseName>.vert`. Where
 * supported, the user picks a folder and both files are written there in one
 * go; otherwise they arrive as two separate browser downloads.
 */
export async function downloadShaderFiles({ frag, vert, baseName = 'shader' }) {
  if (!window.showDirectoryPicker) {
    downloadShaderFilesFallback({ frag, vert, baseName });
    return;
  }
  const dirHandle = await window.showDirectoryPicker();
  await writeFile(dirHandle, `${baseName}.frag`, frag);
  await writeFile(dirHandle, `${baseName}.vert`, vert);
}
