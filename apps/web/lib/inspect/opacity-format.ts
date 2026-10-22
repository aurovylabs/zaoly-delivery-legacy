/** Convert stored opacity (0–1 CSS / token preview) to slider percent 0–100. */
export function opacityToPercent(raw: unknown): number | null {
  if (raw == null || raw === '') return null
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    if (raw >= 0 && raw <= 1) return Math.round(raw * 100)
    if (raw > 1 && raw <= 100) return Math.round(raw)
    return null
  }
  const text = String(raw).trim()
  if (!text) return null
  if (text.endsWith('%')) {
    const n = Number(text.slice(0, -1))
    return Number.isFinite(n) ? clampOpacityPercent(n) : null
  }
  const n = Number(text)
  if (!Number.isFinite(n)) return null
  if (n >= 0 && n <= 1) return Math.round(n * 100)
  if (n > 1 && n <= 100) return Math.round(n)
  return null
}

export function clampOpacityPercent(value: number): number {
  if (!Number.isFinite(value)) return 100
  return Math.max(0, Math.min(100, Math.round(value)))
}

/** Persist as 0–1 CSS literal (number). */
export function percentToOpacityLiteral(percent: number): number {
  return clampOpacityPercent(percent) / 100
}

export function formatOpacityPercentLabel(percent: number): string {
  return `${clampOpacityPercent(percent)}`
}
