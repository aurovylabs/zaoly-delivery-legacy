/** Layout grid metrics + mock scaling helpers for GridEditor. */

export type GridEditorMetrics = {
  columns?: number
  gutter?: string
  margin?: string
  maxWidth?: string
}

export type GridEditorChannel = 'digital' | 'print'

export const DEFAULT_COLUMN_PRESETS = [4, 8, 12, 16] as const

export const GRID_EDITOR_REFERENCE_PX = 1200
export const GRID_EDITOR_REFERENCE_MM = 210

function layoutPreviewPctOfReference(value: number, reference: number): number {
  if (!Number.isFinite(value) || reference <= 0) return 0
  return Math.min(100, Math.max(0, (value / reference) * 100))
}

function layoutPreviewLengthToPx(raw: string, remPx = 16): number | null {
  const v = raw.trim()
  if (/^(clamp|min|max)\(/i.test(v)) return null
  const m = v.match(/^(-?[\d.]+)\s*(px|rem|em|%|ch|vw|vh|pt|mm|cm|in)?$/i)
  if (!m) return null
  const n = Number(m[1])
  if (!Number.isFinite(n)) return null
  const unit = (m[2] || 'px').toLowerCase()
  switch (unit) {
    case 'px':
      return n
    case 'rem':
    case 'em':
      return n * remPx
    case 'pt':
      return n * (96 / 72)
    case 'mm':
      return n * (96 / 25.4)
    case 'cm':
      return n * (96 / 2.54)
    case 'in':
      return n * 96
    default:
      return null
  }
}

/** Length → CSS percentage for digital mock stages. */
export function gridPreviewPctFromLength(
  raw: string | undefined,
  referencePx: number,
  remPx = 16,
): string | null {
  if (!raw?.trim()) return null
  const v = raw.trim()
  const pctMatch = v.match(/^(-?[\d.]+)\s*(%|vw)$/i)
  if (pctMatch) {
    const n = Number(pctMatch[1])
    if (!Number.isFinite(n)) return null
    return `${Math.min(100, Math.max(0, Math.abs(n)))}%`
  }
  const px = layoutPreviewLengthToPx(v, remPx)
  if (px == null) return null
  return `${layoutPreviewPctOfReference(px, referencePx)}%`
}

/** Print physical length → % of reference page width (mm). */
export function gridPreviewPrintPctFromLength(
  raw: string | undefined,
  referenceMm: number,
): string | null {
  if (!raw?.trim()) return null
  const v = raw.trim()
  const m = v.match(/^(-?[\d.]+)\s*(mm|cm|in|pt|px)?$/i)
  if (!m) return null
  const n = Number(m[1])
  if (!Number.isFinite(n) || referenceMm <= 0) return null
  const unit = (m[2] || 'mm').toLowerCase()
  let mm = n
  if (unit === 'cm') mm = n * 10
  else if (unit === 'in') mm = n * 25.4
  else if (unit === 'pt') mm = n * (25.4 / 72)
  else if (unit === 'px') mm = n * (25.4 / 96)
  return `${layoutPreviewPctOfReference(mm, referenceMm)}%`
}

export function gridPreviewPctForChannel(
  raw: string | undefined,
  channel: GridEditorChannel,
  referencePx = GRID_EDITOR_REFERENCE_PX,
  referenceMm = GRID_EDITOR_REFERENCE_MM,
): string | null {
  return channel === 'print'
    ? gridPreviewPrintPctFromLength(raw, referenceMm)
    : gridPreviewPctFromLength(raw, referencePx)
}

export function preferredDigitalUnit(raw: string | undefined): 'rem' | 'px' {
  if (raw?.trim().match(/rem|em/i)) return 'rem'
  return 'px'
}

export function formatDigitalLengthFromStagePx(
  px: number,
  unit: 'rem' | 'px',
  remPx = 16,
): string {
  if (unit === 'rem') {
    const rem = Math.round((px / remPx) * 100) / 100
    return `${rem}rem`
  }
  return `${Math.max(0, Math.round(px))}px`
}

export function formatPrintLengthFromStagePx(
  px: number,
  stageWidthPx: number,
  referenceMm = GRID_EDITOR_REFERENCE_MM,
): string {
  if (stageWidthPx <= 0) return '0mm'
  const mm = (px / stageWidthPx) * referenceMm
  const rounded = Math.round(mm * 10) / 10
  return `${rounded}mm`
}

export function stagePxFromPct(pct: number, stageWidthPx: number): number {
  return (pct / 100) * stageWidthPx
}

export function pctFromStagePx(px: number, stageWidthPx: number): number {
  if (stageWidthPx <= 0) return 0
  return Math.min(100, Math.max(0, (px / stageWidthPx) * 100))
}

export function clampColumns(n: number | undefined): number | undefined {
  if (n == null || !Number.isFinite(n)) return undefined
  const rounded = Math.round(n)
  if (rounded < 1) return undefined
  return Math.min(24, rounded)
}

export function patchGridMetrics(
  current: GridEditorMetrics,
  patch: Partial<GridEditorMetrics>,
): GridEditorMetrics {
  const next: GridEditorMetrics = { ...current }
  if ('columns' in patch) next.columns = clampColumns(patch.columns)
  if ('gutter' in patch) next.gutter = patch.gutter || undefined
  if ('margin' in patch) next.margin = patch.margin || undefined
  if ('maxWidth' in patch) next.maxWidth = patch.maxWidth || undefined
  return next
}
