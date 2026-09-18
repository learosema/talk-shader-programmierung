import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(fileURLToPath(import.meta.url));

// root: 'src' so both apps (demo/, slides/) sit next to the landing page and
// src/public/ (static files like the slide markdown, copied as-is on build).
export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(rootDir, 'src/index.html'),
        demo: resolve(rootDir, 'src/demo/index.html'),
        slides: resolve(rootDir, 'src/slides/index.html'),
      },
    },
  },
});
