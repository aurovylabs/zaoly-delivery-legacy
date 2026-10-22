import { NextResponse } from 'next/server'
import { listScenes, upsertScene } from '../../../lib/scene/scene-store'
import {
  isSceneApiAccess,
  requireSceneApiAccess,
} from '../../../lib/require-scene-api-access'
import {
  forbidUnlessPlatformProjectAccess,
  listScenesForViewer,
} from '../../../lib/require-scene-collection-access'
import type { CompositionScene } from '@zaoly/contracts'


export async function GET(req: Request) {
  const access = await requireSceneApiAccess(req)
  if (!isSceneApiAccess(access)) return access
  const url = new URL(req.url)
  const platformProjectId = url.searchParams.get('platformProjectId')
  const result = await listScenesForViewer(access.userId, platformProjectId)
  if (result instanceof NextResponse) return result
  return NextResponse.json({ scenes: result.scenes })
}

export async function POST(req: Request) {
  const access = await requireSceneApiAccess(req)
  if (!isSceneApiAccess(access)) return access
  try {
    const body = (await req.json()) as CompositionScene
    const acl = await forbidUnlessPlatformProjectAccess(
      access.userId,
      body.platformProjectId,
    )
    if (acl) return acl
    const scene = await upsertScene({
      ...body,
      ownerUserId: access.userId,
    })
    return NextResponse.json({ scene }, { status: 201 })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Invalid scene' },
      { status: 400 },
    )
  }
}
