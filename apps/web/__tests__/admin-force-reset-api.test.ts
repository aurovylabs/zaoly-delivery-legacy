import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextResponse } from 'next/server'

vi.mock('../lib/users/require-admin', () => ({
  requireAdminUserNotImpersonating: vi.fn(),
  isAdminUser: (v: unknown) =>
    Boolean(v && typeof v === 'object' && 'user' in (v as object)),
}))

vi.mock('../lib/users/user-store', () => ({
  isZaolyUserStoreAvailable: vi.fn(() => true),
  getUserById: vi.fn(),
  createPasswordReset: vi.fn(),
}))

vi.mock('../lib/mail/system-mail', () => ({
  sendPasswordResetEmail: vi.fn(async () => ({ ok: true })),
}))

vi.mock('../lib/users/admin-audit', () => ({
  voidRecordAdminAudit: vi.fn(),
}))

vi.mock('../lib/mail/mail-locale', () => ({
  resolveMailLocale: vi.fn((v: string) => (v === 'de' ? 'de' : 'en')),
}))

describe('POST /api/admin/users/:id/force-password-reset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mints reset + sends mail for enabled users', async () => {
    const { requireAdminUserNotImpersonating } = await import(
      '../lib/users/require-admin'
    )
    const store = await import('../lib/users/user-store')
    const mail = await import('../lib/mail/system-mail')
    const audit = await import('../lib/users/admin-audit')

    vi.mocked(requireAdminUserNotImpersonating).mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@x', role: 'admin' },
    } as never)
    vi.mocked(store.getUserById).mockResolvedValue({
      id: 'u1',
      email: 'member@x',
      name: 'Mem',
      role: 'member',
      disabled: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      lastLoginAt: null,
    })
    vi.mocked(store.createPasswordReset).mockResolvedValue({
      email: 'member@x',
      resetUrl: 'https://zaoly.app/reset-password?token=abc',
      expiresAt: '2026-01-01T01:00:00.000Z',
    })

    const { POST } = await import(
      '../app/api/admin/users/[id]/force-password-reset/route'
    )
    const res = await POST(new Request('http://local', { method: 'POST', body: '{}' }), {
      params: Promise.resolve({ id: 'u1' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ ok: true, emailSent: true })
    expect(mail.sendPasswordResetEmail).toHaveBeenCalled()
    expect(audit.voidRecordAdminAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'user.force_password_reset', targetUserId: 'u1' }),
    )
  })

  it('rejects disabled targets', async () => {
    const { requireAdminUserNotImpersonating } = await import(
      '../lib/users/require-admin'
    )
    const store = await import('../lib/users/user-store')
    vi.mocked(requireAdminUserNotImpersonating).mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@x', role: 'admin' },
    } as never)
    vi.mocked(store.getUserById).mockResolvedValue({
      id: 'u1',
      email: 'member@x',
      name: null,
      role: 'member',
      disabled: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      lastLoginAt: null,
    })

    const { POST } = await import(
      '../app/api/admin/users/[id]/force-password-reset/route'
    )
    const res = await POST(new Request('http://local', { method: 'POST', body: '{}' }), {
      params: Promise.resolve({ id: 'u1' }),
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'user_disabled' })
  })

  it('rejects non-admins', async () => {
    const { requireAdminUserNotImpersonating } = await import(
      '../lib/users/require-admin'
    )
    vi.mocked(requireAdminUserNotImpersonating).mockResolvedValue(
      NextResponse.json({ error: 'forbidden' }, { status: 403 }) as never,
    )
    const { POST } = await import(
      '../app/api/admin/users/[id]/force-password-reset/route'
    )
    const res = await POST(new Request('http://local', { method: 'POST', body: '{}' }), {
      params: Promise.resolve({ id: 'u1' }),
    })
    expect(res.status).toBe(403)
  })
})
