import { NextResponse } from 'next/server'
import {
  normalizePreviewBreakpoint,
  renderScenePreview,
} from '../../../../../lib/scene/scene-preview'
import {
  isSceneApiAccess,
  requireSceneApiAccess,
} from '../../../../../lib/require-scene-api-access'
import {
  isSceneForViewer,
  requireSceneForViewer,
} from '../../../../../lib/require-scene-collection-access'

export const maxDuration = 60

async function handlePreview(
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
  let breakpoint = url.searchParams.get('breakpoint')
  let pageId = url.searchParams.get('pageId') ?? undefined

  if (req.method === 'POST') {
    try {
      const body = (await req.json()) as { breakpoint?: string; pageId?: string }
      if (body.breakpoint) breakpoint = body.breakpoint
      if (body.pageId) pageId = body.pageId
    } catch {
      // empty body ok
    }
  }

  const result = await renderScenePreview(scene, {
    breakpoint: normalizePreviewBreakpoint(breakpoint),
    pageId: pageId?.trim() || undefined,
  })

  const status = result.error?.startsWith('page-not-found') ? 404 : 200
  return NextResponse.json(result, { status })
}

/** GET/POST /api/scenes/:id/preview — Spec: scene-preview.md */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return handlePreview(req, ctx)
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return handlePreview(req, ctx)
}
