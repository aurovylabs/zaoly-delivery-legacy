import { NextResponse } from 'next/server'
import type { SceneBreakpointId } from '@zaoly/contracts'
import { getScene, upsertScene } from '../../../../../lib/scene/scene-store'
import { publishSceneUpdated } from '../../../../../lib/scene/scene-events'
import { saveSiteKitComposition } from '../../../../../lib/site-kit/composition-write'
import {
  bindPagePatternOnScene,
  prepareCompositionFromPage,
  uniquePagePatternNames,
} from '../../../../../lib/site-kit/prepare-composition-from-page'
import { materializeScenePages, resolveActivePageId } from '../../../../../lib/scene/scene-pages'
import {
  isSceneApiAccess,
  requireSceneApiAccess,
} from '../../../../../lib/require-scene-api-access'
import { isRealPlatformProjectId } from '../../../../../lib/platform-project-id'


/** Save page artboard(s) as Site Kit Pattern(s). Spec: page-as-pattern.md */
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
    pageId?: string
    name?: string
    allPages?: boolean
    breakpoint?: SceneBreakpointId
  }

  if (!rec.sceneId || typeof rec.sceneId !== 'string') {
    return NextResponse.json(
      { ok: false, error: 'sceneId required', code: 'missing-scene-id' },
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

  if (!isRealPlatformProjectId(scene.platformProjectId)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Bind a Collection before Save page as Pattern',
        code: 'missing-platform-project-id',
      },
      { status: 400 },
    )
  }

  const materialized = materializeScenePages(scene)
  const pages = materialized.pages ?? []
  const allPages = rec.allPages === true
  const targetPages = allPages
    ? pages
    : [
        pages.find(
          (p) =>
            p.id ===
            (typeof rec.pageId === 'string' && rec.pageId.trim()
              ? rec.pageId.trim()
              : resolveActivePageId(pages, materialized.activePageId)),
        ),
      ].filter(Boolean) as typeof pages

  if (!targetPages.length) {
    return NextResponse.json(
      { ok: false, error: 'No pages to save', code: 'missing-page' },
      { status: 400 },
    )
  }

  const names = uniquePagePatternNames(
    targetPages.map((p) => ({ id: p.id, name: p.name })),
    !allPages && typeof rec.name === 'string' && rec.name.trim()
      ? { [targetPages[0]!.id]: rec.name.trim() }
      : undefined,
  )

  let working = materialized
  const results: Array<{
    pageId: string
    exportName: string
    masterId: string
    componentId: string
    storyTitle: string
  }> = []

  for (const page of targetPages) {
    const name = names[page.id] ?? page.name
    const prepared = prepareCompositionFromPage({
      scene: working,
      pageId: page.id,
      name,
      breakpoint: rec.breakpoint,
    })
    if (!prepared.ok) {
      return NextResponse.json(prepared, { status: 400 })
    }

    const saved = await saveSiteKitComposition({
      name,
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
    if (!saved.ok) {
      const status =
        saved.code === 'disk-unwritable' || saved.code === 'path-escape' ? 500 : 400
      return NextResponse.json(saved, { status })
    }

    const bound = bindPagePatternOnScene(
      prepared.scene,
      prepared.masterId,
      saved.exportName,
    )
    if (!bound.ok) {
      return NextResponse.json(
        { ok: false, error: bound.reason, code: 'bind-failed' },
        { status: 400 },
      )
    }
    working = bound.scene
    results.push({
      pageId: page.id,
      exportName: saved.exportName,
      masterId: prepared.masterId,
      componentId: saved.componentId,
      storyTitle: saved.storyTitle,
    })
  }

  const primary = results[0]!
  const saved = await upsertScene({ ...working, id: rec.sceneId })
  publishSceneUpdated({
    sceneId: rec.sceneId,
    updatedAt: saved.updatedAt,
    platformProjectId: saved.platformProjectId ?? null,
    source: 'site_kit_page_save',
  })
  return NextResponse.json({
    ok: true,
    sceneId: rec.sceneId,
    scene: saved,
    updatedAt: saved.updatedAt,
    exportName: primary.exportName,
    masterId: primary.masterId,
    componentId: primary.componentId,
    storyTitle: primary.storyTitle,
    results,
  })
}
