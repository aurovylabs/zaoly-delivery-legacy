import { NextResponse } from 'next/server'
import { getScene } from '../../../../../../../lib/scene/scene-store'
import { getSceneVersion } from '../../../../../../../lib/scene/version-store'
import { compareScenes } from '../../../../../../../lib/scene/scene-diff'


export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string; versionId: string }> }
) {
  const { id: sceneId, versionId } = await props.params

  const [checkpoint, currentScene] = await Promise.all([
    getSceneVersion(sceneId, versionId),
    getScene(sceneId),
  ])

  if (!checkpoint) {
    return NextResponse.json(
      { error: `Version "${versionId}" not found for scene "${sceneId}".` },
      { status: 404 }
    )
  }

  if (!currentScene) {
    return NextResponse.json(
      { error: `Current scene "${sceneId}" not found.` },
      { status: 404 }
    )
  }

  const diff = compareScenes(checkpoint.snapshot, currentScene)

  return NextResponse.json({
    ok: true,
    versionId,
    diff,
  })
}
