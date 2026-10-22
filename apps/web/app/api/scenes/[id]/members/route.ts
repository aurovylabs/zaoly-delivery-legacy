import { NextResponse } from 'next/server'
import {
  isSceneApiAccess,
  requireSceneApiAccess,
} from '../../../../../lib/require-scene-api-access'
import {
  isSceneForViewer,
  requireSceneForViewer,
  resolveSceneAccessRole,
} from '../../../../../lib/require-scene-collection-access'
import { sendSceneSharedEmail, voidSystemMail } from '../../../../../lib/mail/system-mail'
import {
  getUserByEmail,
  listSceneMembers,
  upsertSceneMember,
  type SceneMemberRole,
} from '../../../../../lib/users/user-store'


export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const access = await requireSceneApiAccess(req)
  if (!isSceneApiAccess(access)) return access
  const { id } = await ctx.params
  const loaded = await requireSceneForViewer(id, access.userId)
  if (!isSceneForViewer(loaded)) return loaded
  const members = await listSceneMembers(id)
  return NextResponse.json({
    ownerUserId: loaded.scene.ownerUserId ?? null,
    members,
  })
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const access = await requireSceneApiAccess(req)
  if (!isSceneApiAccess(access)) return access
  const { id } = await ctx.params
  const loaded = await requireSceneForViewer(id, access.userId)
  if (!isSceneForViewer(loaded)) return loaded
  const role = await resolveSceneAccessRole(loaded.scene, access.userId)
  if (role !== 'owner') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  let body: { email?: string; role?: string }
  try {
    body = (await req.json()) as { email?: string; role?: string }
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 })
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const memberRole: SceneMemberRole = body.role === 'editor' ? 'editor' : 'viewer'
  if (!email) return NextResponse.json({ error: 'invalid-email' }, { status: 400 })
  const user = await getUserByEmail(email)
  if (!user || user.disabled) {
    return NextResponse.json({ error: 'user_not_found' }, { status: 404 })
  }
  if (user.id === loaded.scene.ownerUserId) {
    return NextResponse.json({ error: 'is_owner' }, { status: 400 })
  }
  await upsertSceneMember(id, user.id, memberRole)
  voidSystemMail(
    sendSceneSharedEmail({
      to: user.email,
      sceneId: id,
      sceneName: loaded.scene.name?.trim() || id,
      role: memberRole,
    }),
  )
  const members = await listSceneMembers(id)
  return NextResponse.json({
    ownerUserId: loaded.scene.ownerUserId ?? null,
    members,
  })
}
