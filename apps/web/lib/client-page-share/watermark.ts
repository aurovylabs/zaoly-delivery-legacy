/** HTML watermark strip for shared preview / export. */

export function escapeHtmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildShareWatermarkLabel(parts: {
  label?: string | null
  sceneName?: string | null
  dateIso?: string
}): string {
  const when = (parts.dateIso ?? new Date().toISOString()).slice(0, 10)
  const title = (parts.label || parts.sceneName || 'Shared preview').trim()
  return `${title} · CREATION shared preview · ${when}`
}

export function injectShareWatermark(html: string, watermarkText: string): string {
  const safe = escapeHtmlText(watermarkText)
  const bar = `<div data-creation-share-watermark="1" style="position:fixed;left:0;right:0;bottom:0;z-index:99999;padding:8px 12px;background:rgba(24,24,27,.88);color:#fafafa;font:11px/1.3 ui-sans-serif,system-ui,sans-serif;letter-spacing:.02em;pointer-events:none">${safe}</div>`
  if (html.includes('</body>')) return html.replace('</body>', `${bar}</body>`)
  return `${html}${bar}`
}
