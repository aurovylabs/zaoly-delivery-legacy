import { NextResponse } from 'next/server'
import type { SceneOp } from '@zaoly/contracts'
import {
  applySceneOpBatch,
  SCENE_OPS_MAX_BATCH,
} from '../../../../../lib/scene/apply-scene-op-batch'
import { publishSceneUpdated } from '../../../../../lib/scene/scene-events'
import { logSceneOpAudit } from '../../../../../lib/scene/scene-op-audit'
import { upsertScene } from '../../../../../lib/scene/scene-store'
import {
  isSceneApiAccess,
  requireSceneApiAccess,
} from '../../../../../lib/require-scene-api-access'
import {
  forbidUnlessSceneWriteAccess,
  isSceneForViewer,
  requireSceneForViewer,
  withClaimedOwnerIfOrphan,
} from '../../../../../lib/require-scene-collection-access'
import { sceneUpdatedAtEquals } from '../../../../../lib/scene/normalize-updated-at'


const MAX_BODY_BYTES = 2 * 1024 * 1024

type SceneOpsRequest = {
  baseUpdatedAt?: string
  ops?: SceneOp[]
  clientBatchId?: string
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const access = await requireSceneApiAccess(req)
  if (!isSceneApiAccess(access)) return access

  const { id } = await ctx.params

  const contentLength = Number(req.headers.get('content-length') ?? 0)
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'payload-too-large' }, { status: 413 })
  }

  let body: SceneOpsRequest
  try {
    body = (await req.json()) as SceneOpsRequest
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 })
  }

  if (!body.baseUpdatedAt || typeof body.baseUpdatedAt !== 'string') {
    return NextResponse.json({ error: 'missing-base-updated-at' }, { status: 400 })
  }

  if (!Array.isArray(body.ops)) {
    return NextResponse.json({ error: 'empty-batch' }, { status: 400 })
  }

  if (body.ops.length === 0) {
    return NextResponse.json({ error: 'empty-batch' }, { status: 400 })
  }

  if (body.ops.length > SCENE_OPS_MAX_BATCH) {
    return NextResponse.json({ error: 'batch-too-large' }, { status: 400 })
  }

  const loaded = await requireSceneForViewer(id, access.userId, { serviceMode: access.mode === 'service' })
  if (!isSceneForViewer(loaded)) return loaded
  const scene = loaded.scene
  const writeDenied = await forbidUnlessSceneWriteAccess(access.userId, scene)
  if (writeDenied) return writeDenied

  if (!sceneUpdatedAtEquals(body.baseUpdatedAt, scene.updatedAt)) {
    return NextResponse.json(
      {
        error: 'stale-scene',
        scene: { id: scene.id, updatedAt: scene.updatedAt },
      },
      { status: 409 },
    )
  }

  const batch = applySceneOpBatch(scene, body.ops)
  if (!batch.ok) {
    const message = batch.reason
    if (batch.error === 'op-not-persisted') {
      return NextResponse.json(
        {
          error: batch.error,
          message,
          failedIndex: batch.failedIndex,
          reason: batch.reason,
          op: batch.op,
        },
        { status: 400 },
      )
    }
    if (batch.error === 'op-rejected') {
      return NextResponse.json(
        {
          error: batch.error,
          message,
          failedIndex: batch.failedIndex,
          reason: batch.reason,
          op: batch.op,
        },
        { status: 400 },
      )
    }
    return NextResponse.json(
      {
        error: batch.error,
        message,
        failedIndex: batch.failedIndex,
        reason: batch.reason,
      },
      { status: 400 },
    )
  }

  const saved = await upsertScene(
    withClaimedOwnerIfOrphan({ ...batch.scene, id }, access.userId),
  )
  publishSceneUpdated({
    sceneId: id,
    updatedAt: saved.updatedAt,
    platformProjectId: saved.platformProjectId ?? null,
    source: 'scene_ops',
  })
  logSceneOpAudit({
    sceneId: id,
    actorUserId: access.userId,
    actorLabel: access.mode === 'service' ? access.actorLabel : undefined,
    mode: access.mode,
    appliedCount: batch.appliedCount,
    clientBatchId: body.clientBatchId,
    source: 'scene_ops',
  })

  return NextResponse.json({
    scene: saved,
    appliedCount: batch.appliedCount,
    updatedAt: saved.updatedAt,
  })
}
