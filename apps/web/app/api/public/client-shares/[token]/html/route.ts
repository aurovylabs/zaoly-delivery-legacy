/**
 * GET /api/public/client-shares/:token/html?pageId=
 * Renders pinned or live_head page as preview HTML.
 */
import { NextResponse } from 'next/server'
import { gateClientShareAccess } from '../../../../../../lib/client-page-share/gate'
import { resolveClientShareRenderScene } from '../../../../../../lib/client-page-share/resolve-scene'
import {
  getClientPageShareByToken,
  isClientShareActive,
} from '../../../../../../lib/client-page-share/store'
import { isClientPageShareTokenShape } from '../../../../../../lib/client-page-share/token'
import { resolveScenePreviewHtmlForPage } from '../../../../../../lib/scene/scene-preview-html-page'
import { isClientPageShareEnabled } from '../../../../../../lib/runtime-config'

export async function GET(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  if (!isClientPageShareEnabled()) {
    return new NextResponse('Not found', { status: 404 })
  }

  const { token: raw } = await ctx.params
  const token = decodeURIComponent(raw)
  if (!isClientPageShareTokenShape(token)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const record = await getClientPageShareByToken(token)
  if (!record || !isClientShareActive(record)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const gate = await gateClientShareAccess(record)
  if (!gate.ok) {
    return new NextResponse(
      gate.code === 'email_required' ? 'Email required' : 'Password required',
      { status: 401 },
    )
  }

  const url = new URL(req.url)
  const pageId =
    url.searchParams.get('pageId')?.trim() || record.pageIds[0] || undefined
  if (pageId && !record.pageIds.includes(pageId)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const rendered = await resolveClientShareRenderScene(record)
  const result = resolveScenePreviewHtmlForPage(rendered.scene, {
    pageId,
    source: 'scene',
  })
  if (!result.ok) {
    return new NextResponse(result.message, { status: 404 })
  }

  let html = result.html
  if (rendered.draft) {
    const badge =
      '<div style="position:fixed;top:12px;right:12px;z-index:9999;padding:6px 10px;border-radius:6px;background:#18181b;color:#c6f24a;font:12px/1.2 ui-sans-serif,system-ui,sans-serif;opacity:.92">Draft</div>'
    html = html.includes('</body>')
      ? html.replace('</body>', `${badge}</body>`)
      : `${html}${badge}`
  }

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
