import { describe, expect, it, beforeEach } from 'vitest'
import { createDemoScene } from '../lib/scene/demo-scene'
import {
  buildClientShareSnapshot,
  sceneFromClientShareSnapshot,
} from '../lib/client-page-share/snapshot'
import {
  hashClientSharePassword,
  verifyClientSharePassword,
} from '../lib/client-page-share/password'
import {
  generateClientPageShareToken,
  hashClientPageShareToken,
  isClientPageShareTokenShape,
} from '../lib/client-page-share/token'
import {
  mintClientShareUnlockToken,
  verifyClientShareUnlockToken,
} from '../lib/client-page-share/unlock'
import {
  __resetClientPageShareStoreForTests,
  approveClientPageShare,
  clientShareRoomStatus,
  createClientPageShare,
  getClientPageShareByToken,
  isClientShareActive,
  listClientPageSharesForScene,
  revokeClientPageShare,
  toPublicMeta,
} from '../lib/client-page-share/store'
import { paths } from '../lib/paths'
import { DEFAULT_SCENE_PAGE_ID } from '../lib/scene/scene-pages'

describe('client page share helpers', () => {
  beforeEach(() => {
    __resetClientPageShareStoreForTests({ durable: false })
  })

  it('mints crs_ tokens and hashes them', () => {
    const token = generateClientPageShareToken()
    expect(isClientPageShareTokenShape(token)).toBe(true)
    expect(token.startsWith(paths.clientPageShareTokenPrefix)).toBe(true)
    const h1 = hashClientPageShareToken(token)
    const h2 = hashClientPageShareToken(` ${token} `)
    expect(h1).toBe(h2)
    expect(h1).toHaveLength(64)
  })

  it('hashes and verifies passwords with scrypt', async () => {
    const hash = await hashClientSharePassword('s3cret!')
    expect(hash.startsWith('scrypt$')).toBe(true)
    expect(await verifyClientSharePassword('s3cret!', hash)).toBe(true)
    expect(await verifyClientSharePassword('wrong', hash)).toBe(false)
  })

  it('builds page subset snapshot without importSourceHtml', () => {
    const scene = createDemoScene()
    const pageId = scene.pages?.[0]?.id ?? DEFAULT_SCENE_PAGE_ID
    const withSecret = {
      ...scene,
      pages: (scene.pages ?? []).map((p, i) =>
        i === 0
          ? { ...p, importSourceHtml: '<html>secret</html>', craftDebug: undefined }
          : p,
      ),
    }
    const built = buildClientShareSnapshot(withSecret, [pageId])
    expect(built.ok).toBe(true)
    if (!built.ok) return
    expect(built.snapshot.pages).toHaveLength(1)
    expect(built.snapshot.pages[0].id).toBe(pageId)
    expect(
      'importSourceHtml' in (built.snapshot.pages[0] as Record<string, unknown>),
    ).toBe(false)
    const reconstructed = sceneFromClientShareSnapshot(built.snapshot)
    expect(reconstructed.pages?.[0]?.id).toBe(pageId)
  })

  it('rejects unknown page ids', () => {
    const scene = createDemoScene()
    const built = buildClientShareSnapshot(scene, ['no-such-page'])
    expect(built.ok).toBe(false)
  })

  it('creates, resolves, and revokes shares in memory store', async () => {
    const scene = createDemoScene()
    const pageId = scene.pages?.[0]?.id ?? DEFAULT_SCENE_PAGE_ID
    const built = buildClientShareSnapshot(scene, [pageId])
    expect(built.ok).toBe(true)
    if (!built.ok) return

    const { record, token } = await createClientPageShare({
      platformProjectId: '11111111-1111-4111-8111-111111111111',
      sceneId: scene.id,
      pageIds: [pageId],
      snapshot: built.snapshot,
      accessMode: 'password',
      password: 'review',
      expiresInDays: 7,
      label: 'Client',
      createdByUserId: 'user-1',
      maxTtlDays: 30,
    })

    expect(record.passwordHash).toBeTruthy()
    expect(record.tokenHash).toBe(hashClientPageShareToken(token))
    expect(record.tokenPlain).toBe(token)

    const found = await getClientPageShareByToken(token)
    expect(found?.id).toBe(record.id)
    expect(isClientShareActive(found!)).toBe(true)

    const listed = await listClientPageSharesForScene(scene.id)
    expect(listed.some((s) => s.id === record.id && s.tokenPlain === token)).toBe(true)

    expect(clientShareRoomStatus(record)).toBe('shared')
    expect(toPublicMeta(record).approved).toBe(false)

    const approved = await approveClientPageShare(record.id, 'user-1')
    expect(approved?.approvedAt).toBeTruthy()
    expect(clientShareRoomStatus(approved!)).toBe('approved')
    expect(toPublicMeta(approved!).status).toBe('approved')

    const revoked = await revokeClientPageShare(record.id)
    expect(revoked?.revokedAt).toBeTruthy()
    expect(isClientShareActive(revoked!)).toBe(false)
    expect(clientShareRoomStatus(revoked!)).toBe('revoked')
  })

  it('mints unlock cookies scoped to share id', () => {
    const token = mintClientShareUnlockToken('share-a')
    expect(verifyClientShareUnlockToken('share-a', token)).toBe(true)
    expect(verifyClientShareUnlockToken('share-b', token)).toBe(false)
  })

  it('exposes path helpers for public share routes', () => {
    expect(paths.routes.clientPageShare('crs_ab')).toBe('/share/p/crs_ab')
    expect(paths.routes.apiSceneClientShares('s1')).toBe('/api/scenes/s1/client-shares')
    expect(paths.routes.apiPublicClientShare('crs_x')).toBe(
      '/api/public/client-shares/crs_x',
    )
  })
})
