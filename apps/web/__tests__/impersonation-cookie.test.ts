import { describe, expect, it, vi } from 'vitest'

vi.mock('../lib/auth-secret', () => ({
  getAuthSecret: () => 'test-secret-at-least-32-characters!!',
}))

describe('impersonation cookie codec', () => {
  it('round-trips a signed payload', async () => {
    const {
      encodeImpersonationCookie,
      decodeImpersonationCookie,
    } = await import('../lib/users/impersonation-cookie')
    const exp = Math.floor(Date.now() / 1000) + 3600
    const raw = encodeImpersonationCookie({
      targetUserId: 'target',
      actorUserId: 'actor',
      exp,
      reason: 'support ticket 42',
    })
    expect(decodeImpersonationCookie(raw)).toEqual({
      targetUserId: 'target',
      actorUserId: 'actor',
      exp,
      reason: 'support ticket 42',
    })
  })

  it('rejects tampered payloads', async () => {
    const {
      encodeImpersonationCookie,
      decodeImpersonationCookie,
    } = await import('../lib/users/impersonation-cookie')
    const raw = encodeImpersonationCookie({
      targetUserId: 'target',
      actorUserId: 'actor',
      exp: Math.floor(Date.now() / 1000) + 3600,
      reason: 'support ticket 42',
    })
    expect(decodeImpersonationCookie(`${raw}x`)).toBeNull()
    expect(decodeImpersonationCookie('not-valid')).toBeNull()
  })

  it('rejects payload without reason', async () => {
    const { encodeImpersonationCookie, decodeImpersonationCookie } = await import(
      '../lib/users/impersonation-cookie'
    )
    const { createHmac } = await import('node:crypto')
    const body = Buffer.from(
      JSON.stringify({
        targetUserId: 't',
        actorUserId: 'a',
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
      'utf8',
    ).toString('base64url')
    const sig = createHmac('sha256', 'test-secret-at-least-32-characters!!')
      .update(body)
      .digest('base64url')
    expect(decodeImpersonationCookie(`${body}.${sig}`)).toBeNull()
    // sanity: codec still works
    expect(
      decodeImpersonationCookie(
        encodeImpersonationCookie({
          targetUserId: 't',
          actorUserId: 'a',
          exp: Math.floor(Date.now() / 1000) + 3600,
          reason: 'ok reason',
        }),
      ),
    ).not.toBeNull()
  })
})
