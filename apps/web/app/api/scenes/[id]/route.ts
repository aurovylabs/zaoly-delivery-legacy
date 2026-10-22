import { NextResponse } from 'next/server'
import {
  bindScenePlatformProject,
  deleteScene,
  getScene,
  renameScene,
  upsertScene,
} from '../../../../lib/scene/scene-store'
import { publishSceneUpdated } from '../../../../lib/scene/scene-events'
import {
  mirrorDesignerRepliesToShares,
  syncAllGuestCommentsIntoScene,
} from '../../../../lib/client-page-share/project-guest-comments'
import { requireApiSession } from '../../../../lib/require-api-session'
import { isAuthBypassEnabled } from '../../../../lib/runtime-config'
import {
  isSceneApiAccess,
  requireSceneApiAccess,
} from '../../../../lib/require-scene-api-access'
import {
  forbidUnlessPlatformProjectAccess,
  forbidUnlessSceneCollectionAccess,
  forbidUnlessSceneWriteAccess,
  isSceneForViewer,
  requireSceneForViewer,
  resolveSceneAccessRole,
  withClaimedOwnerIfOrphan,
} from '../../../../lib/require-scene-collection-access'
import type { CompositionScene } from '@zaoly/contracts'
import { sceneUpdatedAtEquals } from '../../../../lib/scene/normalize-updated-at'


export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const access = await requireSceneApiAccess(req)
  if (!isSceneApiAccess(access)) return access
  const { id } = await ctx.params
  const loaded = await requireSceneForViewer(id, access.userId, { serviceMode: access.mode === 'service' })
  if (!isSceneForViewer(loaded)) return loaded
  // P8: pull client-share guest pins into scene.comments so the editor shows them.
  const synced = await syncAllGuestCommentsIntoScene(id)
  return NextResponse.json({ scene: synced ?? loaded.scene })
}

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = await requireApiSession()
  if (denied) return denied
  const access = await requireSceneApiAccess(req)
  if (!isSceneApiAccess(access)) return access
  const { id } = await ctx.params
  try {
    const body = (await req.json()) as CompositionScene & { baseUpdatedAt?: string }
    if (!body.baseUpdatedAt || typeof body.baseUpdatedAt !== 'string') {
      return NextResponse.json({ error: 'missing-base-updated-at' }, { status: 400 })
    }
    if (body.id && body.id !== id) {
      return NextResponse.json({ error: 'Id mismatch' }, { status: 400 })
    }
    const current = await getScene(id)
    if (!current) {
      return NextResponse.json({ error: 'not-found' }, { status: 404 })
    }
    const serviceOpts = { serviceMode: access.mode === 'service' }
    const aclCurrent = await forbidUnlessSceneCollectionAccess(
      access.userId,
      current,
      serviceOpts,
    )
    if (aclCurrent) return aclCurrent
    const writeDenied = await forbidUnlessSceneWriteAccess(access.userId, current)
    if (writeDenied) return writeDenied
    const aclBody = await forbidUnlessPlatformProjectAccess(
      access.userId,
      body.platformProjectId ?? current.platformProjectId,
      serviceOpts,
    )
    if (aclBody) return aclBody
    if (!sceneUpdatedAtEquals(body.baseUpdatedAt, current.updatedAt)) {
      return NextResponse.json(
        {
          error: 'stale-scene',
          scene: { id: current.id, updatedAt: current.updatedAt },
        },
        { status: 409 },
      )
    }
    const { baseUpdatedAt: _lock, ...sceneBody } = body
    const scene = await upsertScene(
      withClaimedOwnerIfOrphan({ ...sceneBody, id }, access.userId),
    )
    try {
      await mirrorDesignerRepliesToShares(scene)
    } catch {
      // Share mirror is best-effort; scene save already succeeded.
    }
    publishSceneUpdated({
      sceneId: id,
      updatedAt: scene.updatedAt,
      platformProjectId: scene.platformProjectId ?? null,
      source: 'scene_put',
    })
    return NextResponse.json({ scene })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Invalid scene' },
      { status: 400 },
    )
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = await requireApiSession()
  if (denied) return denied
  const access = await requireSceneApiAccess(req)
  if (!isSceneApiAccess(access)) return access
  const { id } = await ctx.params
  try {
    const body = (await req.json()) as {
      platformProjectId?: string | null
      name?: string
    }
    const hasName = 'name' in body
    const hasProject = 'platformProjectId' in body
    if (!hasName && !hasProject) {
      return NextResponse.json(
        { error: 'name or platformProjectId required' },
        { status: 400 },
      )
    }
    const current = await getScene(id)
    if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const serviceOpts = { serviceMode: access.mode === 'service' }
    const aclCurrent = await forbidUnlessSceneCollectionAccess(
      access.userId,
      current,
      serviceOpts,
    )
    if (aclCurrent) return aclCurrent
    const writeDenied = await forbidUnlessSceneWriteAccess(access.userId, current)
    if (writeDenied) return writeDenied

    let scene = current
    if (hasName) {
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      if (!name) {
        return NextResponse.json({ error: 'name required' }, { status: 400 })
      }
      const renamed = await renameScene(id, name)
      if (!renamed) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      scene = renamed
    }
    if (hasProject) {
      const aclTarget = await forbidUnlessPlatformProjectAccess(
        access.userId,
        body.platformProjectId,
        serviceOpts,
      )
      if (aclTarget) return aclTarget
      const bound = await bindScenePlatformProject(id, body.platformProjectId ?? null)
      if (!bound) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      scene = bound
    }
    return NextResponse.json({ scene })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Invalid patch' },
      { status: 400 },
    )
  }
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = await requireApiSession()
  if (denied) return denied
  const access = await requireSceneApiAccess(req)
  if (!isSceneApiAccess(access)) return access
  const { id } = await ctx.params
  const loaded = await requireSceneForViewer(id, access.userId, {
    serviceMode: access.mode === 'service',
  })
  if (!isSceneForViewer(loaded)) return loaded
  const role = await resolveSceneAccessRole(loaded.scene, access.userId)
  if (role !== 'owner' && !isAuthBypassEnabled()) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  const ok = await deleteScene(id)
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  publishSceneUpdated({
    sceneId: id,
    updatedAt: new Date().toISOString(),
    platformProjectId: loaded.scene.platformProjectId ?? null,
    source: 'scene_delete',
  })
  return NextResponse.json({ ok: true })
}
