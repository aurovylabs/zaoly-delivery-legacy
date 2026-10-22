/**
 * Snapping ladders for Token Studio side-dock sliders.
 * Spec: specs/domain/zaoly-token-studio.md
 */

export const REM_LADDER = [
  0, 0.125, 0.25, 0.375, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8,
] as const
export const PX_LADDER = [0, 1, 2, 3, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96] as const
export const MS_LADDER = [80, 120, 160, 200, 240, 320, 400, 600, 800, 1000] as const
export const WEIGHT_LADDER = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const
export const SIZE_PX_LADDER = [16, 24, 32, 40, 44, 48, 56, 64, 80, 96, 120, 160] as const
/** Offsets for shadow / glow — negatives are first-class. */
export const SIGNED_PX_LADDER = [
  -64, -48, -32, -24, -16, -12, -8, -4, -2, 0, 2, 4, 6, 8, 12, 16, 24, 32, 48, 64,
] as const

export type NominalUnit = 'rem' | 'px' | 'ms' | 'ratio' | 'weight' | 'plain'

export type NominalLadder = {
  values: readonly number[]
  unit: NominalUnit
  /** Slider step; for discrete ladders equals first gap or 1 */
  step: number
  min: number
  max: number
  /** When false, endless scale may go below 0 (offsets). Default: true for rem/px/ms/ratio. */
  floorAtZero?: boolean
}

function discrete(values: readonly number[], unit: NominalUnit): NominalLadder {
  const sorted = [...values].sort((a, b) => a - b)
  return {
    values: sorted,
    unit,
    step: 1,
    min: 0,
    max: sorted.length - 1,
  }
}

function continuous(min: number, max: number, step: number, unit: NominalUnit): NominalLadder {
  const values: number[] = []
  for (let v = min; v <= max + 1e-9; v = Math.round((v + step) * 1000) / 1000) {
    values.push(v)
  }
  return { values, unit, step, min, max }
}

export function remLadder(): NominalLadder {
  return discrete(REM_LADDER, 'rem')
}

export function pxLadder(): NominalLadder {
  return discrete(PX_LADDER, 'px')
}

export function msLadder(): NominalLadder {
  return discrete(MS_LADDER, 'ms')
}

export function weightLadder(): NominalLadder {
  return discrete(WEIGHT_LADDER, 'weight')
}

export function sizePxLadder(): NominalLadder {
  return discrete(SIZE_PX_LADDER, 'px')
}

export function signedPxLadder(): NominalLadder {
  return { ...discrete(SIGNED_PX_LADDER, 'px'), floorAtZero: false }
}

export function opacityLadder(): NominalLadder {
  return continuous(0, 1, 0.05, 'ratio')
}

export function ratioLadder(min = 0, max = 2, step = 0.1): NominalLadder {
  return continuous(min, max, step, 'ratio')
}

function roundForUnit(value: number, unit: NominalUnit): number {
  if (unit === 'rem' || unit === 'ratio') return Math.round(value * 1000) / 1000
  return Math.round(value)
}

function edgeGap(ladder: NominalLadder, edge: 'below' | 'above'): number {
  const values = ladder.values
  if (values.length >= 2) {
    return edge === 'below'
      ? values[1]! - values[0]!
      : values[values.length - 1]! - values[values.length - 2]!
  }
  return ladder.step > 0 ? ladder.step : 1
}

function clampExtendedValue(value: number, ladder: NominalLadder): number {
  const unit = ladder.unit
  if (!floorsAtZero(ladder) && unit === 'px') return value
  if (unit === 'rem' || unit === 'px' || unit === 'ms') return Math.max(0, value)
  if (unit === 'weight') return Math.min(900, Math.max(100, value))
  if (unit === 'ratio' && ladder.values[0] === 0 && ladder.values[ladder.values.length - 1] === 1) {
    return Math.min(1, Math.max(0, value))
  }
  return Math.max(0, value)
}

function unitFloorsAtZero(unit: NominalUnit): boolean {
  return unit === 'rem' || unit === 'px' || unit === 'ms' || unit === 'ratio'
}

function floorsAtZero(ladder: NominalLadder): boolean {
  if (ladder.floorAtZero != null) return ladder.floorAtZero
  return unitFloorsAtZero(ladder.unit)
}

/** Nearest ladder value for a numeric reading (catalog steps only). */
export function snapToLadder(value: number, ladder: NominalLadder): number {
  let best = ladder.values[0]!
  let bestDist = Math.abs(value - best)
  for (const v of ladder.values) {
    const d = Math.abs(value - v)
    if (d < bestDist) {
      best = v
      bestDist = d
    }
  }
  return best
}

/** Slider index (0..n-1) for discrete ladders; raw value for continuous. */
export function sliderValueFromNumber(value: number, ladder: NominalLadder): number {
  if (ladder.unit === 'ratio' && ladder.step < 1) {
    return snapToLadder(value, ladder)
  }
  const snapped = snapToLadder(value, ladder)
  const idx = ladder.values.indexOf(snapped)
  return idx >= 0 ? idx : 0
}

export function numberFromSliderValue(slider: number, ladder: NominalLadder): number {
  if (ladder.unit === 'ratio' && ladder.step < 1) {
    return snapToLadder(slider, ladder)
  }
  const idx = Math.max(0, Math.min(ladder.values.length - 1, Math.round(slider)))
  return ladder.values[idx]!
}

/**
 * Index into the endless scale: catalog 0..n-1, then continues with edge-gap steps.
 * Length/time never go below index of 0.
 */
