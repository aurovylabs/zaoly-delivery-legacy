import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, afterEach, beforeEach, vi } from 'vitest'
import { paths } from '../lib/paths'
import {
  envGet,
  isAuthBypassEnabled,
  editorInAppEnabled,
} from '../lib/runtime-config'

const webRoot = path.resolve(__dirname, '..')

describe('zaoly standalone boot', () => {
  const prev: Record<string, string | undefined> = {}

  beforeEach(() => {
    for (const key of [
      'ZAOLY_AUTH_BYPASS',
      'ZAOLY_STANDALONE',
      'ZAOLY_DATABASE_URL',
      'ZAOLY_EDITOR_INAPP',
      'NODE_ENV',
    ]) {
      prev[key] = process.env[key]
    }
  })

  afterEach(() => {
    for (const [key, value] of Object.entries(prev)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    vi.unstubAllEnvs()
  })

  it('locks product identity to zaoly', () => {
    expect(paths.productId).toBe('zaoly')
    expect(paths.brandLabel).toBe('Zaoly')
    expect(paths.standaloneMode).toBe(true)
  })

  it('defaults auth bypass on outside production when Postgres unset', () => {
    delete process.env.ZAOLY_AUTH_BYPASS
    delete process.env.ZAOLY_STANDALONE
    delete process.env.ZAOLY_DATABASE_URL
    vi.stubEnv('NODE_ENV', 'development')
    expect(isAuthBypassEnabled()).toBe(true)
  })

  it('defaults auth bypass off when Postgres is configured', () => {
    delete process.env.ZAOLY_AUTH_BYPASS
    process.env.ZAOLY_DATABASE_URL = 'postgresql://zaoly:zaoly@localhost:5434/zaoly'
    vi.stubEnv('NODE_ENV', 'development')
    expect(isAuthBypassEnabled()).toBe(false)
  })

  it('honours explicit ZAOLY_AUTH_BYPASS=1 with Postgres', () => {
    process.env.ZAOLY_DATABASE_URL = 'postgresql://zaoly:zaoly@localhost:5434/zaoly'
    process.env.ZAOLY_AUTH_BYPASS = '1'
    vi.stubEnv('NODE_ENV', 'development')
    expect(isAuthBypassEnabled()).toBe(true)
  })

  it('honours ZAOLY_STANDALONE=0 to disable default bypass without Postgres', () => {
    delete process.env.ZAOLY_AUTH_BYPASS
    delete process.env.ZAOLY_DATABASE_URL
    process.env.ZAOLY_STANDALONE = '0'
    vi.stubEnv('NODE_ENV', 'development')
    expect(isAuthBypassEnabled()).toBe(false)
  })

  it('resolves ZAOLY_EDITOR_INAPP without legacy aliases', () => {
    delete process.env.CREATION_EDITOR_INAPP
    process.env.ZAOLY_EDITOR_INAPP = '1'
    expect(envGet(paths.envEditorInApp)).toBe('1')
    expect(editorInAppEnabled()).toBe(true)
  })

  it('does not resolve CREATION_* env aliases', () => {
    delete process.env.ZAOLY_EDITOR_INAPP
    process.env.CREATION_EDITOR_INAPP = '1'
    expect(envGet(paths.envEditorInApp)).toBeUndefined()
  })

  it('exposes editor route as primary surface', () => {
    expect(paths.routes.editor).toBe('/editor')
    expect(paths.routes.home).toBe('/')
  })

  it('uses Next.js 16 Node proxy instead of Edge middleware', () => {
    expect(existsSync(path.join(webRoot, 'proxy.ts'))).toBe(true)
    expect(existsSync(path.join(webRoot, 'middleware.ts'))).toBe(false)
    const src = readFileSync(path.join(webRoot, 'proxy.ts'), 'utf8')
    expect(src).toMatch(/export default function proxy\b/)
  })

  it('documents local Postgres bootstrap without committing secrets', () => {
    const example = readFileSync(path.join(webRoot, '../../.env.example'), 'utf8')
    expect(example).toMatch(/ZAOLY_DATABASE_URL=postgresql:\/\/zaoly:zaoly@localhost:5434\/zaoly/)
    expect(paths.localPostgresHostPort).toBe(5434)
    expect(existsSync(path.join(webRoot, '../../scripts/bootstrap-local-pg.mjs'))).toBe(true)
  })

  it('documents hosted vs self-host packaging without weddy-only self-host deps', () => {
    const repoRoot = path.join(webRoot, '../..')
    const matrix = readFileSync(
      path.join(repoRoot, 'knowledge/zaoly-hosted-vs-self-host.md'),
      'utf8',
    )
    expect(matrix).toContain('ZAOLY_SMTP_MANAGED')
    expect(matrix).toContain('self-host.md')
    expect(matrix).toContain('weddy-ecosystem')

    const selfHost = readFileSync(path.join(repoRoot, 'knowledge/self-host.md'), 'utf8')
    expect(selfHost).toContain('docker-compose.self-host.yml')
    expect(selfHost).toContain('Do not set')
    expect(selfHost).toMatch(/ZAOLY_SMTP_MANAGED/)

    const compose = readFileSync(
      path.join(repoRoot, 'deploy/docker-compose.self-host.yml'),
      'utf8',
    )
    expect(compose).not.toContain('weddy-ecosystem')
    expect(compose).toContain('ZAOLY_HOST_PORT')

    const deployEnv = readFileSync(path.join(repoRoot, 'deploy/.env.example'), 'utf8')
    expect(deployEnv).toContain('AUTH_SECRET=')
    expect(deployEnv).toContain('ZAOLY_BOOTSTRAP_ADMIN_EMAIL=')
    expect(deployEnv).toContain('ZAOLY_EDITOR_INAPP=1')
    expect(deployEnv).toMatch(/Do NOT set ZAOLY_SMTP_MANAGED/)

    const standalone = readFileSync(
      path.join(repoRoot, 'specs/domain/zaoly-standalone.md'),
      'utf8',
    )
    expect(standalone).toContain('zaoly-hosted-vs-self-host.md')
    expect(standalone).toContain('self-host.md')

    const readme = readFileSync(path.join(repoRoot, 'README.md'), 'utf8')
    expect(readme).toContain('zaoly-community-distribution.md')
    expect(readme).toContain('zaoly.app')
  })
})
