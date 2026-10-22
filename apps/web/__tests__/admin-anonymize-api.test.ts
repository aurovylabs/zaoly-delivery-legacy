import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextResponse } from 'next/server'

vi.mock('../lib/users/require-admin', () => ({
  requirePlatformAdminUserNotImpersonating: vi.fn(),
  isAdminUser: (v: unknown) =>
    Boolean(v && typeof v === 'object' && 'user' in (v as object)),
}))

vi.mock('../lib/users/user-store', () => ({
  isZaolyUserStoreAvailable: vi.fn(() => true),
  anonymizeUser: vi.fn(),
}))

vi.mock('../lib/users/admin-audit', () => ({
  voidRecordAdminAudit: vi.fn(),
}))

describe('POST /api/admin/users/:id/anonymize', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('anonymizes for platform_admin', async () => {
    const { requirePlatformAdminUserNotImpersonating } = await import(
      '../lib/users/require-admin'
    )
    const store = await import('../lib/users/user-store')
    const audit = await import('../lib/users/admin-audit')
    vi.mocked(requirePlatformAdminUserNotImpersonating).mockResolvedValue({
      user: { id: 'pa1', email: 'pa@x', role: 'platform_admin' },
    } as never)
    vi.mocked(store.anonymizeUser).mockResolvedValue({
      id: 'u1',
      email: 'anon-u1@anonymized.invalid',
      name: null,
      role: 'member',
      disabled: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      lastLoginAt: null,
    })

    const { POST } = await import('../app/api/admin/users/[id]/anonymize/route')
    const res = await POST(new Request('http://local', { method: 'POST' }), {
      params: Promise.resolve({ id: 'u1' }),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ ok: true, disabled: true })
    expect(audit.voidRecordAdminAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'user.anonymize', targetUserId: 'u1' }),
    )
  })

  it('rejects non platform_admin', async () => {
    const { requirePlatformAdminUserNotImpersonating } = await import(
      '../lib/users/require-admin'
    )
    vi.mocked(requirePlatformAdminUserNotImpersonating).mockResolvedValue(
      NextResponse.json({ error: 'platform_admin_required' }, { status: 403 }) as never,
    )
    const { POST } = await import('../app/api/admin/users/[id]/anonymize/route')
    const res = await POST(new Request('http://local', { method: 'POST' }), {
      params: Promise.resolve({ id: 'u1' }),
    })
    expect(res.status).toBe(403)
  })
})
