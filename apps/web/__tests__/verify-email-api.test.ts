import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetRateLimitBucketsForTests } from '../lib/rate-limit'

vi.mock('../lib/runtime-config', async () => {
  const actual = await vi.importActual<typeof import('../lib/runtime-config')>(
    '../lib/runtime-config',
  )
  return {
    ...actual,
    isZaolyDatabaseConfigured: vi.fn(() => true),
  }
})

const consumeEmailVerification = vi.fn()

vi.mock('../lib/users/user-store', () => ({
  isZaolyUserStoreAvailable: vi.fn(() => true),
  consumeEmailVerification: (...args: unknown[]) => consumeEmailVerification(...args),
}))

describe('POST /api/auth/verify-email', () => {
  beforeEach(() => {
    vi.resetModules()
    resetRateLimitBucketsForTests()
    consumeEmailVerification.mockReset()
    consumeEmailVerification.mockResolvedValue({
      id: 'u1',
      email: 'm@zaoly.app',
      name: null,
      role: 'member',
      disabled: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
    })
  })

  it('consumes a valid token', async () => {
    const { POST } = await import('../app/api/auth/verify-email/route')
    const res = await POST(
      new Request('http://localhost/api/auth/verify-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: 'tok' }),
      }),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(consumeEmailVerification).toHaveBeenCalledWith('tok')
  })

  it('maps expired tokens to 410', async () => {
    consumeEmailVerification.mockRejectedValueOnce(new Error('token_expired'))
    const { POST } = await import('../app/api/auth/verify-email/route')
    const res = await POST(
      new Request('http://localhost/api/auth/verify-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: 'old' }),
      }),
    )
    expect(res.status).toBe(410)
    expect(await res.json()).toEqual({ error: 'token_expired' })
  })
})
