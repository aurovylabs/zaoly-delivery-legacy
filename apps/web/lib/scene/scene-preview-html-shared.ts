/** Client-safe helpers for editor HTML preview (no Playwright / server scene graph). */

export type ScenePreviewHtmlSource = 'scene' | 'import'

/** Wrap body fragments so iframe preview has a document shell. */
export function normalizeImportPreviewHtml(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) {
    return '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body></body></html>'
  }
  if (/<html[\s>]/i.test(trimmed) || /<!doctype/i.test(trimmed)) return trimmed
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${trimmed}</body></html>`
}
