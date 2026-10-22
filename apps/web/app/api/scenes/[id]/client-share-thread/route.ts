/**
 * POST /api/scenes/:id/client-share-thread
 * Immediately mirror a projected client-share comment thread (replies/resolved)
 * onto active share records — P9 live update without waiting for scene Save.
 */
import { NextResponse } from 'next/server'
import {
  isProjectedGuestSceneComment,
  mirrorProjectedThreadToShares,
} from '../../../../../lib/client-page-share/project-guest-comments'
import { sendCommentReplyEmail, voidSystemMail } from '../../../../../lib/mail/system-mail'
import {
  isSceneApiAccess,
  requireSceneApiAccess,
} from '../../../../../lib/require-scene-api-access'
import {
  isSceneForViewer,
  requireSceneForViewer,
} from '../../../../../lib/require-scene-collection-access'
import { zaolyPublicUrl, isClientPageShareEnabled } from '../../../../../lib/runtime-config'
import { paths } from '../../../../../lib/paths'


export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!isClientPageShareEnabled()) {
    return NextResponse.json({ error: 'client_share_disabled' }, { status: 403 })
  }
  const access = await requireSceneApiAccess(req)
  if (!isSceneApiAccess(access)) return access

  const { id } = await ctx.params
  const loaded = await requireSceneForViewer(id, access.userId, {
    serviceMode: access.mode === 'service',
  })
  if (!isSceneForViewer(loaded)) return loaded

  const body = (await req.json().catch(() => ({}))) as {
    sceneCommentId?: unknown
    replies?: unknown
    resolved?: unknown
  }
  const sceneCommentId =
    typeof body.sceneCommentId === 'string' ? body.sceneCommentId.trim() : ''
  if (!sceneCommentId || !isProjectedGuestSceneComment(sceneCommentId)) {
    return NextResponse.json({ error: 'not_projected' }, { status: 422 })
  }

  const repliesRaw = Array.isArray(body.replies) ? body.replies : []
  const replies = repliesRaw
    .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === 'object')
    .filter(
      (r) =>
        typeof r.id === 'string' &&
        typeof r.author === 'string' &&
        typeof r.body === 'string' &&
        typeof r.createdAt === 'string',
    )
    .map((r) => ({
      id: r.id as string,
      author: r.author as string,
      body: r.body as string,
      createdAt: r.createdAt as string,
    }))

  const result = await mirrorProjectedThreadToShares(id, {
    sceneCommentId,
    replies,
    resolved: Boolean(body.resolved),
  })
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 })
  }
  const sceneName = loaded.scene.name?.trim() || id
  const origin = zaolyPublicUrl().replace(/\/$/, '')
  for (const n of result.notifies) {
    if (!n.shareToken) continue
    voidSystemMail(
      sendCommentReplyEmail({
        to: n.to,
        sceneName,
        replyAuthor: n.replyAuthor,
        excerpt: n.excerpt,
        shareUrl: `${origin}${paths.routes.clientPageShare(n.shareToken)}`,
      }),
    )
  }
  return NextResponse.json({ ok: true, mirrored: result.mirrored })
}
