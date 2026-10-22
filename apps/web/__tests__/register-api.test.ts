import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetRateLimitBucketsForTests } from '../lib/rate-limit'
import { verifyPassword } from '../lib/users/password'

vi.mock('../lib/runtime-config', async () => {
  const actual = await vi.importActual<typeof import('../lib/runtime-config')>(
    '../lib/runtime-config',
  )
  return {
    ...actual,
    isZaolyDatabaseConfigured: vi.fn(() => true),
    isPublicSignupEnabled: vi.fn(() => true),
    isGoogleAuthConfigured: vi.fn(() => false),
  }
})

vi.mock('../lib/users/user-store', () => ({
  registerLocalMember: vi.fn(async ({ email, name }: { email: string; name?: string }) => ({
    id: 'u1',
    email: email.trim().toLowerCase(),
    name: name ?? null,
    role: 'member',
    disabled: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
  })),
  createEmailVerification: vi.fn(async () => ({
    email: 'new@zaoly.app',
    verifyUrl: 'https://zaoly.app/verify-email?token=abc',
    expiresAt: new Date().toISOString(),
  })),
}))

const voidEnsureStarterLandingForUser = vi.fn()

vi.mock('../lib/scene/user-starter-scene', () => ({
  voidEnsureStarterLandingForUser: (...args: unknown[]) =>
    voidEnsureStarterLandingForUser(...args),
  ensureStarterLandingForUser: vi.fn(),
}))

vi.mock('../lib/mail/system-mail', () => ({
  sendWelcomeEmail: vi.fn(async () => ({ ok: true })),
  sendEmailVerifyEmail: vi.fn(async () => ({ ok: true })),
  voidSystemMail: vi.fn(),
}))

describe('POST /api/register', () => {
  beforeEach(() => {
    vi.resetModules()
    resetRateLimitBucketsForTests()
    voidEnsureStarterLandingForUser.mockClear()
  })

  it('creates a member when signup is enabled', async () => {
    const { POST } = await import('../app/api/register/route')
    const res = await POST(
      new Request('http://localhost/api/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: 'New@Zaoly.app',
          password: 'long-enough-password',
          name: 'Ada',
        }),
      }),
    )
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toEqual({
      id: 'u1',
      email: 'new@zaoly.app',
      name: 'Ada',
      role: 'member',
    })
    expect(voidEnsureStarterLandingForUser).toHaveBeenCalledWith('u1')
  })

  it('returns 403 when signup is disabled', async () => {
    const runtime = await import('../lib/runtime-config')
    vi.mocked(runtime.isPublicSignupEnabled).mockReturnValue(false)
    const { POST } = await import('../app/api/register/route')
    const res = await POST(
      new Request('http://localhost/api/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'a@b.co', password: 'long-enough-password' }),
      }),
    )
    expect(res.status).toBe(403)
    await expect(res.json()).resolves.toEqual({ error: 'signup_disabled' })
  })
})

describe('password verify for OAuth-only users', () => {
  it('rejects null or empty password hashes', () => {
    expect(verifyPassword('anything-long', null)).toBe(false)
    expect(verifyPassword('anything-long', undefined)).toBe(false)
    expect(verifyPassword('anything-long', '')).toBe(false)
  })
})
