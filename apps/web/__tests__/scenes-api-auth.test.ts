import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CompositionScene } from '@zaoly/contracts'
import { paths } from '../lib/paths'
import { __resetSceneStoreForTests, upsertScene } from '../lib/scene/scene-store'
import {
  __resetProjectStoreForTests,
  createProject,
} from '../lib/fixtures/project-store'

const authMock = vi.fn<() => Promise<{ user?: { id: string } } | null>>()

vi.mock('../auth', () => ({
  auth: () => authMock(),
}))

vi.mock('../lib/users/user-store', () => ({
  getSceneMemberRole: vi.fn(async () => null),
  listSceneMemberUserIds: vi.fn(async () => []),
}))

function minimalScene(
  id = 'scene-auth',
  extras: Partial<CompositionScene> = {},
): CompositionScene {
  return {
    id,
    name: 'Auth test',
    version: 1,
    root: { id: 'root', type: 'Stack', children: [] },
    updatedAt: new Date().toISOString(),
    ...extras,
  }
}

describe('Scenes API auth (WS-1)', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    __resetSceneStoreForTests({ durable: false })
    __resetProjectStoreForTests()
    authMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('when local user store is required', () => {
    beforeEach(() => {
      vi.stubEnv(paths.envAuthBypass, '0')
    })

    it('POST /api/scenes returns 401 without session', async () => {
      authMock.mockResolvedValue(null)
      const { POST } = await import('../app/api/scenes/route')
      const res = await POST(
        new Request('http://localhost/api/scenes', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(minimalScene()),
        }),
      )
      expect(res.status).toBe(401)
    })

    it('GET /api/scenes returns 401 without session', async () => {
      authMock.mockResolvedValue(null)
      const { GET } = await import('../app/api/scenes/route')
      const res = await GET(new Request('http://localhost/api/scenes'))
      expect(res.status).toBe(401)
      expect(await res.json()).toEqual({ error: 'unauthorized' })
    })

    it('GET /api/scenes/:id returns 401 without session (not 404)', async () => {
      authMock.mockResolvedValue(null)
      const { GET } = await import('../app/api/scenes/[id]/route')
      const res = await GET(new Request('http://localhost/api/scenes/missing'), {
        params: Promise.resolve({ id: 'missing' }),
      })
      expect(res.status).toBe(401)
    })

    it('PUT /api/scenes/:id returns 401 without session', async () => {
      authMock.mockResolvedValue(null)
      const { PUT } = await import('../app/api/scenes/[id]/route')
      const res = await PUT(
        new Request('http://localhost/api/scenes/scene-auth', {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(minimalScene()),
        }),
        { params: Promise.resolve({ id: 'scene-auth' }) },
      )
      expect(res.status).toBe(401)
    })

    it('PATCH /api/scenes/:id returns 401 without session', async () => {
      authMock.mockResolvedValue(null)
      const { PATCH } = await import('../app/api/scenes/[id]/route')
      const res = await PATCH(
        new Request('http://localhost/api/scenes/scene-auth', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ platformProjectId: 'plx-local-demo' }),
        }),
        { params: Promise.resolve({ id: 'scene-auth' }) },
      )
      expect(res.status).toBe(401)
    })

    it('DELETE /api/scenes/:id returns 401 without session', async () => {
      authMock.mockResolvedValue(null)
      const { DELETE } = await import('../app/api/scenes/[id]/route')
      const res = await DELETE(
        new Request('http://localhost/api/scenes/scene-auth', { method: 'DELETE' }),
        { params: Promise.resolve({ id: 'scene-auth' }) },
      )
      expect(res.status).toBe(401)
    })

    it('POST /api/scenes/:id/pdf returns 410 Gone (print out of scope)', async () => {
      authMock.mockResolvedValue(null)
      const { POST } = await import('../app/api/scenes/[id]/pdf/route')
      const res = await POST(
        new Request('http://localhost/api/scenes/scene-auth/pdf', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ scene: minimalScene() }),
        }),
        { params: Promise.resolve({ id: 'scene-auth' }) },
      )
      expect(res.status).toBe(410)
      const body = (await res.json()) as { error: string }
      expect(body.error).toBe('print_out_of_scope')
    })

    it('POST /api/scenes/:id/export returns 401 without session', async () => {
      authMock.mockResolvedValue(null)
      const { POST } = await import('../app/api/scenes/[id]/export/route')
      const res = await POST(
        new Request('http://localhost/api/scenes/scene-auth/export', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ scene: minimalScene(), format: 'png' }),
        }),
        { params: Promise.resolve({ id: 'scene-auth' }) },
      )
      expect(res.status).toBe(401)
    })

    it('GET /api/scenes succeeds with session', async () => {
      authMock.mockResolvedValue({ user: { id: 'user-1' } })
      const { GET } = await import('../app/api/scenes/route')
      const res = await GET(new Request('http://localhost/api/scenes'))
      expect(res.status).toBe(200)
      const body = (await res.json()) as { scenes: unknown[] }
      expect(Array.isArray(body.scenes)).toBe(true)
    })

    it('POST /api/scenes/:id/ops returns 401 without session or service auth', async () => {
      authMock.mockResolvedValue(null)
      const { POST } = await import('../app/api/scenes/[id]/ops/route')
      const res = await POST(
        new Request('http://localhost/api/scenes/scene-auth/ops', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            baseUpdatedAt: new Date().toISOString(),
            ops: [{ op: 'select', nodeId: 'root' }],
          }),
        }),
        { params: Promise.resolve({ id: 'scene-auth' }) },
      )
      expect(res.status).toBe(401)
    })

    it('GET /api/scenes/:id/tree returns 401 without session (not 404)', async () => {
      authMock.mockResolvedValue(null)
      const { GET } = await import('../app/api/scenes/[id]/tree/route')
      const res = await GET(new Request('http://localhost/api/scenes/missing/tree'), {
        params: Promise.resolve({ id: 'missing' }),
      })
      expect(res.status).toBe(401)
    })

    it('GET /api/editor/palette returns 401 without session when auth is on', async () => {
      authMock.mockResolvedValue(null)
      const { GET } = await import('../app/api/editor/palette/route')
      const res = await GET(new Request('http://localhost/api/editor/palette'))
      expect(res.status).toBe(401)
    })

    it('GET /api/scenes/:id returns 403 when the viewer is not owner or member', async () => {
      const scene = await upsertScene(
        minimalScene('scene-acl-forbid', {
          ownerUserId: 'owner-1',
        }),
      )
      authMock.mockResolvedValue({ user: { id: 'stranger' } })
      const { GET } = await import('../app/api/scenes/[id]/route')
      const res = await GET(new Request(`http://localhost/api/scenes/${scene.id}`), {
        params: Promise.resolve({ id: scene.id }),
      })
      expect(res.status).toBe(403)
      expect(await res.json()).toEqual({ error: 'forbidden' })
    })

    it('GET /api/scenes/:id returns 200 for the owner', async () => {
      const scene = await upsertScene(
        minimalScene('scene-acl-ok', {
          ownerUserId: 'owner-1',
        }),
      )
      authMock.mockResolvedValue({ user: { id: 'owner-1' } })
      const { GET } = await import('../app/api/scenes/[id]/route')
      const res = await GET(new Request(`http://localhost/api/scenes/${scene.id}`), {
        params: Promise.resolve({ id: scene.id }),
      })
      expect(res.status).toBe(200)
      const body = (await res.json()) as { scene: CompositionScene }
      expect(body.scene.id).toBe(scene.id)
    })

    it('GET /api/scenes lists owned scenes only (no members mocked)', async () => {
      await upsertScene(
        minimalScene('scene-list-mine', { ownerUserId: 'user-1' }),
      )
      await upsertScene(
        minimalScene('scene-list-theirs', { ownerUserId: 'user-2' }),
      )
      await upsertScene(minimalScene('scene-list-unbound'))

      authMock.mockResolvedValue({ user: { id: 'user-1' } })
      const { GET } = await import('../app/api/scenes/route')
      const res = await GET(new Request('http://localhost/api/scenes'))
      expect(res.status).toBe(200)
      const body = (await res.json()) as { scenes: CompositionScene[] }
      const ids = body.scenes.map((s) => s.id)
      expect(ids).toContain('scene-list-mine')
      expect(ids).not.toContain('scene-list-theirs')
      expect(ids).toContain('scene-list-unbound')
    })

    it('GET /api/scenes/:id allows orphan scenes (claimable) when bypass is off', async () => {
      const scene = await upsertScene(minimalScene('scene-unbound-id'))
      authMock.mockResolvedValue({ user: { id: 'user-1' } })
      const { GET } = await import('../app/api/scenes/[id]/route')
      const res = await GET(new Request(`http://localhost/api/scenes/${scene.id}`), {
        params: Promise.resolve({ id: scene.id }),
      })
      expect(res.status).toBe(200)
      const body = (await res.json()) as { scene: CompositionScene }
      expect(body.scene.id).toBe(scene.id)
    })

    it('GET /api/scenes?platformProjectId= returns 403 for inaccessible Collection', async () => {
      await createProject({
        name: 'Secret',
        platformProjectId: 'plx-list-secret',
        ownerUserId: 'user-2',
      })
      authMock.mockResolvedValue({ user: { id: 'user-1' } })
      const { GET } = await import('../app/api/scenes/route')
      const res = await GET(
        new Request('http://localhost/api/scenes?platformProjectId=plx-list-secret'),
      )
      expect(res.status).toBe(403)
    })
  })

  describe('local auth bypass (ZAOLY_AUTH_BYPASS)', () => {
    it('GET /api/scenes remains open without session when bypass is set', async () => {
      authMock.mockResolvedValue(null)
      delete process.env[paths.envFederationAuthUrl]
      delete process.env[paths.envServiceSecret]
      vi.stubEnv(paths.envAuthBypass, '1')
      const { GET } = await import('../app/api/scenes/route')
      const res = await GET(new Request('http://localhost/api/scenes'))
      expect(res.status).toBe(200)
    })

    it('GET /api/scenes returns 401 when auth bypass is off', async () => {
      authMock.mockResolvedValue(null)
      delete process.env[paths.envFederationAuthUrl]
      delete process.env[paths.envServiceSecret]
      vi.stubEnv(paths.envAuthBypass, '0')
      const { GET } = await import('../app/api/scenes/route')
      const res = await GET(new Request('http://localhost/api/scenes'))
      expect(res.status).toBe(401)
      expect(await res.json()).toEqual({ error: 'unauthorized' })
    })

    it('ignores ZAOLY_AUTH_BYPASS in production', async () => {
      authMock.mockResolvedValue(null)
      delete process.env[paths.envFederationAuthUrl]
      delete process.env[paths.envServiceSecret]
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv(paths.envAuthBypass, '1')
      vi.resetModules()
      const { GET } = await import('../app/api/scenes/route')
      const res = await GET(new Request('http://localhost/api/scenes'))
      expect(res.status).toBe(401)
      expect(await res.json()).toEqual({ error: 'unauthorized' })
    })
  })
})
