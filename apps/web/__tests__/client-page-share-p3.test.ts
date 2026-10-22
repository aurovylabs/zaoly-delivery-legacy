import { describe, expect, it, beforeEach } from 'vitest'
import { createDemoScene } from '../lib/scene/demo-scene'
import {
  appendGuestComment,
  createGuestComment,
} from '../lib/client-page-share/guest-comments'
import {
  buildShareWatermarkLabel,
  injectShareWatermark,
} from '../lib/client-page-share/watermark'
import { buildClientShareSnapshot } from '../lib/client-page-share/snapshot'
import {
  __resetClientPageShareStoreForTests,
  addGuestCommentToShare,
  createClientPageShare,
} from '../lib/client-page-share/store'
import { DEFAULT_SCENE_PAGE_ID } from '../lib/scene/scene-pages'
import { paths } from '../lib/paths'

describe('client page share P3', () => {
  beforeEach(() => {
    __resetClientPageShareStoreForTests({ durable: false })
  })

  it('builds and injects watermark', () => {
    const label = buildShareWatermarkLabel({
      label: 'Review',
      dateIso: '2026-09-19T12:00:00.000Z',
    })
    expect(label).toContain('Review')
    expect(label).toContain('CREATION shared preview')
    expect(label).toContain('2026-09-19')
    const html = injectShareWatermark('<html><body>x</body></html>', label)
    expect(html).toContain('data-creation-share-watermark')
    expect(html).toContain('Review')
  })

  it('creates guest comments on share record (projection is P8)', async () => {
    const scene = createDemoScene()
    const pageId = scene.pages?.[0]?.id ?? DEFAULT_SCENE_PAGE_ID
    const built = buildClientShareSnapshot(scene, [pageId])
    expect(built.ok).toBe(true)
    if (!built.ok) return

    const { record } = await createClientPageShare({
      platformProjectId: '11111111-1111-4111-8111-111111111111',
      sceneId: scene.id,
      pageIds: [pageId],
      snapshot: built.snapshot,
      accessMode: 'link',
      commentsEnabled: true,
      expiresInDays: 7,
      createdByUserId: 'user-1',
      maxTtlDays: 30,
    })

    const made = createGuestComment({
      pageId,
      authorName: 'Alex',
      body: 'Looks good',
      allowedPageIds: [pageId],
    })
    expect(made.ok).toBe(true)
    if (!made.ok) return
    const next = appendGuestComment([], made.comment)
    expect(Array.isArray(next)).toBe(true)

    const updated = await addGuestCommentToShare(record.id, made.comment)
    expect(updated?.guestComments).toHaveLength(1)
    expect(updated?.guestComments[0].authorName).toBe('Alex')

    const pinned = createGuestComment({
      pageId,
      authorName: 'Bea',
      body: 'Pin here',
      allowedPageIds: [pageId],
      pinX: 40,
      pinY: 90,
    })
    expect(pinned.ok).toBe(true)
    if (!pinned.ok) return
    expect(pinned.comment.pinX).toBe(40)
    expect(pinned.comment.pinY).toBe(90)
  })

  it('exposes public comments + export paths', () => {
    expect(paths.routes.apiPublicClientShareComments('crs_x')).toBe(
      '/api/public/client-shares/crs_x/comments',
    )
    expect(paths.routes.apiPublicClientShareExport('crs_x')).toBe(
      '/api/public/client-shares/crs_x/export',
    )
  })
})
