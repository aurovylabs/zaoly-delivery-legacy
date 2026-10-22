import { NextResponse } from 'next/server'
import type { CompositionScene } from '@zaoly/contracts'
import { requireApiSession } from '../../../../../lib/require-api-session'
import {
  isSceneApiAccess,
  requireSceneApiAccess,
} from '../../../../../lib/require-scene-api-access'
import { forbidUnlessPlatformProjectAccess } from '../../../../../lib/require-scene-collection-access'
import {
  renderSurfaceExport,
  SurfaceExportError,
  type SurfaceExportFormat,
  type SurfaceExportScope,
} from '../../../../../lib/scene/surface-export'


/** WYSIWYG artboard PNG/PDF — specs/api/scene-surface-export.md */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = await requireApiSession()
  if (denied) return denied
  const access = await requireSceneApiAccess(req)
  if (!isSceneApiAccess(access)) return access
  const { id } = await ctx.params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  const raw = body as {
    scene?: CompositionScene
    format?: string
    scope?: string
    pageIds?: string[]
    breakpoint?: string
    scale?: number
  }
  if (!raw.scene || typeof raw.scene !== 'object' || typeof raw.scene.id !== 'string') {
    return NextResponse.json({ error: 'scene required' }, { status: 400 })
  }
  if (raw.scene.id !== id) {
    return NextResponse.json({ error: 'Id mismatch' }, { status: 400 })
  }
  if (!raw.scene.root || typeof raw.scene.root !== 'object') {
    return NextResponse.json({ error: 'Invalid scene root' }, { status: 400 })
  }
  if (raw.format !== 'png' && raw.format !== 'pdf') {
    return NextResponse.json({ error: 'format must be png or pdf' }, { status: 400 })
  }
  const format = raw.format as SurfaceExportFormat
  const scope: SurfaceExportScope | undefined =
    raw.scope === 'all' || raw.scope === 'active' ? raw.scope : undefined

  const acl = await forbidUnlessPlatformProjectAccess(
    access.userId,
    raw.scene.platformProjectId,
  )
  if (acl) return acl

  try {
    const result = await renderSurfaceExport(raw.scene, {
      format,
      scope,
      pageIds: Array.isArray(raw.pageIds) ? raw.pageIds : undefined,
      breakpoint: raw.breakpoint as CompositionScene['activeBreakpoint'],
      scale: raw.scale,
    })
    return new NextResponse(new Uint8Array(result.bytes), {
      status: 200,
      headers: {
        'Content-Type': result.mimeType,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    if (e instanceof SurfaceExportError) {
      const status =
        e.code === 'render_failed' ? 500 : e.code === 'page_not_found' ? 400 : 422
      return NextResponse.json({ error: e.message }, { status })
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Export failed' },
      { status: 500 },
    )
  }
}
