import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CompositionScene } from '@zaoly/contracts'
import { NextResponse } from 'next/server'
import {
  forbidUnlessPlatformProjectAccess,
  forbidUnlessSceneWriteAccess,
  isSceneForViewer,
  listScenesForViewer,
  requireSceneForViewer,
} from '../lib/require-scene-collection-access'
import {
  __resetProjectStoreForTests,
  createProject,
} from '../lib/fixtures/project-store'
import { __resetSceneStoreForTests, upsertScene } from '../lib/scene/scene-store'

vi.mock('../auth', () => ({
  auth: vi.fn(async () => null),
}))

const getSceneMemberRole = vi.fn(async () => null as 'editor' | 'viewer' | null)
const listSceneMemberUserIds = vi.fn(async () => [] as string[])

vi.mock('../lib/users/user-store', () => ({
  getSceneMemberRole: (...args: unknown[]) => getSceneMemberRole(...args),
  listSceneMemberUserIds: (...args: unknown[]) => listSceneMemberUserIds(...args),
}))

vi.mock('../lib/runtime-config', async () => {
  const actual = await vi.importActual<typeof import('../lib/runtime-config')>(
    '../lib/runtime-config',
  )
  return {
    ...actual,
    isAuthBypassEnabled: vi.fn(() => false),
  }
})

function scene(
  id: string,
  platformProjectId?: string | null,
  ownerUserId?: string | null,
): CompositionScene {
  return {
    id,
    name: id,
    version: 1,
    root: { id: 'root', type: 'Stack', children: [] },
    updatedAt: new Date().toISOString(),
    ...(platformProjectId != null ? { platformProjectId } : {}),
    ...(ownerUserId != null ? { ownerUserId } : {}),
  }
}

