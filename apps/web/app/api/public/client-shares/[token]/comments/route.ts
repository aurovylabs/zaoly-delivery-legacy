/**
 * GET/POST /api/public/client-shares/:token/comments
 * Guest comments on the share (P3). Spatial pins project into CompositionScene.comments (P8).
 */
import { NextResponse } from 'next/server'
import { gateClientShareAccess } from '../../../../../../lib/client-page-share/gate'
import {
  appendGuestComment,
  commentsForPage,
  createGuestComment,
  toPublicGuestComment,
} from '../../../../../../lib/client-page-share/guest-comments'
import {
  addGuestCommentToShare,
  getClientPageShareByToken,
  isClientShareActive,
} from '../../../../../../lib/client-page-share/store'
import { projectGuestCommentToScene, enrichGuestCommentsFromScene } from '../../../../../../lib/client-page-share/project-guest-comments'
import { isClientPageShareTokenShape } from '../../../../../../lib/client-page-share/token'
import { sendCommentNewEmail, voidSystemMail } from '../../../../../../lib/mail/system-mail'
import { isClientPageShareEnabled } from '../../../../../../lib/runtime-config'
import { getScene } from '../../../../../../lib/scene/scene-store'
import { getUserById } from '../../../../../../lib/users/user-store'

export async function GET(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  if (!isClientPageShareEnabled()) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 })
  }
  const { token: raw } = await ctx.params
  const token = decodeURIComponent(raw)
  if (!isClientPageShareTokenShape(token)) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 })
  }
  const record = await getClientPageShareByToken(token)
  if (!record || !isClientShareActive(record)) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 })
  }
  const gate = await gateClientShareAccess(record)
  if (!gate.ok) {
    return NextResponse.json({ code: gate.code }, { status: 401 })
  }
  const pageId = new URL(req.url).searchParams.get('pageId')?.trim()
  const comments = pageId
    ? commentsForPage(record.guestComments, pageId)
    : record.guestComments ?? []
  const scene = await getScene(record.sceneId)
  return NextResponse.json({
    // P7: unlocked shares always expose guest feedback (spatial pins).
    commentsEnabled: true,
    comments: enrichGuestCommentsFromScene(comments, scene),
  })
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  if (!isClientPageShareEnabled()) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 })
  }
  const { token: raw } = await ctx.params
  const token = decodeURIComponent(raw)
  if (!isClientPageShareTokenShape(token)) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 })
  }
  const record = await getClientPageShareByToken(token)
  if (!record || !isClientShareActive(record)) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 })
  }
  const gate = await gateClientShareAccess(record)
  if (!gate.ok) {
    return NextResponse.json({ code: gate.code }, { status: 401 })
  }

  const body = (await req.json().catch(() => ({}))) as {
    pageId?: unknown
    authorName?: unknown
    authorEmail?: unknown
    body?: unknown
    pinX?: unknown
    pinY?: unknown
  }

  const built = createGuestComment({
    pageId: typeof body.pageId === 'string' ? body.pageId : '',
    authorName: typeof body.authorName === 'string' ? body.authorName : '',
    authorEmail: typeof body.authorEmail === 'string' ? body.authorEmail : null,
    body: typeof body.body === 'string' ? body.body : '',
    allowedPageIds: record.pageIds,
    pinX: body.pinX,
    pinY: body.pinY,
  })
  if (!built.ok) {
    return NextResponse.json({ error: built.error }, { status: 422 })
  }
  const nextList = appendGuestComment(record.guestComments, built.comment)
  if ('error' in nextList) {
    return NextResponse.json({ error: nextList.error }, { status: 422 })
  }

  const updated = await addGuestCommentToShare(record.id, built.comment)
  if (!updated) {
    return NextResponse.json({ error: 'comment_failed' }, { status: 500 })
  }

  // P8: project spatial pins into CompositionScene.comments for the designer.
  if (
    typeof built.comment.pinX === 'number' &&
    typeof built.comment.pinY === 'number'
  ) {
    try {
      await projectGuestCommentToScene(record.sceneId, built.comment)
    } catch {
      // Share comment already persisted; projection is best-effort for editor visibility.
    }
  }

  try {
    const scene = await getScene(record.sceneId)
    const ownerId = scene?.ownerUserId || record.createdByUserId
    const owner = ownerId ? await getUserById(ownerId) : null
    if (owner?.email && !owner.disabled) {
      voidSystemMail(
        sendCommentNewEmail({
          to: owner.email,
          sceneId: record.sceneId,
          sceneName: scene?.name?.trim() || record.sceneId,
          authorName: built.comment.authorName,
          excerpt: built.comment.body,
        }),
      )
    }
  } catch {
    // Best-effort notify — share comment already persisted.
  }

  return NextResponse.json(
    {
      comment: toPublicGuestComment(built.comment),
    },
    { status: 201 },
  )
}
