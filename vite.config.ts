import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * The libraries that are most of the bundle, split into long-lived chunks.
 *
 * Worth doing for CACHING rather than for Vite's size warning: these change
 * when a dependency is upgraded, which is rarely, while app code changes on
 * every deploy. Bundled together, one copy edit invalidates a few hundred kB
 * in every returning visitor's cache; apart, only the small app chunk is
 * re-downloaded. Router entries are harmless until the `router` pack is in.
 */
const VENDOR_CHUNKS: Record<string, string> = {
  react: 'react',
  'react-dom': 'react',
  scheduler: 'react',
  'react-router': 'react',
  'react-router-dom': 'react',
  'framer-motion': 'motion',
  'motion-dom': 'motion',
  'motion-utils': 'motion',
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Dev only (Vite drops `server` at build time). Once the `api` starter pack
  // adds an api/ folder, `vite` still does not execute it, so /api is proxied
  // to `vercel dev --listen 3000` (or the pack's local sandbox). Override the
  // target with VITE_API_PROXY.
  server: existsSync(path.resolve(__dirname, 'api'))
    ? {
        proxy: {
          '/api': {
            target: process.env.VITE_API_PROXY ?? 'http://localhost:3000',
            // A remote target (a deployed preview) routes by Host header.
            changeOrigin: /^https:/.test(process.env.VITE_API_PROXY ?? ''),
          },
        },
      }
    : undefined,
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // The package name, matched on a path boundary. A loose
          // `includes('react')` would sweep up `@radix-ui/react-accordion`.
          const match = /node_modules\/(@[^/]+\/[^/]+|[^/]+)/.exec(id);
          return match ? VENDOR_CHUNKS[match[1]] : undefined;
        },
      },
    },
  },
});
