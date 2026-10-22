import { NextResponse } from 'next/server'
import {
  isSceneApiAccess,
  requireSceneApiAccess,
} from '../../../../../../../lib/require-scene-api-access'
import {
  requireSceneForViewer,
  isSceneForViewer,
} from '../../../../../../../lib/require-scene-collection-access'
import { restoreSceneVersion } from '../../../../../../../lib/scene/version-store'


export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string; versionId: string }> },
) {
  const access = await requireSceneApiAccess(req)
  if (!isSceneApiAccess(access)) return access
  const { id, versionId } = await ctx.params
  const loaded = await requireSceneForViewer(id, access.userId, {
    serviceMode: access.mode === 'service',
  })
  if (!isSceneForViewer(loaded)) return loaded

  try {
    const result = await restoreSceneVersion(id, versionId, {
      id: access.userId,
      name: access.userId.split('@')[0] || 'Collaborator',
    })

    return NextResponse.json({
      ok: true,
      restoredVersionId: versionId,
      safetyBackupVersionId: result.safetyBackup.id,
      scene: {
        id: result.restored.id,
        name: result.restored.name,
        updatedAt: result.restored.updatedAt,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to restore version' },
      { status: 500 },
    )
  }
}
