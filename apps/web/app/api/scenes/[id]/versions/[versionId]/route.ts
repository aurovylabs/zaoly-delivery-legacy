import { NextResponse } from 'next/server'
import { getSceneVersion } from '../../../../../../lib/scene/version-store'


export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string; versionId: string }> }
) {
  const { id: sceneId, versionId } = await props.params

  const checkpoint = await getSceneVersion(sceneId, versionId)
  if (!checkpoint) {
    return NextResponse.json(
      { error: `Version "${versionId}" not found for scene "${sceneId}".` },
      { status: 404 }
    )
  }

  return NextResponse.json({
    ok: true,
    checkpoint,
  })
}
