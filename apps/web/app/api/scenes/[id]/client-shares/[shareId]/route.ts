/**
 * DELETE/PATCH /api/scenes/:id/client-shares/:shareId
 * Spec: specs/api/client-page-share.md · suite-enterprise-program.md § E2
 */
import { NextResponse } from 'next/server'
import {
  scheduleClearCreationPagesClientRoomSlot,
  schedulePublishApprovedShareToClientRoom,
} from '../../../../../../lib/client-page-share/client-room-publish'
import { emitClientShareAuditEvent } from '../../../../../../lib/client-page-share/events'
import { buildClientShareSnapshot } from '../../../../../../lib/client-page-share/snapshot'
import {
  approveClientPageShare,
  getClientPageShareById,
  refreshClientPageShareSnapshot,
  revokeClientPageShare,
  toPublicMeta,
} from '../../../../../../lib/client-page-share/store'
import {
  isSceneApiAccess,
  requireSceneApiAccess,
} from '../../../../../../lib/require-scene-api-access'
import {
  isSceneForViewer,
  requireSceneForViewer,
} from '../../../../../../lib/require-scene-collection-access'
import {
  absoluteClientPageShareUrl,
  isClientPageShareEnabled,
} from '../../../../../../lib/runtime-config'

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string; shareId: string }> },
) {
  if (!isClientPageShareEnabled()) {
    return NextResponse.json({ error: 'client_share_disabled' }, { status: 403 })
  }
  const access = await requireSceneApiAccess(req)
  if (!isSceneApiAccess(access)) return access

  const { id, shareId } = await ctx.params
  const loaded = await requireSceneForViewer(id, access.userId, {
    serviceMode: access.mode === 'service',
  })
  if (!isSceneForViewer(loaded)) return loaded

  const existing = await getClientPageShareById(shareId)
  if (!existing || existing.sceneId !== id) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 })
  }

  const wasApproved = Boolean(existing.approvedAt)
  const revoked = await revokeClientPageShare(shareId)
  if (!revoked) return NextResponse.json({ error: 'not-found' }, { status: 404 })
  emitClientShareAuditEvent({
    platformProjectId: revoked.platformProjectId,
    shareId,
    eventType: 'client_share.revoked',
    actorUserId: access.userId,
    meta: { source: 'creation_editor' },
  })
  if (wasApproved) {
    scheduleClearCreationPagesClientRoomSlot(revoked.platformProjectId, access.userId)
  }
  return NextResponse.json({ share: toPublicMeta(revoked) })
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string; shareId: string }> },
) {
  if (!isClientPageShareEnabled()) {
    return NextResponse.json({ error: 'client_share_disabled' }, { status: 403 })
  }
  const access = await requireSceneApiAccess(req)
  if (!isSceneApiAccess(access)) return access

  const { id, shareId } = await ctx.params
  const loaded = await requireSceneForViewer(id, access.userId, {
    serviceMode: access.mode === 'service',
  })
  if (!isSceneForViewer(loaded)) return loaded

  const existing = await getClientPageShareById(shareId)
  if (!existing || existing.sceneId !== id || existing.revokedAt) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 })
  }

  const body = (await req.json().catch(() => ({}))) as {
    approve?: unknown
    refreshSnapshot?: unknown
    pageIds?: unknown
  }

  if (body.approve === true) {
    const approved = await approveClientPageShare(shareId, access.userId)
    if (!approved) return NextResponse.json({ error: 'not-found' }, { status: 404 })
    schedulePublishApprovedShareToClientRoom(approved, access.userId)
    return NextResponse.json({
      share: {
        ...toPublicMeta(approved),
        shareUrl: approved.tokenPlain
          ? absoluteClientPageShareUrl(approved.tokenPlain)
          : null,
      },
    })
  }

  if (body.refreshSnapshot !== true) {
    return NextResponse.json({ error: 'unsupported_patch' }, { status: 422 })
  }

  const pageIds = Array.isArray(body.pageIds)
    ? body.pageIds.filter((p): p is string => typeof p === 'string')
    : existing.pageIds

  const built = buildClientShareSnapshot(loaded.scene, pageIds)
  if (!built.ok) {
    return NextResponse.json({ error: built.error }, { status: 422 })
  }

  const updated = await refreshClientPageShareSnapshot(
    shareId,
    built.snapshot,
    built.snapshot.pages.map((p) => p.id),
  )
  if (!updated) return NextResponse.json({ error: 'not-found' }, { status: 404 })
  return NextResponse.json({ share: toPublicMeta(updated) })
}
