/**
 * HUD Gap / Pad / Radius menus — CSS length quick-picks (literals, not token pack paths).
 * Knowledge: `knowledge/hud-tokenpicker.md` · `knowledge/hud-control-language.md` (Wave A)
 * Spec: `specs/domain/canvas-smart-hud.md`
 */

/** Synthetic TokenPicker path prefix → writes a free CSS length literal. */
export const HUD_LENGTH_LITERAL_PREFIX = 'ln:' as const

/**
 * 4px-base spacing ladder (common UI scale). Keep short — free literal / ± covers the rest.
 * Shared by `space` (gap/pad) and `radius` menus.
 */
export const HUD_LENGTH_PRESETS: readonly string[] = [
  '0px',
  '4px',
  '8px',
  '12px',
  '16px',
  '24px',
  '32px',
  '48px',
  '64px',
]

export function hudLengthLiteralPath(cssLength: string): string {
  return `${HUD_LENGTH_LITERAL_PREFIX}${cssLength.trim()}`
}

export function parseHudLengthLiteralPath(path: string): string | null {
  if (!path.startsWith(HUD_LENGTH_LITERAL_PREFIX)) return null
  const raw = path.slice(HUD_LENGTH_LITERAL_PREFIX.length).trim()
  return raw || null
}

export function isHudLengthLiteralPath(path: string): boolean {
  return parseHudLengthLiteralPath(path) != null
}
