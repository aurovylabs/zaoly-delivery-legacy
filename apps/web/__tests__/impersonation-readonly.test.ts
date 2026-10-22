import { describe, expect, it, vi } from 'vitest'
import { paths } from '../lib/paths'

vi.mock('../lib/auth-secret', () => ({
  getAuthSecret: () => 'test-secret-at-least-32-characters!!',
}))

describe('impersonation read-only write lock', () => {
  it('allows stop while cookie is set', async () => {
    const { encodeImpersonationCookie } = await import(
      '../lib/users/impersonation-cookie'
    )
    const { impersonationWriteBlockReason } = await import(
      '../lib/users/impersonation-readonly'
    )
    const cookie = encodeImpersonationCookie({
      targetUserId: 't',
      actorUserId: 'a',
      exp: Math.floor(Date.now() / 1000) + 3600,
      reason: 'support ticket 42',
    })
    expect(
      impersonationWriteBlockReason(
        'POST',
        paths.routes.apiAdminImpersonateStop,
        cookie,
      ),
    ).toBeNull()
  })

  it('blocks other mutating APIs while cookie is set', async () => {
    const { encodeImpersonationCookie } = await import(
      '../lib/users/impersonation-cookie'
    )
    const { impersonationWriteBlockReason } = await import(
      '../lib/users/impersonation-readonly'
    )
    const cookie = encodeImpersonationCookie({
      targetUserId: 't',
      actorUserId: 'a',
      exp: Math.floor(Date.now() / 1000) + 3600,
      reason: 'support ticket 42',
    })
    expect(
      impersonationWriteBlockReason('POST', paths.routes.apiScenes, cookie),
    ).toBe('impersonating')
    expect(
      impersonationWriteBlockReason('PATCH', paths.routes.apiMe, cookie),
    ).toBe('impersonating')
    expect(
      impersonationWriteBlockReason('DELETE', '/api/tokens', cookie),
    ).toBe('impersonating')
  })

  it('allows GET and allows writes without cookie', async () => {
    const { impersonationWriteBlockReason } = await import(
      '../lib/users/impersonation-readonly'
    )
    expect(
      impersonationWriteBlockReason('GET', paths.routes.apiScenes, 'anything'),
    ).toBeNull()
    expect(
      impersonationWriteBlockReason('POST', paths.routes.apiScenes, undefined),
    ).toBeNull()
  })

  it('proxy wires the read-only guard', async () => {
    const { readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const src = readFileSync(join(__dirname, '../proxy.ts'), 'utf8')
    expect(src).toContain('forbidImpersonationWrite')
    expect(src).toContain('impersonationWriteBlockReason')
  })
})
