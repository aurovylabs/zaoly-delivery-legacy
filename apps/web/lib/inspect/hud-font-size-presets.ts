/**
 * HUD Size menu — CSS length quick-picks (literals, not token pack paths).
 * Knowledge: `knowledge/hud-tokenpicker.md` · Spec: `canvas-smart-hud.md`
 * Do not invent token pack `fontSize.*` scale tokens — see `knowledge/token-layers.md`.
 */

/** Synthetic TokenPicker path prefix → writes a free CSS length literal. */
export const HUD_FONT_SIZE_LITERAL_PREFIX = 'sz:' as const

/**
 * Common screen sizes shown under token pack type roles in the Size menu.
 * Keep short — designers type anything else in the literal strip / ± nudge.
 */
export const HUD_FONT_SIZE_PRESETS: readonly string[] = [
  '12px',
  '14px',
  '16px',
  '18px',
  '20px',
  '24px',
  '28px',
  '32px',
  '40px',
  '48px',
]

export function hudFontSizeLiteralPath(cssLength: string): string {
  return `${HUD_FONT_SIZE_LITERAL_PREFIX}${cssLength.trim()}`
}

export function parseHudFontSizeLiteralPath(path: string): string | null {
  if (!path.startsWith(HUD_FONT_SIZE_LITERAL_PREFIX)) return null
  const raw = path.slice(HUD_FONT_SIZE_LITERAL_PREFIX.length).trim()
  return raw || null
}

export function isHudFontSizeLiteralPath(path: string): boolean {
  return parseHudFontSizeLiteralPath(path) != null
}
