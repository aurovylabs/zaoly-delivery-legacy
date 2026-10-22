import { NextResponse } from 'next/server'
import { auditSceneContent } from '../../../../../lib/scene/scene-content-audit'
import {
  isSceneApiAccess,
  requireSceneApiAccess,
} from '../../../../../lib/require-scene-api-access'
import {
  isSceneForViewer,
  requireSceneForViewer,
} from '../../../../../lib/require-scene-collection-access'


/** GET /api/scenes/:id/content-audit — Spec: scene-content-audit.md */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const access = await requireSceneApiAccess(req)
  if (!isSceneApiAccess(access)) return access

  const { id } = await ctx.params
  const loaded = await requireSceneForViewer(id, access.userId, { serviceMode: access.mode === 'service' })
  if (!isSceneForViewer(loaded)) return loaded

  return NextResponse.json(auditSceneContent(loaded.scene))
}
