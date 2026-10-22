import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CompositionScene } from '@zaoly/contracts'
import {
  FEDERATION_CONTRACT_VERSION_HEADER,
  SERVICE_SECRET_HEADER,
} from '../lib/federation-contract'
import { paths } from '../lib/paths'
import { applySceneOpBatch } from '../lib/scene/apply-scene-op-batch'
import { buildEditorPaletteCatalog } from '../lib/editor-palette-catalog'
import {
  __resetSceneEventsForTests,
  encodeSceneEvent,
  encodeSceneHeartbeat,
  publishSceneUpdated,
  subscribeSceneUpdated,
} from '../lib/scene/scene-events'
import { buildSceneTreeIndex } from '../lib/scene/scene-tree-index'
import {
  __resetSceneStoreForTests,
  getScene,
  upsertScene,
} from '../lib/scene/scene-store'
import { ACTOR_USER_ID_HEADER } from '../lib/require-scene-api-access'

const authMock = vi.fn<() => Promise<{ user?: { id: string } } | null>>()

vi.mock('../auth', () => ({
  auth: () => authMock(),
}))

function minimalScene(id = 'scene-ops'): CompositionScene {
  return {
    id,
    name: 'Ops test',
    version: 1,
    root: { id: 'root', type: 'Stack', children: [] },
    updatedAt: '2026-08-23T18:00:00.000Z',
  }
}

function serviceHeaders(userId?: string): Record<string, string> {
  return {
    'content-type': 'application/json',
    [SERVICE_SECRET_HEADER]: 'test-secret',
    [FEDERATION_CONTRACT_VERSION_HEADER]: paths.federationContract,
    ...(userId ? { [ACTOR_USER_ID_HEADER]: userId } : {}),
  }
}

describe('applySceneOpBatch', () => {
  it('rejects select as op-not-persisted', () => {
    const scene = minimalScene()
    const result = applySceneOpBatch(scene, [{ op: 'select', nodeId: 'root' }])
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe('op-not-persisted')
    expect(result.failedIndex).toBe(0)
  })

  it('applies insert_child and prunes comments', () => {
    const scene = minimalScene()
    const result = applySceneOpBatch(scene, [
      {
        op: 'insert_child',
        parentId: 'root',
        child: { id: 'hero-text', type: 'Text', props: { children: 'Hello' } },
      },
    ])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.appliedCount).toBe(1)
    expect(result.scene.root.children?.some((c) => c.id === 'hero-text')).toBe(true)
  })

  it('seeds palette defaults on insert_child when props omitted', () => {
    const scene = minimalScene()
    const result = applySceneOpBatch(scene, [
      {
        op: 'insert_child',
        parentId: 'root',
        child: { id: 'cta-1', type: 'SiteButton' },
      },
    ])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const node = result.scene.root.children?.find((c) => c.id === 'cta-1')
    expect(node?.type).toBe('SiteButton')
    expect(node?.props?.children).toBeTruthy()
  })

  it('overrides seed props when insert_child provides props', () => {
    const scene = minimalScene()
    const result = applySceneOpBatch(scene, [
      {
        op: 'insert_child',
        parentId: 'root',
        child: {
          id: 'cta-2',
          type: 'SiteButton',
          props: { children: 'In den Warenkorb' },
        },
      },
    ])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const node = result.scene.root.children?.find((c) => c.id === 'cta-2')
    expect(node?.props?.children).toBe('In den Warenkorb')
  })

  it('applies props as instanceOverrides on insert_instance', () => {
    const scene = minimalScene()
    const withMaster: CompositionScene = {
      ...scene,
      masters: [
        {
          id: 'master-btn',
          name: 'Button',
          sourceKey: 'SiteButton',
          root: {
            id: 'master-btn-root',
            type: 'SiteButton',
            props: { children: 'Get started' },
          },
        },
      ],
    }
    const result = applySceneOpBatch(withMaster, [
      {
        op: 'insert_instance',
        masterId: 'master-btn',
        parentId: 'root',
        props: { children: 'In den Warenkorb' },
      },
    ])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const inst = result.scene.root.children?.find((c) => c.instanceOf === 'master-btn')
    expect(inst).toBeDefined()
    expect(inst?.instanceOverrides?.props?.children).toBe('In den Warenkorb')
  })
})

describe('buildSceneTreeIndex', () => {
  it('nodeCount matches nodes length for active page', () => {
    const scene = minimalScene()
    const withChild: CompositionScene = {
      ...scene,
      root: {
        id: 'root',
        type: 'Stack',
        children: [{ id: 'child-a', type: 'Text', props: { children: 'A' } }],
      },
    }
    const index = buildSceneTreeIndex(withChild)
    expect(index.nodeCount).toBe(index.nodes.length)
    expect(index.nodes.map((n) => n.id)).toEqual(['root', 'child-a'])
  })
})

