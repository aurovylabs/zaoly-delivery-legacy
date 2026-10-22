import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextResponse } from 'next/server'

vi.mock('../lib/users/require-admin', () => ({
  requireAdminUser: vi.fn(),
  isAdminUser: (v: unknown) =>
    Boolean(v && typeof v === 'object' && 'user' in (v as object)),
}))

vi.mock('../lib/users/user-store', () => ({
  isZaolyUserStoreAvailable: vi.fn(() => true),
  countUsersBreakdown: vi.fn(async () => ({
    total: 4,
    admins: 1,
    members: 2,
    disabled: 1,
  })),
}))

vi.mock('../lib/mail/system-mail', () => ({
  getSmtpStatus: vi.fn(async () => ({
    configured: true,
    source: 'env',
    managed: true,
    host: 'mail.zaoly.app',
    port: 587,
    user: null,
    from: 'noreply@zaoly.app',
    fromName: 'Zaoly',
    tls: 'starttls',
    passwordSet: true,
    dbEnabled: false,
  })),
}))

vi.mock('../lib/mail/smtp-config', () => ({
  isSmtpManagedByHost: vi.fn(() => true),
}))

vi.mock('../lib/runtime-config', () => ({
  isPublicSignupEnabled: vi.fn(() => true),
}))

vi.mock('../lib/scene/scene-store', () => ({
  sceneStoreBackend: vi.fn(() => 'postgres'),
}))

vi.mock('../lib/users/impersonation', () => ({
  isImpersonationEnabled: vi.fn(() => false),
}))

describe('GET /api/admin/overview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns directory + instance status for admins', async () => {
    const { requireAdminUser } = await import('../lib/users/require-admin')
    vi.mocked(requireAdminUser).mockResolvedValue({
      user: { id: 'a1', email: 'a@x', role: 'admin' },
    } as never)

    const { GET } = await import('../app/api/admin/overview/route')
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({
      userCounts: { total: 4, admins: 1, members: 2, disabled: 1 },
      publicSignup: true,
      smtp: { configured: true, managed: true },
      sceneStore: 'postgres',
      impersonationEnabled: false,
    })
  })

  it('rejects non-admins', async () => {
    const { requireAdminUser } = await import('../lib/users/require-admin')
    vi.mocked(requireAdminUser).mockResolvedValue(
      NextResponse.json({ error: 'forbidden' }, { status: 403 }) as never,
    )

    const { GET } = await import('../app/api/admin/overview/route')
    const res = await GET()
    expect(res.status).toBe(403)
  })
})