describe('require-scene-collection-access', () => {
  beforeEach(async () => {
    __resetSceneStoreForTests({ durable: false })
    __resetProjectStoreForTests()
    getSceneMemberRole.mockReset()
    getSceneMemberRole.mockResolvedValue(null)
    listSceneMemberUserIds.mockReset()
    listSceneMemberUserIds.mockResolvedValue([])
    const runtime = await import('../lib/runtime-config')
    vi.mocked(runtime.isAuthBypassEnabled).mockReturnValue(false)
  })

  it('allows unbound platformProjectId (Zaoly has no Collection gate)', async () => {
    expect(await forbidUnlessPlatformProjectAccess('u1', null)).toBeNull()
    expect(await forbidUnlessPlatformProjectAccess('u1', '')).toBeNull()
  })

  it('forbids a platform id with no local project', async () => {
    const denied = await forbidUnlessPlatformProjectAccess('u1', 'missing-project')
    expect(denied).toBeInstanceOf(NextResponse)
    expect(denied!.status).toBe(403)
  })

  it('forbids bound Collection without owner/access', async () => {
    await createProject({
      name: 'Other',
      platformProjectId: 'plx-x',
      ownerUserId: 'owner',
    })
    const denied = await forbidUnlessPlatformProjectAccess('stranger', 'plx-x')
    expect(denied).toBeInstanceOf(NextResponse)
    expect(denied!.status).toBe(403)
  })

  it('requireSceneForViewer returns 404 then 403 for non-owners', async () => {
    const missing = await requireSceneForViewer('missing', 'u1')
    expect(missing).toBeInstanceOf(NextResponse)
    expect((missing as NextResponse).status).toBe(404)

    await upsertScene(scene('s1', null, 'owner'))
    const forbidden = await requireSceneForViewer('s1', 'stranger')
    expect(forbidden).toBeInstanceOf(NextResponse)
    expect((forbidden as NextResponse).status).toBe(403)

    const ok = await requireSceneForViewer('s1', 'owner')
    expect(isSceneForViewer(ok)).toBe(true)
  })

  it('listScenesForViewer is owned ∪ scene_members', async () => {
    await upsertScene(scene('a', null, 'u1'))
    await upsertScene(scene('b', null, 'u2'))
    await upsertScene(scene('shared', null, 'u2'))
    listSceneMemberUserIds.mockResolvedValue(['shared'])

    const result = await listScenesForViewer('u1')
    expect('scenes' in result).toBe(true)
    if (!('scenes' in result)) return
    const ids = result.scenes.map((s) => s.id)
    expect(ids).toContain('a')
    expect(ids).toContain('shared')
    expect(ids).not.toContain('b')
  })

  it('standalone listScenesForViewer includes orphans and owned scenes', async () => {
    await upsertScene(scene('mine', null, 'u1'))
    await upsertScene(scene('theirs', null, 'u2'))
    await upsertScene(scene('legacy-unbound'))

    const result = await listScenesForViewer('u1')
    expect('scenes' in result).toBe(true)
    if (!('scenes' in result)) return
    const ids = result.scenes.map((s) => s.id)
    expect(ids).toContain('mine')
    expect(ids).toContain('legacy-unbound')
    expect(ids).not.toContain('theirs')
  })

  it('orphan scenes are readable and writable; claim helper sets owner', async () => {
    const { isOrphanScene, withClaimedOwnerIfOrphan } = await import(
      '../lib/require-scene-collection-access'
    )
    const orphan = scene('orphan-demo')
    expect(isOrphanScene(orphan)).toBe(true)
    await upsertScene(orphan)
    const loaded = await requireSceneForViewer('orphan-demo', 'u1')
    expect(isSceneForViewer(loaded)).toBe(true)
    expect(await forbidUnlessSceneWriteAccess('u1', orphan)).toBeNull()
    const claimed = withClaimedOwnerIfOrphan(orphan, 'u1')
    expect(claimed.ownerUserId).toBe('u1')
    expect(isOrphanScene(claimed)).toBe(false)
  })

  it('bypass list includes legacy unbound scenes', async () => {
    const runtime = await import('../lib/runtime-config')
    vi.mocked(runtime.isAuthBypassEnabled).mockReturnValue(true)
    await upsertScene(scene('mine', null, 'u1'))
    await upsertScene(scene('theirs', null, 'u2'))
    await upsertScene(scene('legacy-unbound'))

    const result = await listScenesForViewer('u1')
    expect('scenes' in result).toBe(true)
    if (!('scenes' in result)) return
    const ids = result.scenes.map((s) => s.id)
    expect(ids).toContain('mine')
    expect(ids).toContain('legacy-unbound')
    expect(ids).not.toContain('theirs')
  })

  it('standalone requireSceneForViewer allows owner without Collection', async () => {
    await upsertScene(scene('owned', null, 'u1'))
    const ok = await requireSceneForViewer('owned', 'u1')
    expect(isSceneForViewer(ok)).toBe(true)
    const denied = await requireSceneForViewer('owned', 'u2')
    expect(denied).toBeInstanceOf(NextResponse)
    expect((denied as NextResponse).status).toBe(403)
  })

  it('editor members may write; viewers may not', async () => {
    await upsertScene(scene('s-write', null, 'owner'))
    getSceneMemberRole.mockResolvedValue('editor')
    expect(await forbidUnlessSceneWriteAccess('ed1', scene('s-write', null, 'owner'))).toBeNull()
    getSceneMemberRole.mockResolvedValue('viewer')
    const denied = await forbidUnlessSceneWriteAccess('v1', scene('s-write', null, 'owner'))
    expect(denied).toBeInstanceOf(NextResponse)
    expect(denied!.status).toBe(403)
    expect(await denied!.json()).toEqual({ error: 'forbidden', reason: 'read-only' })
  })

  it('serviceMode fails closed when Collection is not accessible', async () => {
    await createProject({
      name: 'Sec',
      platformProjectId: 'plx-svc',
      ownerUserId: 'owner',
    })
    const denied = await forbidUnlessPlatformProjectAccess('stranger', 'plx-svc', {
      serviceMode: true,
    })
    expect(denied).toBeInstanceOf(NextResponse)
    expect(denied!.status).toBe(403)

    const ok = await forbidUnlessPlatformProjectAccess('owner', 'plx-svc', {
      serviceMode: true,
    })
    expect(ok).toBeNull()
  })
})
