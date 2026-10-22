/**
 * Vite library build for public atom CDN (SK-V14).
 * Emits ESM + CSS under `cdn-dist/` — no Pattern composition modules.
 * esbuild automatic JSX (jsxDev: false) — production `react/jsx-runtime` only.
 */
import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  mode: 'production',
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  esbuild: {
    jsx: 'automatic',
    jsxDev: false,
    jsxImportSource: 'react',
  },
  build: {
    outDir: 'cdn-dist',
    emptyOutDir: true,
    minify: 'esbuild',
    lib: {
      entry: path.resolve(root, 'src/index.ts'),
      name: 'CreationSiteKit',
      formats: ['es'],
      fileName: () => 'site-kit.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        assetFileNames: (asset) =>
          asset.name && asset.name.endsWith('.css') ? 'site-kit.css' : 'assets/[name][extname]',
      },
    },
    sourcemap: true,
    target: 'es2022',
  },
})
