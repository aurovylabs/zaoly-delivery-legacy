/**
 * Mag PDF paper is a print substrate (cream/light), not the digital UI chrome bg.
 * Token pack `color.background` is often dark (`zaoly-dark`) — refuse it as paper.
 */

/** Relative luminance 0–1 (WCAG sRGB). */
export function relativeLuminance(cssColor: string): number | undefined {
  const rgb = parseCssRgb(cssColor)
  if (!rgb) return undefined
  const lin = rgb.map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!
}

/**
 * Light enough for Magazin paper / `--print-paper`.
 * Cream `#f8f7f4` ≈ 0.93; UI dark `#0f0f12` ≈ 0.004.
 */
export const MAG_PAPER_MIN_LUMINANCE = 0.55

export function isSuitableMagPaper(cssColor: string): boolean {
  const L = relativeLuminance(cssColor)
  return L != null && L >= MAG_PAPER_MIN_LUMINANCE
}

/** Keep paper override only when it reads as print substrate. */
export function sanitizeMagPaper(cssColor: string | undefined | null): string | undefined {
  if (!cssColor || typeof cssColor !== 'string') return undefined
  const v = cssColor.trim()
  if (!v) return undefined
  return isSuitableMagPaper(v) ? v : undefined
}

function parseCssRgb(cssColor: string): [number, number, number] | undefined {
  const v = cssColor.trim()
  const hex = /^#([0-9a-fA-F]{3,8})$/.exec(v)
  if (hex) {
    let h = hex[1]!
    if (h.length === 3 || h.length === 4) {
      h = h
        .slice(0, 3)
        .split('')
        .map((c) => c + c)
        .join('')
    } else if (h.length === 8) {
      h = h.slice(0, 6)
    } else if (h.length !== 6) {
      return undefined
    }
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  }
  const rgb = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i.exec(v)
  if (rgb) {
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
  }
  return undefined
}
