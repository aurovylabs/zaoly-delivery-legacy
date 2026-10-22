import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { paths } from '../lib/paths'
import { createDemoScene } from '../lib/scene/demo-scene'
import { __resetSceneStoreForTests, upsertScene } from '../lib/scene/scene-store'
import {
  __resetProjectStoreForTests,
  createProject,
} from '../lib/fixtures/project-store'

const authMock = vi.fn<() => Promise<{ user?: { id: string } } | null>>()

vi.mock('../auth', () => ({
  auth: () => authMock(),
}))

describe('catalog API routes', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    authMock.mockReset()
    __resetSceneStoreForTests({ durable: false })
    __resetProjectStoreForTests()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('library catalog returns fixture tags', async () => {
    const { GET } = await import('../app/api/library/catalog/route')
    const res = await GET(new Request('http://localhost/api/library/catalog'))
    expect(res.status).toBe(200)
    const body = (await res.json()) as { items: Array<{ tagName: string }> }
    expect(body.items.some((i) => i.tagName === 'ds-button')).toBe(true)
  })

  it('library catalog filters by q', async () => {
    const { GET } = await import('../app/api/library/catalog/route')
    const res = await GET(new Request('http://localhost/api/library/catalog?q=button'))
    const body = (await res.json()) as { items: Array<{ tagName: string }> }
    expect(body.items.length).toBeGreaterThan(0)
    expect(body.items.every((i) => i.tagName.includes('button'))).toBe(true)
  })

  it('compositions list returns scene-store summaries', async () => {
    vi.stubEnv(paths.envFederationAuthUrl, 'https://plexon.test')
    vi.stubEnv(paths.envServiceSecret, 'test-secret')
    vi.stubEnv(paths.envAuthBypass, '0')
    delete process.env[paths.envDatabaseUrl]

    const project = await createProject({
      name: 'Catalog Wire',
      platformProjectId: 'plx-catalog-wire-test',
      ownerUserId: 'owner-1',
    })
    const scene = createDemoScene(project.platformProjectId)
    scene.id = 'scene-catalog-wire'
    scene.name = 'Catalog Wire Scene'
    scene.ownerUserId = 'owner-1'
    await upsertScene(scene)

    authMock.mockResolvedValue({ user: { id: 'owner-1' } })
    const { GET } = await import('../app/api/compositions/route')
    const res = await GET(new Request('http://localhost/api/compositions'))
    expect(res.status).toBe(200)
    const body = (await res.json()) as { items: Array<{ id: string; name: string }> }
    expect(body.items.some((i) => i.id === 'scene-catalog-wire')).toBe(true)
    expect(body.items.find((i) => i.id === 'scene-catalog-wire')?.name).toBe('Catalog Wire Scene')
  })

  it('compositions list returns 401 without session when auth configured', async () => {
    vi.stubEnv(paths.envFederationAuthUrl, 'https://plexon.test')
    vi.stubEnv(paths.envServiceSecret, 'test-secret')
    vi.stubEnv(paths.envAuthBypass, '0')
    authMock.mockResolvedValue(null)
    const { GET } = await import('../app/api/compositions/route')
    const res = await GET(new Request('http://localhost/api/compositions'))
    expect(res.status).toBe(401)
  })
})
