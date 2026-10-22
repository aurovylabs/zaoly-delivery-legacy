/**
 * HUD Weight menu — CSS weight quick-picks (literals, not token pack paths).
 * Knowledge: `knowledge/hud-tokenpicker.md` · Spec: `canvas-smart-hud.md`
 * Do not invent token pack `fontWeight.*` scale tokens — see `knowledge/token-layers.md`.
 */

/** Synthetic TokenPicker path prefix → writes a free font-weight literal. */
export const HUD_FONT_WEIGHT_LITERAL_PREFIX = 'wt:' as const

/**
 * Common CSS weights under token pack type roles in the Weight menu.
 * ± nudge still steps by 100 in the literal strip.
 */
export const HUD_FONT_WEIGHT_PRESETS: readonly string[] = [
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
]

export function hudFontWeightLiteralPath(weight: string): string {
  return `${HUD_FONT_WEIGHT_LITERAL_PREFIX}${weight.trim()}`
}

export function parseHudFontWeightLiteralPath(path: string): string | null {
  if (!path.startsWith(HUD_FONT_WEIGHT_LITERAL_PREFIX)) return null
  const raw = path.slice(HUD_FONT_WEIGHT_LITERAL_PREFIX.length).trim()
  return raw || null
}

export function isHudFontWeightLiteralPath(path: string): boolean {
  return parseHudFontWeightLiteralPath(path) != null
}

/** Sort key for CSS weight numbers / keywords. */
export function fontWeightSortKey(raw: string): number {
  const t = raw.trim().toLowerCase()
  if (t === 'normal') return 400
  if (t === 'bold') return 700
  const n = Number.parseInt(t, 10)
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY
}
