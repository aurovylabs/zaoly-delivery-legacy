import { NextResponse } from 'next/server'
import {
  isSceneApiAccess,
  requireSceneApiAccess,
} from '../../../../../../lib/require-scene-api-access'
import {
  requireSceneForViewer,
  isSceneForViewer,
} from '../../../../../../lib/require-scene-collection-access'
import { recordPresenceHeartbeat } from '../../../../../../lib/scene/presence-store'
import { presenceColorForUserId } from '../../../../../../lib/editor/presence-color'
import type { ScenePresenceUser } from '@zaoly/contracts'


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
    const body = (await req.json()) as Partial<ScenePresenceUser>
    const user: ScenePresenceUser = {
      userId: access.userId,
      name: body.name || access.userId.split('@')[0] || 'Collaborator',
      avatarUrl: body.avatarUrl,
      color: body.color || presenceColorForUserId(access.userId),
      pageId: body.pageId || 'page-home',
      cursor: body.cursor,
      selectedIds: Array.isArray(body.selectedIds) ? body.selectedIds : [],
      viewport: body.viewport,
      isIdle: Boolean(body.isIdle),
      lastSeenAt: new Date().toISOString(),
    }

    const state = await recordPresenceHeartbeat(id, user)
    return NextResponse.json({
      ok: true,
      sceneId: id,
      selfUserId: access.userId,
      activeUsersCount: state.users.length,
      users: state.users,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process presence heartbeat' },
      { status: 500 },
    )
  }
}
