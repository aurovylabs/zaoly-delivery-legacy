import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextResponse } from 'next/server'

vi.mock('../lib/users/require-admin', () => ({
  requireAdminUser: vi.fn(),
  isAdminUser: (v: unknown) =>
    Boolean(v && typeof v === 'object' && 'user' in (v as object)),
}))

vi.mock('../lib/users/user-store', () => ({
  isZaolyUserStoreAvailable: vi.fn(() => true),
}))

vi.mock('../lib/users/admin-audit', () => ({
  listAdminAudit: vi.fn(async () => ({
    events: [
      {
        id: 'e1',
        at: '2026-10-09T12:00:00.000Z',
        actorUserId: 'a1',
        actorEmail: 'admin@x',
        action: 'user.invite',
        targetUserId: null,
        meta: { email: 'new@x' },
      },
    ],
    nextCursor: null,
  })),
}))

describe('GET /api/admin/audit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns audit events for admins', async () => {
    const { requireAdminUser } = await import('../lib/users/require-admin')
    vi.mocked(requireAdminUser).mockResolvedValue({
      user: { id: 'a1', email: 'admin@x', role: 'admin' },
    } as never)

    const { GET } = await import('../app/api/admin/audit/route')
    const res = await GET(new Request('http://local/api/admin/audit'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.events).toHaveLength(1)
    expect(body.events[0].action).toBe('user.invite')
  })

  it('rejects non-admins', async () => {
    const { requireAdminUser } = await import('../lib/users/require-admin')
    vi.mocked(requireAdminUser).mockResolvedValue(
      NextResponse.json({ error: 'forbidden' }, { status: 403 }) as never,
    )
    const { GET } = await import('../app/api/admin/audit/route')
    const res = await GET(new Request('http://local/api/admin/audit'))
    expect(res.status).toBe(403)
  })
})
