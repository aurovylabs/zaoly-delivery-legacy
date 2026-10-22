import { describe, expect, it, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createDemoScene } from '../lib/scene/demo-scene'
import { buildClientShareSnapshot } from '../lib/client-page-share/snapshot'
import {
  __resetClientPageShareStoreForTests,
  createClientPageShare,
  getClientPageShareById,
  revokeClientPageShare,
} from '../lib/client-page-share/store'
import { DEFAULT_SCENE_PAGE_ID } from '../lib/scene/scene-pages'
import { paths } from '../lib/paths'

const root = path.resolve(__dirname, '..')

describe('client page share P4 service revoke', () => {
  beforeEach(() => {
    __resetClientPageShareStoreForTests({ durable: false })
  })

  it('exposes provisioning revoke path helper', () => {
    expect(
      paths.routes.apiProvisioningCollectionClientShare('col-1', 'share-9'),
    ).toBe(
      '/api/platform/provisioning/collections/col-1/client-shares/share-9',
    )
  })

  it('provisioning inbound client-shares route is 410 in Zaoly', () => {
    const src = readFileSync(
      path.join(
        root,
        'app/api/platform/provisioning/collections/[platformProjectId]/client-shares/[shareId]/route.ts',
      ),
      'utf8',
    )
    expect(src).toContain('suiteOutOfScopeResponse')
    expect(src).not.toContain('syncClientShareProjectionRevoke')
  })

  it('revokes share by id for matching Collection', async () => {
    const scene = createDemoScene()
    const pageId = scene.pages?.[0]?.id ?? DEFAULT_SCENE_PAGE_ID
    const built = buildClientShareSnapshot(scene, [pageId])
    expect(built.ok).toBe(true)
    if (!built.ok) return

    const platformProjectId = '11111111-1111-4111-8111-111111111111'
    const { record } = await createClientPageShare({
      platformProjectId,
      sceneId: scene.id,
      pageIds: [pageId],
      snapshot: built.snapshot,
      accessMode: 'link',
      expiresInDays: 7,
      createdByUserId: 'user-1',
      maxTtlDays: 30,
    })

    const revoked = await revokeClientPageShare(record.id)
    expect(revoked?.revokedAt).toBeTruthy()
    const again = await getClientPageShareById(record.id)
    expect(again?.revokedAt).toBeTruthy()
  })
})
