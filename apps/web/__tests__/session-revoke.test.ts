import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/runtime-config', () => ({
  isZaolyDatabaseConfigured: vi.fn(() => true),
}))

vi.mock('../lib/users/user-store', () => ({
  isZaolyUserStoreAvailable: vi.fn(() => true),
  getUserById: vi.fn(),
  isStaffRole: (role: string) => role === 'admin' || role === 'platform_admin',
}))

describe('enforceActiveJwt', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('returns null when effective user is disabled', async () => {
    const store = await import('../lib/users/user-store')
    vi.mocked(store.getUserById).mockResolvedValue({
      id: 'u1',
      email: 'u@x',
      name: null,
      role: 'member',
      disabled: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      lastLoginAt: null,
    })
    const { enforceActiveJwt } = await import('../lib/users/session-revoke')
    await expect(enforceActiveJwt({ sub: 'u1' } as never)).resolves.toBeNull()
  })

  it('refreshes role when not impersonating', async () => {
    const store = await import('../lib/users/user-store')
    vi.mocked(store.getUserById).mockResolvedValue({
      id: 'u1',
      email: 'u@x',
      name: 'Ada',
      role: 'member',
      disabled: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      lastLoginAt: null,
    })
    const { enforceActiveJwt } = await import('../lib/users/session-revoke')
    const next = await enforceActiveJwt({
      sub: 'u1',
      email: 'old@x',
      role: 'admin',
    } as never)
    expect(next).toMatchObject({
      sub: 'u1',
      email: 'u@x',
      name: 'Ada',
      role: 'member',
    })
  })

  it('revokes when impersonation actor is no longer staff', async () => {
    const store = await import('../lib/users/user-store')
    vi.mocked(store.getUserById).mockImplementation(async (id: string) => {
      if (id === 'target') {
        return {
          id: 'target',
          email: 't@x',
          name: null,
          role: 'member',
          disabled: false,
          createdAt: '2026-01-01T00:00:00.000Z',
          lastLoginAt: null,
        }
      }
      return {
        id: 'actor',
        email: 'a@x',
        name: null,
        role: 'member',
        disabled: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        lastLoginAt: null,
      }
    })
    const { enforceActiveJwt } = await import('../lib/users/session-revoke')
    await expect(
      enforceActiveJwt({
        sub: 'target',
        actorSub: 'actor',
        impersonating: true,
      } as never),
    ).resolves.toBeNull()
  })

  it('keeps impersonation token when actor and target are active', async () => {
    const store = await import('../lib/users/user-store')
    vi.mocked(store.getUserById).mockImplementation(async (id: string) => {
      if (id === 'target') {
        return {
          id: 'target',
          email: 't@x',
          name: null,
          role: 'member',
          disabled: false,
          createdAt: '2026-01-01T00:00:00.000Z',
          lastLoginAt: null,
        }
      }
      return {
        id: 'actor',
        email: 'a@x',
        name: null,
        role: 'platform_admin',
        disabled: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        lastLoginAt: null,
      }
    })
    const { enforceActiveJwt } = await import('../lib/users/session-revoke')
    const next = await enforceActiveJwt({
      sub: 'target',
      actorSub: 'actor',
      impersonating: true,
      role: 'member',
    } as never)
    expect(next).toMatchObject({
      sub: 'target',
      actorSub: 'actor',
      impersonating: true,
    })
  })
})
