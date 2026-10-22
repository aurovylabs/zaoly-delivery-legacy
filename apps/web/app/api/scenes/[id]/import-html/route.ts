import { NextResponse } from 'next/server'
import { applyHtmlImport } from '../../../../../lib/scene/apply-html-import'
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


const MAX_BODY_BYTES = 2 * 1024 * 1024

type ImportHtmlRequest = {
  baseUpdatedAt?: string
  html?: string
  pageName?: string
  pageId?: string
  mode?: 'replace-page-root'
  craftMeta?: {
    spirion?: {
      captureIds?: string[]
      lookContractSummary?: Record<string, unknown>
      pageRhythmSummary?: Record<string, unknown>
      avoid?: string[]
    }
  }
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

  let body: ImportHtmlRequest
  try {
    body = (await req.json()) as ImportHtmlRequest
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 })
  }

  if (!body.baseUpdatedAt || typeof body.baseUpdatedAt !== 'string') {
    return NextResponse.json({ error: 'missing-base-updated-at' }, { status: 400 })
  }

  if (typeof body.html !== 'string') {
    return NextResponse.json({ error: 'html-empty', message: 'html is required' }, { status: 400 })
  }

  const loaded = await requireSceneForViewer(id, access.userId, { serviceMode: access.mode === 'service' })
  if (!isSceneForViewer(loaded)) return loaded
  const scene = loaded.scene
  const writeDenied = await forbidUnlessSceneWriteAccess(access.userId, scene)
  if (writeDenied) return writeDenied

  if (body.baseUpdatedAt !== scene.updatedAt) {
    return NextResponse.json(
      {
        error: 'stale-scene',
        scene: { id: scene.id, updatedAt: scene.updatedAt },
      },
      { status: 409 },
    )
  }

  const result = await applyHtmlImport(scene, {
    html: body.html,
    pageName: body.pageName,
    pageId: body.pageId,
    mode: body.mode,
    craftMeta: body.craftMeta,
  })

  if (!result.ok) {
    const status = result.code === 'page-not-found' ? 400 : 400
    return NextResponse.json(
      { error: result.code, message: result.message },
      { status },
    )
  }

  const saved = await upsertScene(
    withClaimedOwnerIfOrphan({ ...result.scene, id }, access.userId),
  )
  publishSceneUpdated({
    sceneId: id,
    updatedAt: saved.updatedAt,
    platformProjectId: saved.platformProjectId ?? null,
    source: 'scene_import_html',
  })
  logSceneOpAudit({
    sceneId: id,
    actorUserId: access.userId,
    actorLabel: access.mode === 'service' ? access.actorLabel : undefined,
    mode: access.mode,
    appliedCount: result.stats.nodeCount,
    clientBatchId: 'import-html',
    source: 'scene_import_html',
  })

  return NextResponse.json({
    scene: saved,
    pageId: result.pageId,
    warnings: result.warnings,
    stats: result.stats,
    craftDebug: result.craftDebug,
    updatedAt: saved.updatedAt,
  })
}
