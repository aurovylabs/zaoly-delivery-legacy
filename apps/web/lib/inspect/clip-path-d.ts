/**
 * Phase D `clipPathD` helpers — surface-clip-slant.md CL27–CL29.
 */

/** Strip CSS `path('…')` / `path("…")` wrapper to raw SVG path data. */
export function parseClipPathD(raw: unknown): string | undefined {
  if (raw == null) return undefined
  const text = String(raw).trim()
  if (!text) return undefined
  const wrapped = text.match(/^path\s*\(\s*(['"])([\s\S]*?)\1\s*\)$/i)
  if (wrapped) {
    const inner = wrapped[2]?.trim()
    return inner || undefined
  }
  // Already raw path data
  if (/^[MmLlHhVvCcSsQqTtAaZz0-9.\s,\-+eE]+$/.test(text) && /[MmLlHhVvCcSsQqTtAaZz]/.test(text)) {
    return text
  }
  return text || undefined
}

/** CSS `clip-path: path('…')` from raw d (or undefined when empty). */
export function clipPathFromPathD(raw: unknown): string | undefined {
  const d = parseClipPathD(raw)
  if (!d) return undefined
  const escaped = d.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  return `path('${escaped}')`
}
