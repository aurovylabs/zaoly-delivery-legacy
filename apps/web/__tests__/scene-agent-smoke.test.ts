/**
 * Scene-agent smoke: the recovery loop agents must survive.
 * Spec: scene-agent-editing.md · knowledge/scene-agent-editing.md
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CompositionScene } from '@zaoly/contracts'
import {
  FEDERATION_CONTRACT_VERSION_HEADER,
  SERVICE_SECRET_HEADER,
} from '../lib/federation-contract'
import { paths } from '../lib/paths'
import {
  __resetSceneEventsForTests,
  publishSceneUpdated,
  subscribeSceneUpdated,
} from '../lib/scene/scene-events'
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

function minimalScene(id = 'scene-agent-smoke'): CompositionScene {
  return {
    id,
    name: 'Agent smoke',
    version: 1,
    root: { id: 'root', type: 'SiteStack', children: [] },
    updatedAt: '2026-09-09T10:00:00.000Z',
  }
}

function serviceHeaders(userId = 'agent-user'): Record<string, string> {
  return {
    'content-type': 'application/json',
    [SERVICE_SECRET_HEADER]: 'test-secret',
    [FEDERATION_CONTRACT_VERSION_HEADER]: paths.federationContract,
    [ACTOR_USER_ID_HEADER]: userId,
  }
}

describe('scene agent smoke (lock recovery + page recipe)', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    __resetSceneStoreForTests()
    __resetSceneEventsForTests()
    authMock.mockReset()
    process.env[paths.envServiceSecret] = 'test-secret'
    delete process.env[paths.envFederationAuthUrl]
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('recovers from stale-scene using scene.updatedAt (agent retry loop)', async () => {
    const saved = await upsertScene(minimalScene())
    const { POST } = await import('../app/api/scenes/[id]/ops/route')

    const first = await POST(
      new Request(`http://localhost/api/scenes/${saved.id}/ops`, {
        method: 'POST',
        headers: serviceHeaders(),
        body: JSON.stringify({
          baseUpdatedAt: saved.updatedAt,
          clientBatchId: 'agent-batch-1',
          ops: [
            {
              op: 'insert_child',
              parentId: 'root',
              child: {
                id: 'hero',
                type: 'SiteText',
                props: { children: 'Agent headline', role: 'h1' },
              },
            },
          ],
        }),
      }),
      { params: Promise.resolve({ id: saved.id }) },
    )
    expect(first.status).toBe(200)
    const firstBody = (await first.json()) as {
      updatedAt: string
      appliedCount: number
      scene: CompositionScene
    }
    expect(firstBody.appliedCount).toBe(1)
    expect(firstBody.updatedAt).toBeTruthy()
    expect(firstBody.updatedAt).not.toBe(saved.updatedAt)

    const stale = await POST(
      new Request(`http://localhost/api/scenes/${saved.id}/ops`, {
        method: 'POST',
        headers: serviceHeaders(),
        body: JSON.stringify({
          baseUpdatedAt: saved.updatedAt,
          clientBatchId: 'agent-batch-2-stale',
          ops: [
            {
              op: 'set_prop',
              nodeId: 'hero',
              key: 'children',
              value: 'Should not apply',
            },
          ],
        }),
      }),
      { params: Promise.resolve({ id: saved.id }) },
    )
    expect(stale.status).toBe(409)
    const staleBody = (await stale.json()) as {
      error: string
      scene: { id: string; updatedAt: string }
    }
    expect(staleBody.error).toBe('stale-scene')
    expect(staleBody.scene.updatedAt).toBe(firstBody.updatedAt)

    // Agent recovery: reuse lock from 409 body (same as MCP/Plexon turn-local lock).
    const retry = await POST(
      new Request(`http://localhost/api/scenes/${saved.id}/ops`, {
        method: 'POST',
        headers: serviceHeaders(),
        body: JSON.stringify({
          baseUpdatedAt: staleBody.scene.updatedAt,
          clientBatchId: 'agent-batch-2-retry',
          ops: [
            {
              op: 'set_prop',
              nodeId: 'hero',
              key: 'children',
              value: 'Recovered headline',
            },
          ],
        }),
      }),
      { params: Promise.resolve({ id: saved.id }) },
    )
    expect(retry.status).toBe(200)
    const retryBody = (await retry.json()) as {
      updatedAt: string
      scene: CompositionScene
    }
    const hero = retryBody.scene.root.children?.find((c) => c.id === 'hero')
    expect(hero?.props?.children).toBe('Recovered headline')
    expect(retryBody.updatedAt).not.toBe(firstBody.updatedAt)

    const reloaded = await getScene(saved.id)
    expect(reloaded?.root.children?.find((c) => c.id === 'hero')?.props?.children).toBe(
      'Recovered headline',
    )
  })

  it('supports add_page then insert under the new page root', async () => {
    const saved = await upsertScene(minimalScene())
    const { POST } = await import('../app/api/scenes/[id]/ops/route')

    const pageRes = await POST(
      new Request(`http://localhost/api/scenes/${saved.id}/ops`, {
        method: 'POST',
        headers: serviceHeaders(),
        body: JSON.stringify({
          baseUpdatedAt: saved.updatedAt,
          ops: [{ op: 'add_page', name: 'PDP' }],
        }),
      }),
      { params: Promise.resolve({ id: saved.id }) },
    )
    expect(pageRes.status).toBe(200)
    const pageBody = (await pageRes.json()) as {
      updatedAt: string
      scene: CompositionScene
    }
    expect(pageBody.scene.activePageId).toBeTruthy()
    expect(pageBody.scene.pages?.some((p) => p.name === 'PDP')).toBe(true)
    const activeRootId = pageBody.scene.root.id

    const insertRes = await POST(
      new Request(`http://localhost/api/scenes/${saved.id}/ops`, {
        method: 'POST',
        headers: serviceHeaders(),
        body: JSON.stringify({
          baseUpdatedAt: pageBody.updatedAt,
          ops: [
            {
              op: 'insert_child',
              parentId: activeRootId,
              child: {
                id: 'pdp-cta',
                type: 'SiteButton',
                props: { children: 'In den Warenkorb' },
              },
            },
          ],
        }),
      }),
      { params: Promise.resolve({ id: saved.id }) },
    )
    expect(insertRes.status).toBe(200)
    const insertBody = (await insertRes.json()) as { scene: CompositionScene }
    expect(insertBody.scene.root.children?.some((c) => c.id === 'pdp-cta')).toBe(true)
  })

  it('publishes scene-updated for SSE consumers after ops', async () => {
    const saved = await upsertScene(minimalScene('scene-sse-smoke'))
    const seen: string[] = []
    const off = subscribeSceneUpdated(saved.id, (event) => {
      seen.push(`${event.source}:${event.updatedAt}`)
    })

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
              child: { id: 'n1', type: 'SiteText', props: { children: 'Live' } },
            },
          ],
        }),
      }),
      { params: Promise.resolve({ id: saved.id }) },
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as { updatedAt: string }
    expect(seen).toEqual([`scene_ops:${body.updatedAt}`])
    off()
  })

  it('returns structured op-rejected fields for agent citation', async () => {
    const saved = await upsertScene(minimalScene('scene-reject-smoke'))
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
              child: { id: 'ok', type: 'SiteText', props: { children: 'ok' } },
            },
            { op: 'select', nodeId: 'ok' },
          ],
        }),
      }),
      { params: Promise.resolve({ id: saved.id }) },
    )
    expect(res.status).toBe(400)
    const body = (await res.json()) as {
      error: string
      failedIndex: number
      reason?: string
    }
    expect(body.error).toBe('op-not-persisted')
    expect(body.failedIndex).toBe(1)
    expect(typeof body.reason === 'string' || body.reason === undefined).toBe(true)

    // Ensure nothing partial persisted (agent must not assume half-applied UI).
    const reloaded = await getScene(saved.id)
    expect(reloaded?.root.children?.some((c) => c.id === 'ok')).toBe(false)
  })
})

describe('scene agent smoke helpers', () => {
  it('keeps publishSceneUpdated typed for import_html source', () => {
    const seen: string[] = []
    const off = subscribeSceneUpdated('s-import', (e) => seen.push(e.source))
    publishSceneUpdated({
      sceneId: 's-import',
      updatedAt: '2026-09-09T12:00:00.000Z',
      platformProjectId: null,
      source: 'scene_import_html',
    })
    expect(seen).toEqual(['scene_import_html'])
    off()
  })
})
