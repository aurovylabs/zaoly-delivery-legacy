/**
 * Project Client Page Share guest pins into CompositionScene.comments
 * so designers see them in the editor canvas / comments panel.
 * Spec: specs/domain/client-page-share.md (P8/P9) · editor-comments.md
 */
import type { CompositionScene, SceneComment } from '@zaoly/contracts'
import type {
  ClientShareGuestComment,
  ClientShareGuestCommentReply,
} from './guest-comments'
import { toPublicGuestComment } from './guest-comments'
import {
  guestIdFromSceneCommentId,
  isProjectedGuestSceneComment,
  sceneCommentIdForGuest,
} from './projected-comment-ids'
import {
  listClientPageSharesForScene,
  replaceGuestCommentsOnShare,
} from './store'
import { getScene, upsertScene } from '../scene/scene-store'
import { publishSceneUpdated } from '../scene/scene-events'

export {
  guestIdFromSceneCommentId,
  isProjectedGuestSceneComment,
  sceneCommentIdForGuest,
} from './projected-comment-ids'

/** Page-local guest pin → board/canvas pin (page frame origin). */
export function guestPinToSceneCoords(
  scene: CompositionScene,
  pageId: string,
  pinX: number,
  pinY: number,
): { pinX: number; pinY: number } {
  const page = scene.pages?.find((p) => p.id === pageId)
  const ox = typeof page?.frame?.x === 'number' ? page.frame.x : 0
  const oy = typeof page?.frame?.y === 'number' ? page.frame.y : 0
  return { pinX: Math.round(ox + pinX), pinY: Math.round(oy + pinY) }
}

export function buildProjectedSceneComment(
  scene: CompositionScene,
  guest: ClientShareGuestComment,
): SceneComment | null {
  if (typeof guest.pinX !== 'number' || typeof guest.pinY !== 'number') return null
  const coords = guestPinToSceneCoords(scene, guest.pageId, guest.pinX, guest.pinY)
  const author = `Client · ${guest.authorName}`.slice(0, 80)
  return {
    id: sceneCommentIdForGuest(guest.id),
    body: guest.body,
    author,
    createdAt: guest.createdAt,
    resolved: Boolean(guest.resolved),
    pinX: coords.pinX,
    pinY: coords.pinY,
    replies: Array.isArray(guest.replies)
      ? guest.replies.map((r) => ({ ...r }))
      : [],
  }
}

/**
 * Merge guest pins into scene.comments (idempotent by projected id).
 * Returns null when nothing changed. Does not overwrite existing projected
 * threads (preserves designer replies / resolve state).
 */
export function mergeGuestCommentsIntoScene(
  scene: CompositionScene,
  guests: ClientShareGuestComment[],
): CompositionScene | null {
  const existingIds = new Set((scene.comments ?? []).map((c) => c.id))
  let next: CompositionScene = scene
  let changed = false

  for (const guest of guests) {
    const projected = buildProjectedSceneComment(next, guest)
    if (!projected) continue
    if (existingIds.has(projected.id)) continue
    const prev = next.comments ?? []
    next = { ...next, comments: [...prev, projected] }
    existingIds.add(projected.id)
    changed = true
  }

  return changed ? next : null
}

export async function projectGuestCommentToScene(
  sceneId: string,
  guest: ClientShareGuestComment,
): Promise<CompositionScene | null> {
  const scene = await getScene(sceneId)
  if (!scene) return null
  const merged = mergeGuestCommentsIntoScene(scene, [guest])
  if (!merged) return scene
  const saved = await upsertScene({
    ...merged,
    updatedAt: new Date().toISOString(),
  })
  publishSceneUpdated({
    sceneId: saved.id,
    updatedAt: saved.updatedAt,
    platformProjectId: saved.platformProjectId ?? null,
    source: 'client_share_guest_comment',
  })
  return saved
}

/** Pull all active share guest pins for a scene into CompositionScene.comments. */
export async function syncAllGuestCommentsIntoScene(
  sceneId: string,
): Promise<CompositionScene | null> {
  const scene = await getScene(sceneId)
  if (!scene) return null
  const shares = await listClientPageSharesForScene(sceneId)
  const guests = shares
    .filter((s) => !s.revokedAt)
    .flatMap((s) => s.guestComments ?? [])
  const merged = mergeGuestCommentsIntoScene(scene, guests)
  if (!merged) return scene
  const saved = await upsertScene({
    ...merged,
    updatedAt: scene.updatedAt,
  }, { touchUpdatedAt: false })
  return saved
}

function repliesEqual(
  a: ClientShareGuestCommentReply[] | undefined,
  b: ClientShareGuestCommentReply[] | undefined,
): boolean {
  const left = a ?? []
  const right = b ?? []
  if (left.length !== right.length) return false
  return left.every(
    (r, i) =>
      r.id === right[i]?.id &&
      r.body === right[i]?.body &&
      r.author === right[i]?.author &&
      r.createdAt === right[i]?.createdAt,
  )
}

/**
 * P9 — Merge share-stored replies with scene replies (union by id).
 * Immediate share mirrors can land before the designer Saves the scene.
 */
