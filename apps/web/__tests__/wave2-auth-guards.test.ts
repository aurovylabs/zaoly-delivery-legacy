import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { paths } from '../lib/paths'

const authMock = vi.fn<() => Promise<{ user?: { id: string } } | null>>()

vi.mock('../auth', () => ({
  auth: () => authMock(),
}))

describe('Wave 2 auth guards', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    authMock.mockReset()
    vi.stubEnv(paths.envAuthBypass, '0')
    delete process.env[paths.envFederationAuthUrl]
    delete process.env[paths.envServiceSecret]
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('POST /api/library/promote returns 401 without session', async () => {
    authMock.mockResolvedValue(null)
    const { POST } = await import('../app/api/library/promote/route')
    const res = await POST(
      new Request('http://localhost/api/library/promote', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      }),
    )
    expect(res.status).toBe(401)
  })

  it('POST /api/library/promote/dry-run returns 401 without session', async () => {
    authMock.mockResolvedValue(null)
    const { POST } = await import('../app/api/library/promote/dry-run/route')
    const res = await POST(
      new Request('http://localhost/api/library/promote/dry-run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      }),
    )
    expect(res.status).toBe(401)
  })

  it('POST /api/site-kit/write returns 401 without session', async () => {
    authMock.mockResolvedValue(null)
    const { POST } = await import('../app/api/site-kit/write/route')
    const res = await POST(
      new Request('http://localhost/api/site-kit/write', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      }),
    )
    expect(res.status).toBe(401)
  })

  it('POST /api/site-kit/publish returns 401 without session', async () => {
    authMock.mockResolvedValue(null)
    const { POST } = await import('../app/api/site-kit/publish/route')
    const res = await POST(
      new Request('http://localhost/api/site-kit/publish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      }),
    )
    expect(res.status).toBe(401)
  })

  it('POST /api/magazine-templates returns 410 print_out_of_scope', async () => {
    authMock.mockResolvedValue(null)
    const { POST } = await import('../app/api/magazine-templates/route')
    const res = await POST()
    expect(res.status).toBe(410)
  })

  it('POST /api/projects returns 401 without session', async () => {
    authMock.mockResolvedValue(null)
    const { POST } = await import('../app/api/projects/route')
    const res = await POST(
      new Request('http://localhost/api/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'X' }),
      }),
    )
    expect(res.status).toBe(401)
  })

  it('POST /api/projects ignores body ownerUserId and uses session', async () => {
    authMock.mockResolvedValue({ user: { id: 'session-owner' } })
    const { __resetProjectStoreForTests } = await import('../lib/fixtures/project-store')
    __resetProjectStoreForTests()
    const { POST } = await import('../app/api/projects/route')
    const res = await POST(
      new Request('http://localhost/api/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Owned',
          ownerUserId: 'attacker-spoof',
          platformProjectId: 'plx-local-owned-test',
        }),
      }),
    )
    expect(res.status).toBe(201)
    const project = (await res.json()) as { ownerUserId?: string | null }
    expect(project.ownerUserId).toBe('session-owner')
  })

  it('isAuthBypassEnabled respects ZAOLY_AUTH_BYPASS outside production', async () => {
    vi.stubEnv('NODE_ENV', 'test')
    vi.resetModules()
    const { isAuthBypassEnabled } = await import('../lib/runtime-config')
    vi.stubEnv(paths.envAuthBypass, '1')
    expect(isAuthBypassEnabled()).toBe(true)
    vi.stubEnv(paths.envAuthBypass, '0')
    expect(isAuthBypassEnabled()).toBe(false)
  })

  it('isAuthBypassEnabled is false in production even when set', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv(paths.envAuthBypass, '1')
    vi.resetModules()
    const { isAuthBypassEnabled } = await import('../lib/runtime-config')
    expect(isAuthBypassEnabled()).toBe(false)
  })

  it('getAuthSecret throws in production without AUTH_SECRET', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    delete process.env[paths.envAuthSecret]
    vi.resetModules()
    const { getAuthSecret } = await import('../lib/auth-secret')
    expect(() => getAuthSecret()).toThrow(/AUTH_SECRET/)
  })
})
