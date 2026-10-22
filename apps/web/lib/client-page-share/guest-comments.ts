/** Guest comments attached to a Client Page Share (not scene.comments). */
import { randomUUID } from 'node:crypto'
import { normalizeShareEmail } from './email'

export type ClientShareGuestCommentReply = {
  id: string
  author: string
  body: string
  createdAt: string
}

export type ClientShareGuestComment = {
  id: string
  pageId: string
  authorName: string
  authorEmail: string | null
  body: string
  createdAt: string
  /** Artboard CSS px (P7 spatial pins). */
  pinX?: number
  pinY?: number
  /** Designer replies mirrored from CompositionScene.comments (P9). */
  replies?: ClientShareGuestCommentReply[]
  resolved?: boolean
}

const MAX_BODY = 2000
const MAX_NAME = 80
const MAX_COMMENTS_PER_SHARE = 200

function normalizePin(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined
  return Math.round(value)
}

export function createGuestComment(input: {
  pageId: string
  authorName: string
  authorEmail?: string | null
  body: string
  allowedPageIds: string[]
  pinX?: unknown
  pinY?: unknown
}): { ok: true; comment: ClientShareGuestComment } | { ok: false; error: string } {
  const pageId = input.pageId.trim()
  if (!pageId || !input.allowedPageIds.includes(pageId)) {
    return { ok: false, error: 'page_not_shared' }
  }
  const authorName = input.authorName.trim().slice(0, MAX_NAME)
  if (!authorName) return { ok: false, error: 'author_required' }
  const body = input.body.trim().slice(0, MAX_BODY)
  if (!body) return { ok: false, error: 'body_required' }
  const authorEmail = input.authorEmail
    ? normalizeShareEmail(input.authorEmail)
    : null

  const pinX = normalizePin(input.pinX)
  const pinY = normalizePin(input.pinY)
  if ((pinX === undefined) !== (pinY === undefined)) {
    return { ok: false, error: 'pin_incomplete' }
  }

  return {
    ok: true,
    comment: {
      id: randomUUID(),
      pageId,
      authorName,
      authorEmail,
      body,
      createdAt: new Date().toISOString(),
      ...(pinX !== undefined && pinY !== undefined ? { pinX, pinY } : {}),
      replies: [],
      resolved: false,
    },
  }
}

export function appendGuestComment(
  existing: ClientShareGuestComment[] | undefined,
  comment: ClientShareGuestComment,
): ClientShareGuestComment[] | { error: string } {
  const list = existing ?? []
  if (list.length >= MAX_COMMENTS_PER_SHARE) return { error: 'comment_limit' }
  return [...list, comment]
}

export function commentsForPage(
  comments: ClientShareGuestComment[] | undefined,
  pageId: string,
): ClientShareGuestComment[] {
  return (comments ?? []).filter((c) => c.pageId === pageId)
}

export function toPublicGuestComment(c: ClientShareGuestComment) {
  const replies = Array.isArray(c.replies)
    ? c.replies.map((r) => ({
        id: r.id,
        author: r.author,
        body: r.body,
        createdAt: r.createdAt,
      }))
    : []
  return {
    id: c.id,
    pageId: c.pageId,
    authorName: c.authorName,
    body: c.body,
    createdAt: c.createdAt,
    resolved: Boolean(c.resolved),
    replies,
    ...(typeof c.pinX === 'number' && typeof c.pinY === 'number'
      ? { pinX: c.pinX, pinY: c.pinY }
      : {}),
  }
}
