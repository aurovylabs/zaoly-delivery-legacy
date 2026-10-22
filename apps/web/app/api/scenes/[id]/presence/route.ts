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
  getScenePresence,
  removePresenceUser,
} from '../../../../../lib/scene/presence-store'


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

  const state = await getScenePresence(id)
  return NextResponse.json(state)
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const access = await requireSceneApiAccess(req)
  if (!isSceneApiAccess(access)) return access
  const { id } = await ctx.params

  await removePresenceUser(id, access.userId)
  return NextResponse.json({ ok: true })
}
