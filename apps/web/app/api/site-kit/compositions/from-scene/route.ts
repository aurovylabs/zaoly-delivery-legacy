import { NextResponse } from 'next/server'
import type { SceneBreakpointId } from '@zaoly/contracts'
import { getScene } from '../../../../../lib/scene/scene-store'
import { saveSiteKitComposition } from '../../../../../lib/site-kit/composition-write'
import { prepareCompositionFromScene } from '../../../../../lib/site-kit/prepare-composition-from-scene'
import {
  isSceneApiAccess,
  requireSceneApiAccess,
} from '../../../../../lib/require-scene-api-access'


/** P90 Phase 5 — publish Master from live scene (expand + validate + save). */
export async function POST(request: Request) {
  const access = await requireSceneApiAccess(request)
  if (!isSceneApiAccess(access)) return access

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const rec = body as {
    sceneId?: string
    masterId?: string
    name?: string
    instanceNodeId?: string
    breakpoint?: SceneBreakpointId
  }

  if (!rec.sceneId || typeof rec.sceneId !== 'string') {
    return NextResponse.json(
      { ok: false, error: 'sceneId required', code: 'missing-scene-id' },
      { status: 400 },
    )
  }
  if (!rec.masterId || typeof rec.masterId !== 'string') {
    return NextResponse.json(
      { ok: false, error: 'masterId required', code: 'missing-master-id' },
      { status: 400 },
    )
  }
  if (!rec.name || typeof rec.name !== 'string') {
    return NextResponse.json(
      { ok: false, error: 'name required', code: 'invalid-name' },
      { status: 400 },
    )
  }

  const scene = await getScene(rec.sceneId)
  if (!scene) {
    return NextResponse.json(
      { ok: false, error: 'Scene not found', code: 'not-found' },
      { status: 404 },
    )
  }

  const prepared = prepareCompositionFromScene({
    scene,
    masterId: rec.masterId,
    name: rec.name,
    instanceNodeId:
      typeof rec.instanceNodeId === 'string' ? rec.instanceNodeId : undefined,
    breakpoint: rec.breakpoint,
  })
  if (!prepared.ok) {
    return NextResponse.json(prepared, { status: 400 })
  }

  const result = await saveSiteKitComposition({
    name: rec.name,
    root: prepared.root,
    platformProjectId: scene.platformProjectId,
    ...(prepared.named
      ? {
          variants: prepared.named.variants,
          defaultVariantId: prepared.named.defaultVariantId,
          ...(prepared.named.axes?.length ? { axes: prepared.named.axes } : {}),
        }
      : {}),
  })
  if (!result.ok) {
    const status =
      result.code === 'disk-unwritable' || result.code === 'path-escape' ? 500 : 400
    return NextResponse.json(result, { status })
  }

  return NextResponse.json({
    ...result,
    masterId: prepared.masterId,
    sceneId: rec.sceneId,
  })
}