describe('buildEditorPaletteCatalog', () => {
  it('includes site-kit group derived from palette sources', () => {
    const catalog = buildEditorPaletteCatalog()
    const siteKit = catalog.groups.find((g) => g.id === 'site-kit')
    expect(siteKit).toBeDefined()
    expect(siteKit!.types.some((t) => t.type === 'SiteStack' && t.siteKit)).toBe(true)
    expect(catalog.wrapContainerTypes).toContain('Stack')
  })

  it('omits print palette group on Zaoly web design', () => {
    const catalog = buildEditorPaletteCatalog()
    expect(catalog.groups.some((g) => g.id === 'print')).toBe(false)
  })

  it('exposes seedProps and contentHint for Site Kit content types', () => {
    const catalog = buildEditorPaletteCatalog()
    const siteKit = catalog.groups.find((g) => g.id === 'site-kit')
    const button = siteKit?.types.find((t) => t.type === 'SiteButton')
    const select = siteKit?.types.find((t) => t.type === 'SiteSelect')
    expect(button?.seedProps?.children).toBeTruthy()
    expect(button?.contentHint).toMatch(/children/i)
    expect(select?.seedProps?.options).toBeTruthy()
    expect(select?.contentHint).toMatch(/options/i)
  })
})

describe('scene live events', () => {
  it('publishes scene-updated events to scene subscribers only', () => {
    const seen: string[] = []
    const offA = subscribeSceneUpdated('scene-a', (event) => {
      if (event.type !== 'scene-updated') return
      seen.push(`${event.sceneId}:${event.updatedAt}`)
    })
    subscribeSceneUpdated('scene-b', () => {
      seen.push('wrong-scene')
    })
    publishSceneUpdated({
      sceneId: 'scene-a',
      updatedAt: '2026-08-24T09:00:00.000Z',
      platformProjectId: null,
      source: 'scene_ops',
    })
    offA()
    publishSceneUpdated({
      sceneId: 'scene-a',
      updatedAt: '2026-08-24T09:00:01.000Z',
      platformProjectId: null,
      source: 'scene_ops',
    })
    expect(seen).toEqual(['scene-a:2026-08-24T09:00:00.000Z'])
  })

  it('encodes heartbeat and scene events as SSE frames', () => {
    expect(encodeSceneHeartbeat(123)).toContain('"ts":123')
    expect(
      encodeSceneEvent({
        type: 'scene-updated',
        sceneId: 'scene-a',
        updatedAt: '2026-08-24T09:00:00.000Z',
        platformProjectId: null,
        source: 'scene_put',
      }),
    ).toContain('event: scene-updated')
  })
})

