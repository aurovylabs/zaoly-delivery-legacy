/**
 * Intrinsic / fluid layout helpers for Site Kit shells.
 * Spec: specs/domain/site-kit-fluid-layout.md · Wave C
 */

/** Preferred min track width so `auto-fit` collapses columns on narrow boards. */
export function fluidGridMinTrack(columnCount: number): string {
  const n = Math.min(Math.max(Math.floor(columnCount), 1), 12)
  if (n <= 1) return '100%'
  if (n === 2) return '16rem'
  if (n === 3) return '14rem'
  if (n === 4) return '12rem'
  return '10rem'
}

/**
 * Map a discrete `columns` count to a fluid `grid-template-columns` value.
 * Uses `auto-fit` + `minmax(min(100%, …), 1fr)` so tracks wrap without OP-9 overrides.
 */
export function fluidGridTemplateFromColumns(
  columns: string | number | undefined,
): string | undefined {
  if (columns == null || columns === '') return undefined
  const asString = String(columns).trim()
  // Already a template (contains fr/px/%/minmax/repeat/auto)
  if (/fr|minmax|repeat|auto|px|%|em|rem/i.test(asString) && !/^\d+$/.test(asString)) {
    return asString
  }
  const n = typeof columns === 'number' ? columns : Number.parseInt(asString, 10)
  if (!Number.isFinite(n) || n < 1) return undefined
  const min = fluidGridMinTrack(n)
  return `repeat(auto-fit, minmax(min(100%, ${min}), 1fr))`
}

/**
 * Inspect / docs — keys designers typically override per breakpoint when fluid
 * layout alone is not enough (OP-9 sparse map).
 */
export const RECOMMENDED_RESPONSIVE_OVERRIDE_KEYS = [
  'direction',
  'wrap',
  'gap',
  'columns',
  'padding',
  'paddingInline',
  'paddingBlock',
  'maxWidth',
  'fontSize',
  'hidden',
  'justify',
  'align',
] as const
