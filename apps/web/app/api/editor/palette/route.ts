import { buildEditorPaletteCatalog } from '../../../../lib/editor-palette-catalog'
import {
  isSceneApiAccess,
  requireSceneApiAccess,
} from '../../../../lib/require-scene-api-access'


export async function GET(req: Request) {
  const access = await requireSceneApiAccess(req)
  if (!isSceneApiAccess(access)) return access

  return Response.json(buildEditorPaletteCatalog())
}
