import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../auth', () => ({
  auth: vi.fn(async () => ({ user: { id: 'u1', email: 'g@zaoly.app' } })),
}))

vi.mock('../lib/runtime-config', async () => {
  const actual = await vi.importActual<typeof import('../lib/runtime-config')>(
    '../lib/runtime-config',
  )
  return {
    ...actual,
    isAuthBypassEnabled: vi.fn(() => false),
  }
})

vi.mock('../lib/users/impersonation', () => ({
  readImpersonation: vi.fn(async () => null),
}))

const setSessionPassword = vi.fn()

vi.mock('../lib/users/user-store', () => ({
  isZaolyUserStoreAvailable: vi.fn(() => true),
  setSessionPassword: (...args: unknown[]) => setSessionPassword(...args),
}))

vi.mock('../lib/mail/system-mail', () => ({
  sendPasswordChangedEmail: vi.fn(async () => ({ ok: true })),
  voidSystemMail: vi.fn(),
}))

describe('PATCH /api/me/password', () => {
  beforeEach(() => {
    vi.resetModules()
    setSessionPassword.mockReset()
    setSessionPassword.mockResolvedValue({
      id: 'u1',
      email: 'g@zaoly.app',
      name: null,
      role: 'member',
      disabled: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
    })
  })

  it('sets a password for Google-only accounts', async () => {
    const { PATCH } = await import('../app/api/me/password/route')
    const res = await PATCH(
      new Request('http://localhost/api/me/password', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: 'long-enough-password' }),
      }),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, hasPassword: true })
    expect(setSessionPassword).toHaveBeenCalledWith({
      userId: 'u1',
      password: 'long-enough-password',
      currentPassword: undefined,
    })
  })

  it('rejects short passwords', async () => {
    setSessionPassword.mockRejectedValueOnce(new Error('password_too_short'))
    const { PATCH } = await import('../app/api/me/password/route')
    const res = await PATCH(
      new Request('http://localhost/api/me/password', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: 'short' }),
      }),
    )
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'password_too_short' })
  })
})
