import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { createDemoScene } from '../lib/scene/demo-scene'
import { createGuestComment } from '../lib/client-page-share/guest-comments'
import {
  buildProjectedSceneComment,
  enrichGuestCommentsFromScene,
  guestPinToSceneCoords,
  mergeGuestCommentsIntoScene,
  sceneCommentIdForGuest,
} from '../lib/client-page-share/project-guest-comments'
import { normalizeScene } from '../lib/scene/scene-normalize'
import { paths } from '../lib/paths'
import { DEFAULT_SCENE_PAGE_ID } from '../lib/scene/scene-pages'

describe('client page share P8 — project guest pins into scene.comments', () => {
  const prevBackend = process.env.ZAOLY_SCENE_STORE

  beforeEach(() => {
    process.env.ZAOLY_SCENE_STORE = 'memory'
  })

  afterEach(() => {
    if (prevBackend === undefined) delete process.env.ZAOLY_SCENE_STORE
    else process.env.ZAOLY_SCENE_STORE = prevBackend
  })

  it('maps guest id to cmt_crs_ scene comment id via paths', () => {
    expect(paths.clientShareSceneCommentIdPrefix).toBe('cmt_crs_')
    expect(sceneCommentIdForGuest('gcm_abc')).toBe('cmt_crs_gcm_abc')
  })

  it('converts page-local pins to board coords using page frame', () => {
    const scene = createDemoScene()
    const page = scene.pages?.[1]
    expect(page?.frame).toBeTruthy()
    if (!page?.frame) return
    const coords = guestPinToSceneCoords(scene, page.id, 40, 90)
    expect(coords.pinX).toBe(Math.round(page.frame.x + 40))
    expect(coords.pinY).toBe(Math.round(page.frame.y + 90))
  })

  it('builds projected SceneComment with Client · author', () => {
    const scene = createDemoScene()
    const pageId = scene.pages?.[0]?.id ?? DEFAULT_SCENE_PAGE_ID
    const made = createGuestComment({
      pageId,
      authorName: 'Alex',
      body: 'Tighten hero',
      allowedPageIds: [pageId],
      pinX: 12,
      pinY: 34,
    })
    expect(made.ok).toBe(true)
    if (!made.ok) return
    const projected = buildProjectedSceneComment(scene, made.comment)
    expect(projected).toMatchObject({
      id: sceneCommentIdForGuest(made.comment.id),
      body: 'Tighten hero',
      author: 'Client · Alex',
      resolved: false,
      pinX: 12,
      pinY: 34,
    })
  })

  it('merge is idempotent by projected id', () => {
    const scene = createDemoScene()
    const pageId = scene.pages?.[0]?.id ?? DEFAULT_SCENE_PAGE_ID
    const made = createGuestComment({
      pageId,
      authorName: 'Bea',
      body: 'Pin',
      allowedPageIds: [pageId],
      pinX: 5,
      pinY: 6,
    })
    expect(made.ok).toBe(true)
    if (!made.ok) return
    const once = mergeGuestCommentsIntoScene(scene, [made.comment])
    expect(once?.comments).toHaveLength((scene.comments?.length ?? 0) + 1)
    const twice = mergeGuestCommentsIntoScene(once!, [made.comment])
    expect(twice).toBeNull()
  })

  it('normalizeScene keeps spatial-only pins (no nodeId) through round-trip shape', () => {
    const demo = createDemoScene()
    const withPin = {
      ...demo,
      comments: [
        {
          id: 'cmt_crs_gcm_test',
          body: 'From client',
          author: 'Client · Pat',
          createdAt: '2026-09-20T12:00:00.000Z',
          resolved: false,
          pinX: 100,
          pinY: 200,
          replies: [],
        },
      ],
    }
    const normalized = normalizeScene(withPin as unknown as Record<string, unknown>)
    expect(normalized?.comments).toHaveLength(1)
    expect(normalized?.comments?.[0]).toMatchObject({
      id: 'cmt_crs_gcm_test',
      pinX: 100,
      pinY: 200,
      author: 'Client · Pat',
    })
    expect(normalized?.comments?.[0]?.nodeId).toBeUndefined()
  })

  it('enrichGuestCommentsFromScene attaches designer replies and resolved', () => {
    const scene = createDemoScene()
    const pageId = scene.pages?.[0]?.id ?? DEFAULT_SCENE_PAGE_ID
    const guestId = 'guest-uuid-1'
    const guest = {
      id: guestId,
      pageId,
      authorName: 'Alex',
      authorEmail: null,
      body: 'Please check spacing',
      createdAt: '2026-09-20T10:00:00.000Z',
      pinX: 10,
      pinY: 20,
      replies: [],
      resolved: false,
    }
    const withReply = {
      ...scene,
      comments: [
        {
          id: sceneCommentIdForGuest(guestId),
          body: guest.body,
          author: 'Client · Alex',
          createdAt: guest.createdAt,
          resolved: true,
          pinX: 10,
          pinY: 20,
          replies: [
            {
              id: 'rep_1',
              author: 'designer',
              body: 'Done — bumped to 32px',
              createdAt: '2026-09-20T11:00:00.000Z',
            },
          ],
        },
      ],
    }
    const enriched = enrichGuestCommentsFromScene([guest], withReply)
    expect(enriched).toHaveLength(1)
    expect(enriched[0]?.resolved).toBe(true)
    expect(enriched[0]?.replies).toEqual([
      expect.objectContaining({
        id: 'rep_1',
        author: 'designer',
        body: 'Done — bumped to 32px',
      }),
    ])
  })

  it('enrich merges share-mirrored replies before scene Save', () => {
    const scene = createDemoScene()
    const pageId = scene.pages?.[0]?.id ?? DEFAULT_SCENE_PAGE_ID
    const guestId = 'guest-uuid-2'
    const guest = {
      id: guestId,
      pageId,
      authorName: 'Alex',
      authorEmail: null,
      body: 'Logo too big',
      createdAt: '2026-09-20T10:00:00.000Z',
      pinX: 1,
      pinY: 2,
      replies: [
        {
          id: 'rep_live',
          author: 'designer',
          body: 'Shrunk to 48px',
          createdAt: '2026-09-20T10:05:00.000Z',
        },
      ],
      resolved: false,
    }
    // Scene projected pin exists but has no replies yet (designer has not Saved).
    const withPinOnly = {
      ...scene,
      comments: [
        {
          id: sceneCommentIdForGuest(guestId),
          body: guest.body,
          author: 'Client · Alex',
          createdAt: guest.createdAt,
          resolved: false,
          pinX: 1,
          pinY: 2,
          replies: [],
        },
      ],
    }
    const enriched = enrichGuestCommentsFromScene([guest], withPinOnly)
    expect(enriched[0]?.replies).toEqual([
      expect.objectContaining({ id: 'rep_live', body: 'Shrunk to 48px' }),
    ])
  })

  it('exposes client-share-thread path for live mirror', () => {
    expect(paths.routes.apiSceneClientShareThread('scn_1')).toBe(
      '/api/scenes/scn_1/client-share-thread',
    )
  })
})