describe('Scene ops API (P90)', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    __resetSceneStoreForTests({ durable: false, wipeDisk: true })
    __resetSceneEventsForTests()
    authMock.mockReset()
    delete process.env[paths.envFederationAuthUrl]
    delete process.env[paths.envServiceSecret]
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('POST /api/scenes/:id/ops applies batch atomically', async () => {
    const saved = await upsertScene(minimalScene())
    authMock.mockResolvedValue({ user: { id: 'user-1' } })
    const { POST } = await import('../app/api/scenes/[id]/ops/route')
    const res = await POST(
      new Request(`http://localhost/api/scenes/${saved.id}/ops`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          baseUpdatedAt: saved.updatedAt,
          ops: [
            {
              op: 'insert_child',
              parentId: 'root',
              child: { id: 'cta', type: 'Button', props: { variant: 'primary' } },
            },
          ],
        }),
      }),
      { params: Promise.resolve({ id: saved.id }) },
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      appliedCount: number
      scene: CompositionScene
      updatedAt: string
    }
    expect(body.appliedCount).toBe(1)
    expect(body.scene.root.children?.some((c) => c.id === 'cta')).toBe(true)
    expect(body.updatedAt).toBe(body.scene.updatedAt)

    const reloaded = await getScene(saved.id)
    expect(reloaded?.root.children?.some((c) => c.id === 'cta')).toBe(true)
  })

  it('POST /api/scenes/:id/ops returns stale-scene on lock mismatch', async () => {
    const saved = await upsertScene(minimalScene())
    authMock.mockResolvedValue({ user: { id: 'user-1' } })
    const { POST } = await import('../app/api/scenes/[id]/ops/route')
    const res = await POST(
      new Request(`http://localhost/api/scenes/${saved.id}/ops`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          baseUpdatedAt: '2020-01-01T00:00:00.000Z',
          ops: [
            {
              op: 'insert_child',
              parentId: 'root',
              child: { id: 'stale', type: 'Text', props: { children: 'x' } },
            },
          ],
        }),
      }),
      { params: Promise.resolve({ id: saved.id }) },
    )
    expect(res.status).toBe(409)
    const body = (await res.json()) as { error: string; scene: { id: string; updatedAt: string } }
    expect(body.error).toBe('stale-scene')
    expect(body.scene.updatedAt).toBe(saved.updatedAt)
  })

  it('POST /api/scenes/:id/ops does not persist partial batch on failure', async () => {
    const saved = await upsertScene(minimalScene())
    authMock.mockResolvedValue({ user: { id: 'user-1' } })
    const { POST } = await import('../app/api/scenes/[id]/ops/route')
    const res = await POST(
      new Request(`http://localhost/api/scenes/${saved.id}/ops`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          baseUpdatedAt: saved.updatedAt,
          ops: [
            {
              op: 'insert_child',
              parentId: 'root',
              child: { id: 'ok-node', type: 'Text', props: { children: 'ok' } },
            },
            { op: 'select', nodeId: 'ok-node' },
          ],
        }),
      }),
      { params: Promise.resolve({ id: saved.id }) },
    )
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: string; failedIndex: number }
    expect(body.error).toBe('op-not-persisted')
    expect(body.failedIndex).toBe(1)

    const reloaded = await getScene(saved.id)
    expect(reloaded?.root.children?.some((c) => c.id === 'ok-node')).toBe(false)
  })

  it('POST /api/scenes/:id/ops requires baseUpdatedAt', async () => {
    const saved = await upsertScene(minimalScene())
    authMock.mockResolvedValue({ user: { id: 'user-1' } })
    const { POST } = await import('../app/api/scenes/[id]/ops/route')
    const res = await POST(
      new Request(`http://localhost/api/scenes/${saved.id}/ops`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ops: [{ op: 'select', nodeId: 'root' }],
        }),
      }),
      { params: Promise.resolve({ id: saved.id }) },
    )
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('missing-base-updated-at')
  })

  it('GET /api/scenes/:id/tree returns structural index', async () => {
    const saved = await upsertScene({
      ...minimalScene(),
      root: {
        id: 'root',
        type: 'Stack',
        children: [{ id: 'leaf', type: 'Text', props: { children: 'Hi' } }],
      },
    })
    authMock.mockResolvedValue({ user: { id: 'user-1' } })
    const { GET } = await import('../app/api/scenes/[id]/tree/route')
    const res = await GET(new Request(`http://localhost/api/scenes/${saved.id}/tree`), {
      params: Promise.resolve({ id: saved.id }),
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { nodeCount: number; nodes: unknown[] }
    expect(body.nodeCount).toBe(body.nodes.length)
    expect(body.nodes).toHaveLength(2)
  })

  it('GET /api/editor/palette returns catalog', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } })
    const { GET } = await import('../app/api/editor/palette/route')
    const res = await GET(new Request('http://localhost/api/editor/palette'))
    expect(res.status).toBe(200)
    const body = (await res.json()) as { groups: Array<{ id: string }> }
    expect(body.groups.some((g) => g.id === 'site-kit')).toBe(true)
  })

  it('GET /api/scenes/:id/events returns SSE and streams scene-updated', async () => {
    const saved = await upsertScene(minimalScene('scene-events'))
    authMock.mockResolvedValue({ user: { id: 'user-1' } })
    const { GET } = await import('../app/api/scenes/[id]/events/route')
    const res = await GET(
      new Request(`http://localhost/api/scenes/${saved.id}/events`),
      { params: Promise.resolve({ id: saved.id }) },
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/event-stream')
    const reader = res.body?.getReader()
    expect(reader).toBeTruthy()
    const decoder = new TextDecoder()
    let combined = ''
    // Heartbeat is sync; presence snapshot + subscribe are async — wait before publish.
    for (let i = 0; i < 4 && !combined.includes('event: presence-updated'); i++) {
      const chunk = await reader!.read()
      combined += decoder.decode(chunk.value ?? new Uint8Array())
    }
    expect(combined).toContain('event: heartbeat')
    publishSceneUpdated({
      sceneId: saved.id,
      updatedAt: '2026-08-24T09:00:00.000Z',
      platformProjectId: null,
      source: 'scene_ops',
    })
    for (let i = 0; i < 6 && !combined.includes('event: scene-updated'); i++) {
      const chunk = await reader!.read()
      combined += decoder.decode(chunk.value ?? new Uint8Array())
    }
    expect(combined).toContain('event: scene-updated')
    expect(combined).toContain(`"sceneId":"${saved.id}"`)
    await reader!.cancel()
  })

  it('PUT /api/scenes/:id requires baseUpdatedAt', async () => {
    const saved = await upsertScene(minimalScene())
    authMock.mockResolvedValue({ user: { id: 'user-1' } })
    const { PUT } = await import('../app/api/scenes/[id]/route')
    const res = await PUT(
      new Request(`http://localhost/api/scenes/${saved.id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(saved),
      }),
      { params: Promise.resolve({ id: saved.id }) },
    )
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('missing-base-updated-at')
  })

  it('PUT /api/scenes/:id returns stale-scene on lock mismatch', async () => {
    const saved = await upsertScene(minimalScene())
    authMock.mockResolvedValue({ user: { id: 'user-1' } })
    const { PUT } = await import('../app/api/scenes/[id]/route')
    const res = await PUT(
      new Request(`http://localhost/api/scenes/${saved.id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...saved,
          name: 'Changed',
          baseUpdatedAt: '2020-01-01T00:00:00.000Z',
        }),
      }),
      { params: Promise.resolve({ id: saved.id }) },
    )
    expect(res.status).toBe(409)
    const body = (await res.json()) as { error: string; scene: { id: string; updatedAt: string } }
    expect(body.error).toBe('stale-scene')
    expect(body.scene.updatedAt).toBe(saved.updatedAt)

    const reloaded = await getScene(saved.id)
    expect(reloaded?.name).toBe('Ops test')
  })

  it('PUT /api/scenes/:id upserts when baseUpdatedAt matches', async () => {
    const saved = await upsertScene(minimalScene())
    authMock.mockResolvedValue({ user: { id: 'user-1' } })
    const { PUT } = await import('../app/api/scenes/[id]/route')
    const res = await PUT(
      new Request(`http://localhost/api/scenes/${saved.id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...saved,
          name: 'Updated name',
          baseUpdatedAt: saved.updatedAt,
        }),
      }),
      { params: Promise.resolve({ id: saved.id }) },
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as { scene: CompositionScene }
    expect(body.scene.name).toBe('Updated name')
    expect(Date.parse(body.scene.updatedAt)).toBeGreaterThanOrEqual(Date.parse(saved.updatedAt))
  })

  describe('service auth when Plexon configured', () => {
    beforeEach(() => {
      vi.stubEnv(paths.envFederationAuthUrl, 'https://plexon.test')
      vi.stubEnv(paths.envServiceSecret, 'test-secret')
      vi.stubEnv(paths.envAuthBypass, '0')
    })

    it('POST /api/scenes/:id/ops accepts service secret with actor', async () => {
      const saved = await upsertScene({
        ...minimalScene('scene-ops-svc'),
        ownerUserId: 'svc-user-1',
      })
      authMock.mockResolvedValue(null)
      const { POST } = await import('../app/api/scenes/[id]/ops/route')
      const res = await POST(
        new Request(`http://localhost/api/scenes/${saved.id}/ops`, {
          method: 'POST',
          headers: serviceHeaders('svc-user-1'),
          body: JSON.stringify({
            baseUpdatedAt: saved.updatedAt,
            ops: [
              {
                op: 'insert_child',
                parentId: 'root',
                child: { id: 'svc-node', type: 'Text', props: { children: 'svc' } },
              },
            ],
          }),
        }),
        { params: Promise.resolve({ id: saved.id }) },
      )
      expect(res.status).toBe(200)
    })

    it('POST /api/scenes/:id/ops returns actor-required without X-Actor-User-Id', async () => {
      const saved = await upsertScene(minimalScene())
      authMock.mockResolvedValue(null)
      const { POST } = await import('../app/api/scenes/[id]/ops/route')
      const res = await POST(
        new Request(`http://localhost/api/scenes/${saved.id}/ops`, {
          method: 'POST',
          headers: serviceHeaders(),
          body: JSON.stringify({
            baseUpdatedAt: saved.updatedAt,
            ops: [
              {
                op: 'insert_child',
                parentId: 'root',
                child: { id: 'svc-node', type: 'Text', props: { children: 'svc' } },
              },
            ],
          }),
        }),
        { params: Promise.resolve({ id: saved.id }) },
      )
      expect(res.status).toBe(401)
      expect((await res.json()).error).toBe('actor-required')
    })
  })
})
