import { NextResponse } from 'next/server'
import {
  isSceneApiAccess,
  requireSceneApiAccess,
} from '../../../lib/require-scene-api-access'
import { listScenesForViewer } from '../../../lib/require-scene-collection-access'
import { sceneToCompositionSummary } from '../../../lib/scene/scene-summary'


/**
 * Composition summaries from scene-store (Collection ACL).
 * Spec: `specs/api/catalog.md` · same auth as `GET /api/scenes`.
 */
export async function GET(req: Request) {
  const access = await requireSceneApiAccess(req)
  if (!isSceneApiAccess(access)) return access
  const url = new URL(req.url)
  const platformProjectId = url.searchParams.get('platformProjectId')
  const result = await listScenesForViewer(access.userId, platformProjectId)
  if (result instanceof NextResponse) return result
  return NextResponse.json({
    items: result.scenes.map(sceneToCompositionSummary),
  })
}
