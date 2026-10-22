/**
 * POST /api/public/client-shares/:token/export
 * Watermarked PNG/PDF of shared pages (P3).
 */
import { NextResponse } from 'next/server'
import { gateClientShareAccess } from '../../../../../../lib/client-page-share/gate'
import { resolveClientShareRenderScene } from '../../../../../../lib/client-page-share/resolve-scene'
import {
  getClientPageShareByToken,
  isClientShareActive,
} from '../../../../../../lib/client-page-share/store'
import { isClientPageShareTokenShape } from '../../../../../../lib/client-page-share/token'
import { buildShareWatermarkLabel } from '../../../../../../lib/client-page-share/watermark'
import {
  renderSurfaceExport,
  SurfaceExportError,
} from '../../../../../../lib/scene/surface-export'
import { isClientPageShareEnabled } from '../../../../../../lib/runtime-config'


export async function POST(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  if (!isClientPageShareEnabled()) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 })
  }
  const { token: raw } = await ctx.params
  const token = decodeURIComponent(raw)
  if (!isClientPageShareTokenShape(token)) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 })
  }
  const record = await getClientPageShareByToken(token)
  if (!record || !isClientShareActive(record)) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 })
  }
  const gate = await gateClientShareAccess(record)
  if (!gate.ok) {
    return NextResponse.json({ code: gate.code }, { status: 401 })
  }

  const body = (await req.json().catch(() => ({}))) as {
    format?: unknown
    pageId?: unknown
  }
  const format = body.format === 'pdf' ? 'pdf' : body.format === 'png' ? 'png' : null
  if (!format) {
    return NextResponse.json({ error: 'format must be png or pdf' }, { status: 422 })
  }

  const pageId =
    typeof body.pageId === 'string' && body.pageId.trim()
      ? body.pageId.trim()
      : record.pageIds[0]
  if (!pageId || !record.pageIds.includes(pageId)) {
    return NextResponse.json({ error: 'page_not_shared' }, { status: 422 })
  }

  const rendered = await resolveClientShareRenderScene(record)
  const watermark = buildShareWatermarkLabel({
    label: record.label,
    sceneName: rendered.snapshot.name,
  })

  try {
    const result = await renderSurfaceExport(rendered.scene, {
      format,
      pageIds: format === 'pdf' ? record.pageIds : [pageId],
      watermark,
    })
    return new NextResponse(new Uint8Array(result.bytes), {
      status: 200,
      headers: {
        'Content-Type': result.mimeType,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    })
  } catch (e) {
    if (e instanceof SurfaceExportError) {
      return NextResponse.json({ error: e.code }, { status: 422 })
    }
    return NextResponse.json({ error: 'export_failed' }, { status: 500 })
  }
}
