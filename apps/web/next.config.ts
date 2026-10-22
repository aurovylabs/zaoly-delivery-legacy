import type { NextConfig } from 'next'
import path from 'node:path'
import { withSentryConfig } from '@sentry/nextjs/config'
import { paths } from './lib/paths'

const nextConfig: NextConfig = {
  // Cache Components + Partial Prefetching (Next 16.4; default in Next 17).
  // Spec: specs/domain/cache-components-adoption.md
  cacheComponents: true,
  partialPrefetching: true,
  serverExternalPackages: ['pg', 'playwright'],
  webpack: (config) => {
    const appNodeModules = path.resolve(__dirname, '../../node_modules')
    // Do NOT alias `react` / `react-dom` to node_modules here — Next App Router uses
    // `next/dist/compiled/react` for SSR; forcing node_modules/react causes
    // "Invalid hook call" / useContext null. Dedup linked UI via package overrides
    // instead — see `knowledge/next-react-singleton-hydration.md`.
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@zaoly/contracts': path.resolve(__dirname, '../../packages/contracts/src/index.ts'),
      '@zaoly/site-kit$': path.resolve(__dirname, '../../packages/site-kit/src/index.ts'),
      '@zaoly/site-kit/styles.css': path.resolve(
        __dirname,
        '../../packages/site-kit/src/styles.css',
      ),
      // Exact `$` so `@zaoly/ui/mag` / `@zaoly/ui/catalog` / `@zaoly/ui/catalog-registry` are not swallowed.
      '@zaoly/ui$': path.resolve(__dirname, './lib/zaoly-ui.ts'),
      '@zaoly/ui/catalog-registry': path.resolve(__dirname, './lib/zaoly-ui-catalog.ts'),
      '@zaoly/ui/mag': path.resolve(__dirname, '../../packages/ui/src/mag/index.ts'),
      '@zaoly/ui-shell': path.resolve(__dirname, './lib/zaoly-ui-shell.ts'),
      '@zaoly/ui/styles.css': path.resolve(__dirname, '../../packages/ui/src/styles.css'),
      '@zaoly/ui-tokens': path.resolve(__dirname, '../../packages/ui-tokens/dist/index.js'),
      '@react-pdf/renderer': path.resolve(appNodeModules, '@react-pdf/renderer'),
    }
    config.resolve.modules = [
      appNodeModules,
      ...(Array.isArray(config.resolve.modules)
        ? config.resolve.modules
        : config.resolve.modules
          ? [config.resolve.modules]
          : ['node_modules']),
    ]
    return config
  },
}

function envTruthy(name: string): boolean {
  const raw = process.env[name]?.trim()
  return Boolean(raw)
}

/** Wrap only when operators opted into Sentry DSN and/or source-map upload (W10). */
const sentryBuildEnabled =
  envTruthy(paths.envSentryDsn) ||
  envTruthy(paths.envSentryDsnPublic) ||
  envTruthy(paths.envSentryAuthToken)

const sentrySourceMapsEnabled =
  envTruthy(paths.envSentryAuthToken) &&
  envTruthy(paths.envSentryOrg) &&
  envTruthy(paths.envSentryProject)

export default sentryBuildEnabled
  ? withSentryConfig(nextConfig, {
      org: process.env[paths.envSentryOrg],
      project: process.env[paths.envSentryProject],
      authToken: process.env[paths.envSentryAuthToken],
      silent: true,
      tunnelRoute: paths.sentryTunnelPath,
      widenClientFileUpload: sentrySourceMapsEnabled,
      sourcemaps: {
        disable: !sentrySourceMapsEnabled,
      },
    })
  : nextConfig
