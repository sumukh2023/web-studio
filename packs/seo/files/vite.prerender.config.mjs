/**
 * A SECOND BUILD OF THE SAME SOURCE, for prerendering only.
 *
 * jsdom cannot execute `<script type="module">`, and Vite's production output
 * is ESM, so pointing jsdom at dist/ renders an empty #root on every route.
 * This emits the identical application as one classic IIFE that jsdom can
 * run. Nothing here is deployed: scripts/prerender.mjs loads it, snapshots the
 * head, and dist-prerender/ is gitignored and thrown away.
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(process.cwd(), './src') } },
  // The images are already in dist/; copying public/ again is wasted work.
  publicDir: false,
  build: {
    outDir: 'dist-prerender',
    emptyOutDir: true,
    cssCodeSplit: false,
    // One big file IS the point (jsdom runs neither ESM nor dynamic import),
    // and nobody downloads it. Raised, not disabled, so a doubling still warns.
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      input: path.resolve(process.cwd(), 'src/main.tsx'),
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'app.js',
        assetFileNames: 'app.[ext]',
      },
    },
  },
});
