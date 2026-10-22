/**
 * GET /api/public/client-shares/:token
 * Spec: specs/api/client-page-share.md
 */
import { NextResponse } from 'next/server'
import { emitClientShareAuditEvent } from '../../../../../lib/client-page-share/events'
import { gateClientShareAccess } from '../../../../../lib/client-page-share/gate'
import { enrichGuestCommentsFromScene } from '../../../../../lib/client-page-share/project-guest-comments'
import { resolveClientShareRenderScene } from '../../../../../lib/client-page-share/resolve-scene'
import {
  getClientPageShareByToken,
  isClientShareActive,
} from '../../../../../lib/client-page-share/store'
import { isClientPageShareTokenShape } from '../../../../../lib/client-page-share/token'
import { isClientPageShareEnabled } from '../../../../../lib/runtime-config'
import { getScene } from '../../../../../lib/scene/scene-store'

export async function GET(
  _req: Request,
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
    return NextResponse.json(
      { code: gate.code, accessMode: record.accessMode, label: record.label },
      { status: 401 },
    )
  }

  const rendered = await resolveClientShareRenderScene(record)
  const scene = await getScene(record.sceneId)

  emitClientShareAuditEvent({
    platformProjectId: record.platformProjectId,
    shareId: record.id,
    eventType: 'client_share.viewed',
    meta: { via: gate.via, contentMode: rendered.contentMode },
  })

  return NextResponse.json({
    id: record.id,
    label: record.label,
    contentMode: rendered.contentMode,
    draft: rendered.draft,
    commentsEnabled: true,
    comments: enrichGuestCommentsFromScene(record.guestComments ?? [], scene),
    pageIds: rendered.snapshot.pages.map((p) => p.id),
    pages: rendered.snapshot.pages.map((p) => ({
      id: p.id,
      name: p.name,
      breakpoint: p.breakpoint ?? null,
      frame: p.frame ?? null,
    })),
    sceneName: rendered.snapshot.name,
    activeBreakpoint: rendered.snapshot.activeBreakpoint ?? null,
    pinnedAt: rendered.snapshot.pinnedAt,
    expiresAt: record.expiresAt,
  })
}
