import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../auth', () => ({
  auth: vi.fn(),
}))

vi.mock('../lib/runtime-config', () => ({
  isAuthBypassEnabled: vi.fn(() => false),
}))

vi.mock('../lib/users/impersonation', () => ({
  readImpersonation: vi.fn(async () => null),
  forbidIfImpersonating: vi.fn(async () => null),
}))

vi.mock('../lib/users/admin-audit', () => ({
  voidRecordAdminAudit: vi.fn(),
}))

vi.mock('../lib/users/user-store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/users/user-store')>()
  return {
    ...actual,
    isZaolyUserStoreAvailable: vi.fn(() => false),
    getUserById: vi.fn(),
  }
})

describe('requireAdminUser', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('returns 503 when the user store is not configured', async () => {
    const { isZaolyUserStoreAvailable } = await import('../lib/users/user-store')
    vi.mocked(isZaolyUserStoreAvailable).mockReturnValue(false)
    const { requireAdminUser } = await import('../lib/users/require-admin')
    const res = await requireAdminUser()
    expect(res).toBeInstanceOf(Response)
    if (res instanceof Response) {
      expect(res.status).toBe(503)
      expect(await res.json()).toEqual({ error: 'auth_not_configured' })
    }
  })

  it('returns 403 when the session user is not admin', async () => {
    const { auth } = await import('../auth')
    const store = await import('../lib/users/user-store')
    const audit = await import('../lib/users/admin-audit')
    vi.mocked(store.isZaolyUserStoreAvailable).mockReturnValue(true)
    vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as never)
    vi.mocked(store.getUserById).mockResolvedValue({
      id: 'u1',
      email: 'm@example.com',
      name: 'Member',
      role: 'member',
      disabled: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
    })
    const { requireAdminUser } = await import('../lib/users/require-admin')
    const res = await requireAdminUser()
    expect(res).toBeInstanceOf(Response)
    if (res instanceof Response) {
      expect(res.status).toBe(403)
      expect(await res.json()).toEqual({ error: 'forbidden' })
    }
    expect(audit.voidRecordAdminAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'auth.denied',
        actorUserId: 'u1',
        meta: { reason: 'forbidden', gate: 'admin' },
      }),
    )
  })

  it('blocks mutations while impersonating and audits denied', async () => {
    const { NextResponse } = await import('next/server')
    const { auth } = await import('../auth')
    const store = await import('../lib/users/user-store')
    const audit = await import('../lib/users/admin-audit')
    const imp = await import('../lib/users/impersonation')
    vi.mocked(store.isZaolyUserStoreAvailable).mockReturnValue(true)
    vi.mocked(auth).mockResolvedValue({ user: { id: 'pa1' } } as never)
    vi.mocked(imp.readImpersonation).mockResolvedValue({
      targetUserId: 'u1',
      actorUserId: 'pa1',
      exp: Math.floor(Date.now() / 1000) + 3600,
      reason: 'support ticket 42',
    })
    vi.mocked(store.getUserById).mockResolvedValue({
      id: 'pa1',
      email: 'pa@x',
      name: null,
      role: 'platform_admin',
      disabled: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
    })
    vi.mocked(imp.forbidIfImpersonating).mockResolvedValue(
      NextResponse.json({ error: 'impersonating' }, { status: 403 }),
    )
    const { requireAdminUserNotImpersonating } = await import(
      '../lib/users/require-admin'
    )
    const res = await requireAdminUserNotImpersonating()
    expect(res).toBeInstanceOf(Response)
    if (res instanceof Response) {
      expect(res.status).toBe(403)
      expect(await res.json()).toEqual({ error: 'impersonating' })
    }
    expect(audit.voidRecordAdminAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'auth.denied',
        actorUserId: 'pa1',
        meta: { reason: 'impersonating', gate: 'mutation_lock' },
      }),
    )
  })
})
