/**
 * POST/GET /api/scenes/:id/client-shares
 * Spec: specs/api/client-page-share.md (P1+P2)
 */
import { NextResponse } from 'next/server'
import { normalizeShareEmailList } from '../../../../../lib/client-page-share/email'
import {
  assertCreateAllowedByPolicy,
  resolveClientSharePolicy,
} from '../../../../../lib/client-page-share/policy'
import { emitClientShareAuditEvent } from '../../../../../lib/client-page-share/events'
import { buildClientShareSnapshot } from '../../../../../lib/client-page-share/snapshot'
import {
  createClientPageShare,
  listClientPageSharesForScene,
  toPublicMeta,
  type ClientShareAccessMode,
  type ClientShareContentMode,
} from '../../../../../lib/client-page-share/store'
import { isRealPlatformProjectId } from '../../../../../lib/platform-project-id'
import {
  isSceneApiAccess,
  requireSceneApiAccess,
} from '../../../../../lib/require-scene-api-access'
import {
  isSceneForViewer,
  requireSceneForViewer,
} from '../../../../../lib/require-scene-collection-access'
import {
  absoluteClientPageShareUrl,
  isClientPageShareEnabled,
} from '../../../../../lib/runtime-config'

export async function GET(
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

  const shares = await listClientPageSharesForScene(id)
  return NextResponse.json({
    shares: shares.map((record) => ({
      ...toPublicMeta(record),
      shareUrl: record.tokenPlain
        ? absoluteClientPageShareUrl(record.tokenPlain)
        : null,
    })),
  })
}

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

  const platformProjectId = loaded.scene.platformProjectId
  if (!isRealPlatformProjectId(platformProjectId)) {
    return NextResponse.json({ error: 'collection_required' }, { status: 400 })
  }

  const body = (await req.json().catch(() => ({}))) as {
    pageIds?: unknown
    accessMode?: unknown
    password?: unknown
    emails?: unknown
    emailAllowlist?: unknown
    commentsEnabled?: unknown
    expiresInDays?: unknown
    label?: unknown
    contentMode?: unknown
  }

  const pageIds = Array.isArray(body.pageIds)
    ? body.pageIds.filter((p): p is string => typeof p === 'string')
    : []

  let accessMode: ClientShareAccessMode = 'password'
  if (body.accessMode === 'link') accessMode = 'link'
  else if (body.accessMode === 'email_allowlist') accessMode = 'email_allowlist'

  const contentMode: ClientShareContentMode =
    body.contentMode === 'live_head' ? 'live_head' : 'pinned_revision'

  const policy = await resolveClientSharePolicy(platformProjectId!, access.userId)
  const policyError = assertCreateAllowedByPolicy(policy, { accessMode, contentMode })
  if (policyError) {
    return NextResponse.json(
      { error: policyError },
      { status: policyError === 'client_share_disabled' ? 403 : 422 },
    )
  }

  const built = buildClientShareSnapshot(loaded.scene, pageIds)
  if (!built.ok) {
    return NextResponse.json({ error: built.error }, { status: 422 })
  }

  const expiresInDays =
    typeof body.expiresInDays === 'number' && Number.isFinite(body.expiresInDays)
      ? Math.floor(body.expiresInDays)
      : undefined
  const password = typeof body.password === 'string' ? body.password : undefined
  const label = typeof body.label === 'string' ? body.label : null
  const emailAllowlist = normalizeShareEmailList(body.emails ?? body.emailAllowlist)
  const commentsEnabled = body.commentsEnabled === true

  try {
    const { record, token } = await createClientPageShare({
      platformProjectId: platformProjectId!,
      sceneId: loaded.scene.id,
      pageIds: built.snapshot.pages.map((p) => p.id),
      snapshot: built.snapshot,
      accessMode,
      contentMode,
      password,
      emailAllowlist,
      commentsEnabled,
      expiresInDays,
      label,
      createdByUserId: access.userId,
      maxTtlDays: policy.maxTtlDays,
    })
    emitClientShareAuditEvent({
      platformProjectId: record.platformProjectId,
      shareId: record.id,
      eventType: 'client_share.created',
      actorUserId: access.userId,
      meta: {
        accessMode: record.accessMode,
        contentMode: record.contentMode,
        pageCount: record.pageIds.length,
      },
    })
    return NextResponse.json(
      {
        id: record.id,
        token,
        shareUrl: absoluteClientPageShareUrl(token),
        accessMode: record.accessMode,
        contentMode: record.contentMode,
        expiresAt: record.expiresAt,
        pageIds: record.pageIds,
        label: record.label,
        emailAllowlistCount: record.emailAllowlist.length,
        commentsEnabled: record.commentsEnabled,
      },
      { status: 201 },
    )
  } catch (e) {
    const code = e instanceof Error ? e.message : 'create_failed'
    const status =
      code === 'ttl_invalid' ||
      code === 'password_required' ||
      code === 'email_allowlist_required'
        ? 422
        : 500
    return NextResponse.json({ error: code }, { status })
  }
}