export function mergeGuestAndSceneReplies(
  guestReplies: ClientShareGuestCommentReply[] | undefined,
  sceneReplies: Array<{ id: string; author: string; body: string; createdAt: string }> | undefined,
): ClientShareGuestCommentReply[] {
  const byId = new Map<string, ClientShareGuestCommentReply>()
  for (const r of guestReplies ?? []) {
    byId.set(r.id, { id: r.id, author: r.author, body: r.body, createdAt: r.createdAt })
  }
  for (const r of sceneReplies ?? []) {
    byId.set(r.id, { id: r.id, author: r.author, body: r.body, createdAt: r.createdAt })
  }
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

/**
 * P9 — Attach designer replies/resolved from scene.comments onto guest comments
 * for the public share payload. Merges share + scene replies so immediate mirrors
 * show even before scene Save.
 */
export function enrichGuestCommentsFromScene(
  guests: ClientShareGuestComment[],
  scene: CompositionScene | null | undefined,
): ReturnType<typeof toPublicGuestComment>[] {
  const byProjectedId = new Map(
    (scene?.comments ?? [])
      .filter((c) => isProjectedGuestSceneComment(c.id))
      .map((c) => [c.id, c] as const),
  )
  return guests.map((guest) => {
    const projected = byProjectedId.get(sceneCommentIdForGuest(guest.id))
    const replies = mergeGuestAndSceneReplies(guest.replies, projected?.replies)
    const resolved = projected ? Boolean(projected.resolved) : Boolean(guest.resolved)
    return toPublicGuestComment({
      ...guest,
      replies,
      resolved,
    })
  })
}

/**
 * P9 — Immediately mirror one projected thread onto all active shares for the scene.
 * Used when the designer replies/resolves in the editor (before Save).
 */
export type GuestReplyNotify = {
  to: string
  shareToken: string | null
  replyAuthor: string
  excerpt: string
  guestName: string
}

export async function mirrorProjectedThreadToShares(
  sceneId: string,
  thread: {
    sceneCommentId: string
    replies: ClientShareGuestCommentReply[]
    resolved: boolean
  },
): Promise<
  | { ok: true; mirrored: number; notifies: GuestReplyNotify[] }
  | { ok: false; error: string }
> {
  const guestId = guestIdFromSceneCommentId(thread.sceneCommentId)
  if (!guestId) return { ok: false, error: 'not_projected' }
  const replies = thread.replies.map((r) => ({
    id: r.id,
    author: r.author,
    body: r.body,
    createdAt: r.createdAt,
  }))
  const resolved = Boolean(thread.resolved)
  const shares = await listClientPageSharesForScene(sceneId)
  let mirrored = 0
  const notifies: GuestReplyNotify[] = []
  const latestReply = replies[replies.length - 1]
  for (const share of shares) {
    if (share.revokedAt) continue
    const prev = share.guestComments ?? []
    const idx = prev.findIndex((g) => g.id === guestId)
    if (idx < 0) continue
    const guest = prev[idx]!
    const prevReplyCount = guest.replies?.length ?? 0
    if (repliesEqual(guest.replies, replies) && Boolean(guest.resolved) === resolved) {
      continue
    }
    const next = [...prev]
    next[idx] = { ...guest, replies, resolved }
    await replaceGuestCommentsOnShare(share.id, next)
    mirrored += 1
    if (
      latestReply &&
      replies.length > prevReplyCount &&
      guest.authorEmail &&
      guest.authorEmail.includes('@')
    ) {
      notifies.push({
        to: guest.authorEmail,
        shareToken: share.tokenPlain,
        replyAuthor: latestReply.author,
        excerpt: latestReply.body,
        guestName: guest.authorName,
      })
    }
  }
  return { ok: true, mirrored, notifies }
}

/**
 * P9 — Persist designer replies/resolved from scene onto matching share guest rows.
 * Called after designer scene Save so share store stays durable.
 */
export async function mirrorDesignerRepliesToShares(
  scene: CompositionScene,
): Promise<void> {
  const projected = (scene.comments ?? []).filter((c) =>
    isProjectedGuestSceneComment(c.id),
  )
  if (!projected.length) return
  const byGuestId = new Map(
    projected
      .map((c) => {
        const gid = guestIdFromSceneCommentId(c.id)
        return gid ? ([gid, c] as const) : null
      })
      .filter((entry): entry is readonly [string, SceneComment] => Boolean(entry)),
  )
  if (!byGuestId.size) return

  const shares = await listClientPageSharesForScene(scene.id)
  for (const share of shares) {
    if (share.revokedAt) continue
    const prev = share.guestComments ?? []
    let changed = false
    const next = prev.map((guest) => {
      const sc = byGuestId.get(guest.id)
      if (!sc) return guest
      const replies: ClientShareGuestCommentReply[] = (sc.replies ?? []).map((r) => ({
        id: r.id,
        author: r.author,
        body: r.body,
        createdAt: r.createdAt,
      }))
      const resolved = Boolean(sc.resolved)
      if (repliesEqual(guest.replies, replies) && Boolean(guest.resolved) === resolved) {
        return guest
      }
      changed = true
      return { ...guest, replies, resolved }
    })
    if (changed) {
      await replaceGuestCommentsOnShare(share.id, next)
    }
  }
}
