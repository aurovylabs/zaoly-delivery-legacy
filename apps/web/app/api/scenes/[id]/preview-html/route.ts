import { NextResponse } from 'next/server'
import {
  normalizePreviewBreakpoint,
  type ScenePreviewBreakpoint,
} from '../../../../../lib/scene/scene-preview-breakpoints'
import {
  resolveScenePreviewHtmlForPage,
  type ScenePreviewHtmlSource,
} from '../../../../../lib/scene/scene-preview-html-page'
import {
  isSceneApiAccess,
  requireSceneApiAccess,
} from '../../../../../lib/require-scene-api-access'
import {
  isSceneForViewer,
  requireSceneForViewer,
} from '../../../../../lib/require-scene-collection-access'


function parseSource(raw: string | null): ScenePreviewHtmlSource {
  return raw === 'import' ? 'import' : 'scene'
}

/** GET /api/scenes/:id/preview-html — HTML document for editor iframe preview. */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const access = await requireSceneApiAccess(req)
  if (!isSceneApiAccess(access)) return access

  const { id } = await ctx.params
  const loaded = await requireSceneForViewer(id, access.userId, { serviceMode: access.mode === 'service' })
  if (!isSceneForViewer(loaded)) return loaded
  const scene = loaded.scene

  const url = new URL(req.url)
  const pageId = url.searchParams.get('pageId') ?? undefined
  const breakpoint = normalizePreviewBreakpoint(url.searchParams.get('breakpoint')) as ScenePreviewBreakpoint
  const source = parseSource(url.searchParams.get('source'))
  const format = url.searchParams.get('format')

  const result = resolveScenePreviewHtmlForPage(scene, { pageId, breakpoint, source })
  if (!result.ok) {
    const status = result.code === 'page-not-found' ? 404 : 404
    return NextResponse.json(
      { error: result.code, message: result.message, pageId: result.pageId },
      { status },
    )
  }

  if (format === 'json') {
    return NextResponse.json({
      sceneId: id,
      pageId: result.pageId,
      source: result.source,
      html: result.html,
      importSourceHtmlAt: result.importSourceHtmlAt,
      updatedAt: scene.updatedAt,
    })
  }

  return new NextResponse(result.html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Zaoly-Preview-Source': result.source,
      'X-Zaoly-Preview-Page-Id': result.pageId,
    },
  })
}
