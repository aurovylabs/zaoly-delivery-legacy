import { NextResponse } from 'next/server'
import {
  isSceneApiAccess,
  requireSceneApiAccess,
} from '../../../../../lib/require-scene-api-access'
import {
  requireSceneForViewer,
  isSceneForViewer,
} from '../../../../../lib/require-scene-collection-access'
import {
  listSceneVersions,
  createSceneVersion,
} from '../../../../../lib/scene/version-store'
import type { CreateSceneVersionInput } from '@zaoly/contracts'


export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const access = await requireSceneApiAccess(req)
  if (!isSceneApiAccess(access)) return access
  const { id } = await ctx.params
  const loaded = await requireSceneForViewer(id, access.userId, {
    serviceMode: access.mode === 'service',
  })
  if (!isSceneForViewer(loaded)) return loaded

  const versions = await listSceneVersions(id)
  return NextResponse.json({
    sceneId: id,
    totalVersions: versions.length,
    versions,
  })
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const access = await requireSceneApiAccess(req)
  if (!isSceneApiAccess(access)) return access
  const { id } = await ctx.params
  const loaded = await requireSceneForViewer(id, access.userId, {
    serviceMode: access.mode === 'service',
  })
  if (!isSceneForViewer(loaded)) return loaded

  try {
    const body = (await req.json()) as CreateSceneVersionInput
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: 'Missing checkpoint name' }, { status: 400 })
    }

    const checkpoint = await createSceneVersion(
      id,
      body,
      {
        id: access.userId,
        name: access.userId.split('@')[0] || 'Collaborator',
      },
    )

    return NextResponse.json({ ok: true, version: checkpoint }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create version' },
      { status: 500 },
    )
  }
}