export function ladderIndexFromNumber(value: number, ladder: NominalLadder): number {
  const values = ladder.values
  const n = values.length
  if (n === 0) return 0
  const min = values[0]!
  const max = values[n - 1]!

  if (value >= min && value <= max) {
    const snapped = snapToLadder(value, ladder)
    const idx = values.indexOf(snapped)
    if (idx >= 0) return idx
    let best = 0
    let bestDist = Math.abs(snapped - values[0]!)
    for (let i = 1; i < n; i += 1) {
      const d = Math.abs(snapped - values[i]!)
      if (d < bestDist) {
        best = i
        bestDist = d
      }
    }
    return best
  }

  if (value < min) {
    const gap = edgeGap(ladder, 'below')
    if (gap <= 0) return 0
    const idx = Math.round((value - min) / gap)
    return floorsAtZero(ladder) ? Math.max(0, idx) : idx
  }

  const gap = edgeGap(ladder, 'above')
  if (gap <= 0) return n - 1
  return n - 1 + Math.round((value - max) / gap)
}

/** @deprecated Prefer extended indices — kept for modulo helpers/tests. */
export function wrapLadderIndex(index: number, length: number): number {
  if (length <= 0) return 0
  return ((index % length) + length) % length
}

/** Lowest allowed endless index (0 for lengths/time/opacity unless floorAtZero=false). */
export function minEndlessIndex(ladder: NominalLadder): number {
  if (floorsAtZero(ladder) || ladder.unit === 'weight') return 0
  return Number.NEGATIVE_INFINITY
}

export function numberFromLadderIndex(index: number, ladder: NominalLadder): number {
  const values = ladder.values
  const n = values.length
  if (n === 0) return 0
  const clamped = Math.max(minEndlessIndex(ladder), Math.round(index))
  if (clamped >= 0 && clamped < n) return values[clamped]!
  if (clamped < 0) {
    const gap = edgeGap(ladder, 'below')
    const raw = values[0]! + clamped * gap
    return roundForUnit(clampExtendedValue(raw, ladder), ladder.unit)
  }
  const gap = edgeGap(ladder, 'above')
  const raw = values[n - 1]! + (clamped - (n - 1)) * gap
  return roundForUnit(clampExtendedValue(raw, ladder), ladder.unit)
}

export function parseCssNumber(raw: string): { value: number; unit: string } | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return { value: Number(trimmed), unit: '' }
  }
  const m = trimmed.match(/^(-?[\d.]+)(rem|px|ms|s|%)$/i)
  if (!m) return null
  return { value: Number(m[1]), unit: m[2]!.toLowerCase() }
}

export function formatNominal(value: number, unit: NominalUnit): string {
  if (unit === 'rem') {
    const rounded = Math.round(value * 1000) / 1000
    return `${rounded}rem`
  }
  if (unit === 'px') return `${Math.round(value)}px`
  if (unit === 'ms') return `${Math.round(value)}ms`
  if (unit === 'weight') return String(Math.round(value))
  if (unit === 'ratio') {
    const rounded = Math.round(value * 100) / 100
    return String(rounded)
  }
  return String(value)
}

/** Parse a CSS length/time/ratio string onto a ladder; returns snapped display string. */
export function snapCssToLadder(raw: string, ladder: NominalLadder): string {
  const parsed = parseCssNumber(raw)
  if (!parsed) return formatNominal(ladder.values[0]!, ladder.unit)
  let n = parsed.value
  if (parsed.unit === 's' && ladder.unit === 'ms') n *= 1000
  if (parsed.unit === '%' && ladder.unit === 'ratio') n /= 100
  const idx = ladderIndexFromNumber(n, ladder)
  return formatNominal(numberFromLadderIndex(idx, ladder), ladder.unit)
}

/** Pick rem vs px ladder from a CSS length string. */
export function lengthLadderForCss(raw: string): NominalLadder {
  const parsed = parseCssNumber(raw)
  if (parsed?.unit === 'rem') return remLadder()
  return pxLadder()
}

export function ladderForTokenField(
  type: string,
  field: string,
  sampleCss = '',
): NominalLadder | null {
  if (
    type === 'spacing' ||
    (type === 'radius' && field === 'value') ||
    (type === 'typography' && field === 'digitalSize')
  ) {
    return lengthLadderForCss(sampleCss || (type === 'spacing' ? '1rem' : '8px'))
  }
  if (type === 'size' && field === 'value') {
    const parsed = parseCssNumber(sampleCss)
    if (parsed?.unit === 'rem') return remLadder()
    return sizePxLadder()
  }
  if (type === 'opacity' && field === 'value') return opacityLadder()
  if (
    (type === 'shadow' && (field === 'offsetX' || field === 'offsetY')) ||
    (type === 'glow' && (field === 'offsetX' || field === 'offsetY'))
  ) {
    return signedPxLadder()
  }
  if (
    (type === 'shadow' && (field === 'blur' || field === 'spread')) ||
    (type === 'glow' && (field === 'blur' || field === 'spread'))
  ) {
    return pxLadder()
  }
  if (type === 'motion' && field === 'duration') return msLadder()
  if (type === 'typography' && field === 'weight') return weightLadder()
  if (type === 'effect' && field === 'amount') {
    return null // caller picks blur vs ratio from kind
  }
  return null
}

export function effectAmountLadder(kind: string): NominalLadder {
  if (kind === 'blur') return pxLadder()
  return ratioLadder(0, 2, 0.1)
}
