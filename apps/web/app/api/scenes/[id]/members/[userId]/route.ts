import { NextResponse } from 'next/server'
import {
  isSceneApiAccess,
  requireSceneApiAccess,
} from '../../../../../../lib/require-scene-api-access'
import {
  isSceneForViewer,
  requireSceneForViewer,
  resolveSceneAccessRole,
} from '../../../../../../lib/require-scene-collection-access'
import {
  deleteSceneMember,
  listSceneMembers,
  upsertSceneMember,
  type SceneMemberRole,
} from '../../../../../../lib/users/user-store'


export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string; userId: string }> },
) {
  const access = await requireSceneApiAccess(req)
  if (!isSceneApiAccess(access)) return access
  const { id, userId } = await ctx.params
  const loaded = await requireSceneForViewer(id, access.userId)
  if (!isSceneForViewer(loaded)) return loaded
  if ((await resolveSceneAccessRole(loaded.scene, access.userId)) !== 'owner') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  let body: { role?: string }
  try {
    body = (await req.json()) as { role?: string }
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 })
  }
  const memberRole: SceneMemberRole = body.role === 'editor' ? 'editor' : 'viewer'
  await upsertSceneMember(id, userId, memberRole)
  return NextResponse.json({
    ownerUserId: loaded.scene.ownerUserId ?? null,
    members: await listSceneMembers(id),
  })
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string; userId: string }> },
) {
  const access = await requireSceneApiAccess(req)
  if (!isSceneApiAccess(access)) return access
  const { id, userId } = await ctx.params
  const loaded = await requireSceneForViewer(id, access.userId)
  if (!isSceneForViewer(loaded)) return loaded
  if ((await resolveSceneAccessRole(loaded.scene, access.userId)) !== 'owner') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  const ok = await deleteSceneMember(id, userId)
  if (!ok) return NextResponse.json({ error: 'not-found' }, { status: 404 })
  return NextResponse.json({
    ownerUserId: loaded.scene.ownerUserId ?? null,
    members: await listSceneMembers(id),
  })
}
