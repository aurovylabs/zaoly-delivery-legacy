import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/users/require-admin', () => ({
  requirePlatformAdminUserNotImpersonating: vi.fn(),
  requireAdminUser: vi.fn(),
  isAdminUser: (v: unknown) =>
    Boolean(v && typeof v === 'object' && 'user' in (v as object)),
}))

vi.mock('../lib/users/user-store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/users/user-store')>()
  return {
    ...actual,
    isZaolyUserStoreAvailable: vi.fn(() => true),
    getUserById: vi.fn(),
  }
})

vi.mock('../lib/users/impersonation', () => ({
  isImpersonationEnabled: vi.fn(() => true),
  writeImpersonationCookie: vi.fn(async () => undefined),
  clearImpersonationCookie: vi.fn(async () => undefined),
  readImpersonation: vi.fn(async () => null),
  forbidIfImpersonating: vi.fn(async () => null),
}))

vi.mock('../lib/users/admin-audit', () => ({
  voidRecordAdminAudit: vi.fn(),
}))

describe('admin impersonation API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts impersonation with reason when enabled', async () => {
    const { requirePlatformAdminUserNotImpersonating } = await import(
      '../lib/users/require-admin'
    )
    const store = await import('../lib/users/user-store')
    const imp = await import('../lib/users/impersonation')
    vi.mocked(requirePlatformAdminUserNotImpersonating).mockResolvedValue({
      user: { id: 'pa1', email: 'pa@x', role: 'platform_admin' },
    } as never)
    vi.mocked(store.getUserById).mockResolvedValue({
      id: 'u1',
      email: 'm@x',
      name: 'M',
      role: 'member',
      disabled: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      lastLoginAt: null,
    })

    const { POST } = await import('../app/api/admin/impersonate/route')
    const res = await POST(
      new Request('http://local', {
        method: 'POST',
        body: JSON.stringify({ userId: 'u1', reason: 'support ticket 42' }),
      }),
    )
    expect(res.status).toBe(200)
    expect(imp.writeImpersonationCookie).toHaveBeenCalledWith(
      expect.objectContaining({
        targetUserId: 'u1',
        actorUserId: 'pa1',
        reason: 'support ticket 42',
      }),
    )
    expect(await res.json()).toMatchObject({ ok: true, targetUserId: 'u1' })
  })

  it('rejects short reason', async () => {
    const { requirePlatformAdminUserNotImpersonating } = await import(
      '../lib/users/require-admin'
    )
    vi.mocked(requirePlatformAdminUserNotImpersonating).mockResolvedValue({
      user: { id: 'pa1', email: 'pa@x', role: 'platform_admin' },
    } as never)

    const { POST } = await import('../app/api/admin/impersonate/route')
    const res = await POST(
      new Request('http://local', {
        method: 'POST',
        body: JSON.stringify({ userId: 'u1', reason: 'short' }),
      }),
    )
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'reason_required' })
  })

  it('rejects staff targets', async () => {
    const { requirePlatformAdminUserNotImpersonating } = await import(
      '../lib/users/require-admin'
    )
    const store = await import('../lib/users/user-store')
    vi.mocked(requirePlatformAdminUserNotImpersonating).mockResolvedValue({
      user: { id: 'pa1', email: 'pa@x', role: 'platform_admin' },
    } as never)
    vi.mocked(store.getUserById).mockResolvedValue({
      id: 'a1',
      email: 'a@x',
      name: 'A',
      role: 'admin',
      disabled: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      lastLoginAt: null,
    })

    const { POST } = await import('../app/api/admin/impersonate/route')
    const res = await POST(
      new Request('http://local', {
        method: 'POST',
        body: JSON.stringify({ userId: 'a1', reason: 'should not work' }),
      }),
    )
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'cannot_impersonate_staff' })
  })

  it('rejects when impersonation disabled', async () => {
    const { requirePlatformAdminUserNotImpersonating } = await import(
      '../lib/users/require-admin'
    )
    const imp = await import('../lib/users/impersonation')
    vi.mocked(requirePlatformAdminUserNotImpersonating).mockResolvedValue({
      user: { id: 'pa1', email: 'pa@x', role: 'platform_admin' },
    } as never)
    vi.mocked(imp.isImpersonationEnabled).mockReturnValue(false)

    const { POST } = await import('../app/api/admin/impersonate/route')
    const res = await POST(
      new Request('http://local', {
        method: 'POST',
        body: JSON.stringify({ userId: 'u1', reason: 'support ticket 42' }),
      }),
    )
    expect(res.status).toBe(403)
  })

  it('stops impersonation for staff', async () => {
    const { requireAdminUser } = await import('../lib/users/require-admin')
    const imp = await import('../lib/users/impersonation')
    vi.mocked(requireAdminUser).mockResolvedValue({
      user: { id: 'pa1', email: 'pa@x', role: 'platform_admin' },
    } as never)
    vi.mocked(imp.readImpersonation).mockResolvedValue({
      targetUserId: 'u1',
      actorUserId: 'pa1',
      exp: Math.floor(Date.now() / 1000) + 3600,
      reason: 'support ticket 42',
    })

    const { POST } = await import('../app/api/admin/impersonate/stop/route')
    const res = await POST()
    expect(res.status).toBe(200)
    expect(imp.clearImpersonationCookie).toHaveBeenCalled()
  })
})
