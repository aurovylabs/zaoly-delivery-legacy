import { NextResponse } from 'next/server'
import { resolveCraftDebugForPage } from '../../../../../lib/scene/resolve-craft-debug'
import {
  isSceneApiAccess,
  requireSceneApiAccess,
} from '../../../../../lib/require-scene-api-access'
import {
  isSceneForViewer,
  requireSceneForViewer,
} from '../../../../../lib/require-scene-collection-access'


/** GET /api/scenes/:id/craft-debug — Craft Debug Bundle JSON. Spec: craft-debug.md */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const access = await requireSceneApiAccess(req)
  if (!isSceneApiAccess(access)) return access

  const { id } = await ctx.params
  const loaded = await requireSceneForViewer(id, access.userId, { serviceMode: access.mode === 'service' })
  if (!isSceneForViewer(loaded)) return loaded
  const scene = loaded.scene

  const url = new URL(req.url)
  const pageId = url.searchParams.get('pageId') ?? undefined
  const result = resolveCraftDebugForPage(scene, { pageId })
  if (!result.ok) {
    return NextResponse.json(
      { error: result.code, message: result.message, pageId: result.pageId },
      { status: 404 },
    )
  }

  return NextResponse.json({
    sceneId: id,
    pageId: result.pageId,
    updatedAt: scene.updatedAt,
    craftDebugAt: result.craftDebugAt ?? null,
    bundle: result.bundle,
    stored: result.stored,
    importSourceHtmlPreview: result.importSourceHtmlPreview ?? null,
  })
}
