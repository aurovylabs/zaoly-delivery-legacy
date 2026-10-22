import { defineConfig } from 'vitest/config'
import path from 'node:path'
import {
  isPublicTree,
  PUBLIC_TREE_EXCLUDED_TESTS,
  repoRootFromWebLib,
} from './lib/test/public-tree'

const publicTree = isPublicTree(repoRootFromWebLib)

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@zaoly/ui/mag',
        replacement: path.resolve(__dirname, '../../packages/ui/src/mag/index.ts'),
      },
      {
        find: '@zaoly/ui/catalog-registry',
        replacement: path.resolve(__dirname, './lib/zaoly-ui-catalog.ts'),
      },
      {
        find: '@zaoly/ui/styles.css',
        replacement: path.resolve(__dirname, '../../packages/ui/src/styles.css'),
      },
      { find: '@zaoly/ui', replacement: path.resolve(__dirname, './lib/zaoly-ui.ts') },
      { find: '@zaoly/ui-shell', replacement: path.resolve(__dirname, './lib/zaoly-ui-shell.ts') },
      {
        find: '@zaoly/ui-tokens',
        replacement: path.resolve(__dirname, '../../packages/ui-tokens/dist/index.js'),
      },
      {
        find: '@zaoly/contracts',
        replacement: path.resolve(__dirname, '../../packages/contracts/src/index.ts'),
      },
      {
        find: '@react-pdf/renderer',
        replacement: path.resolve(__dirname, '../../node_modules/@react-pdf/renderer'),
      },
      {
        find: 'react-driftkit/SnapDock',
        replacement: path.resolve(__dirname, './test/mocks/SnapDock.tsx'),
      },
      { find: 'server-only', replacement: path.resolve(__dirname, './test/mocks/empty.ts') },
      {
        find: 'next/dynamic',
        replacement: path.resolve(__dirname, './test/mocks/next-dynamic.tsx'),
      },
      // Next 16.4 dropped package.json#exports; Node ESM needs explicit .js for next-auth.
      {
        find: 'next/server',
        replacement: path.resolve(__dirname, '../../node_modules/next/server.js'),
      },
      {
        find: 'next/headers',
        replacement: path.resolve(__dirname, '../../node_modules/next/headers.js'),
      },
      {
        find: 'next/navigation',
        replacement: path.resolve(__dirname, '../../node_modules/next/navigation.js'),
      },
      {
        find: 'next/cache',
        replacement: path.resolve(__dirname, '../../node_modules/next/cache.js'),
      },
      { find: 'react', replacement: path.resolve(__dirname, '../../node_modules/react') },
      { find: 'react-dom', replacement: path.resolve(__dirname, '../../node_modules/react-dom') },
      {
        find: 'react/jsx-runtime',
        replacement: path.resolve(__dirname, '../../node_modules/react/jsx-runtime'),
      },
      {
        find: 'react/jsx-dev-runtime',
        replacement: path.resolve(__dirname, '../../node_modules/react/jsx-dev-runtime'),
      },
    ],
    dedupe: ['react', 'react-dom'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test.setup.ts'],
    // CI runners with the full suite need headroom beyond the 5s default.
    testTimeout: 15_000,
    ...(publicTree
      ? {
          exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/cypress/**',
            '**/.{idea,git,cache,output,temp}/**',
            '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
            ...PUBLIC_TREE_EXCLUDED_TESTS,
          ],
        }
      : {}),
    server: {
      deps: {
        inline: ['react-driftkit', 'next-auth', /@auth\/core/, /zaoly/],
      },
    },
  },
})
