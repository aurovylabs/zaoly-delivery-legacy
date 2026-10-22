import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from '../app/api/storyblok/push/route'

vi.mock('../lib/require-scene-api-access', () => ({
  isSceneApiAccess: (v: unknown) => Boolean(v && typeof v === 'object' && 'ok' in (v as object)),
  requireSceneApiAccess: vi.fn(async () => ({ ok: true, mode: 'session', userId: 'u1' })),
}))

vi.mock('../lib/codegen/storyblok-config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/codegen/storyblok-config')>()
  return {
    ...actual,
    resolveStoryblokPushConfig: vi.fn(),
  }
})

vi.mock('../lib/codegen/storyblok-push', () => ({
  pushStoryblokHandoffPack: vi.fn(),
}))

import { resolveStoryblokPushConfig } from '../lib/codegen/storyblok-config'
import { pushStoryblokHandoffPack } from '../lib/codegen/storyblok-push'

const pack = {
  meta: {
    generator: 'zaoly-storyblok-poc',
    collectionId: null,
    sceneId: 's1',
    tokenPackNote: 'n',
    docs: { knowledge: 'k', storyObject: 's', componentObject: 'c' },
  },
  story: {
    name: 'PoC',
    slug: 'creation-poc',
    content: { _uid: 'p', component: 'creation_page', body: [] },
  },
  components: [
    {
      name: 'creation_page',
      is_nestable: false,
      is_root: true,
      schema: { body: { type: 'bloks' as const, pos: 0 } },
    },
  ],
}

describe('GET /api/storyblok/push', () => {
  beforeEach(() => {
    vi.mocked(resolveStoryblokPushConfig).mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('reports configured false when env is missing', async () => {
    vi.mocked(resolveStoryblokPushConfig).mockReturnValue({
      ok: false,
      code: 'storyblok_not_configured',
      missing: ['STORYBLOK_SPACE_ID'],
    })
    const res = await GET(new Request('http://localhost/api/storyblok/push', { method: 'GET' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ configured: false })
  })

  it('reports configured true when env is set', async () => {
    vi.mocked(resolveStoryblokPushConfig).mockReturnValue({
      ok: true,
      config: {
        spaceId: '1',
        managementToken: 'pat',
        apiBase: 'https://mapi.example.test/v1',
      },
    })
    const res = await GET(new Request('http://localhost/api/storyblok/push', { method: 'GET' }))
    expect(await res.json()).toEqual({ configured: true })
  })
})

describe('POST /api/storyblok/push', () => {
  beforeEach(() => {
    vi.mocked(resolveStoryblokPushConfig).mockReset()
    vi.mocked(pushStoryblokHandoffPack).mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns 503 when Storyblok env is missing', async () => {
    vi.mocked(resolveStoryblokPushConfig).mockReturnValue({
      ok: false,
      code: 'storyblok_not_configured',
      missing: ['STORYBLOK_SPACE_ID'],
    })
    const res = await POST(
      new Request('http://localhost/api/storyblok/push', {
        method: 'POST',
        body: JSON.stringify({ pack }),
      }),
    )
    expect(res.status).toBe(503)
    const json = await res.json()
    expect(json.code).toBe('storyblok_not_configured')
  })

  it('pushes a valid pack and returns appUrl', async () => {
    vi.mocked(resolveStoryblokPushConfig).mockReturnValue({
      ok: true,
      config: {
        spaceId: '295221203655086',
        managementToken: 'pat-test',
        apiBase: 'https://mapi.example.test/v1',
      },
    })
    vi.mocked(pushStoryblokHandoffPack).mockResolvedValue({
      componentsCreated: ['creation_page'],
      componentsUpdated: [],
      componentsSkipped: [],
      storyId: 42,
      storySlug: 'creation-poc',
      storyAction: 'created',
      appUrl: 'https://app.storyblok.com/#/me/spaces/295221203655086/stories/0/0/42',
    })

    const res = await POST(
      new Request('http://localhost/api/storyblok/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack }),
      }),
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.storyId).toBe(42)
    expect(json.appUrl).toContain('/stories/0/0/42')
    expect(pushStoryblokHandoffPack).toHaveBeenCalledOnce()
  })

  it('rejects invalid packs', async () => {
    vi.mocked(resolveStoryblokPushConfig).mockReturnValue({
      ok: true,
      config: { spaceId: '1', managementToken: 't' },
    })
    const res = await POST(
      new Request('http://localhost/api/storyblok/push', {
        method: 'POST',
        body: JSON.stringify({ pack: { story: {} } }),
      }),
    )
    expect(res.status).toBe(400)
  })
})
