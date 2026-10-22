/**
 * Cubic-bezier parse/format + presets for Token Studio motion easing.
 * Spec: specs/domain/zaoly-token-studio.md
 */

export type CubicBezier = {
  x1: number
  y1: number
  x2: number
  y2: number
}

export type EasingPreset = {
  id: string
  labelKey: string
  css: string
  points: CubicBezier
}

export const DEFAULT_BEZIER: CubicBezier = { x1: 0.2, y1: 0, x2: 0, y2: 1 }

const KEYWORD_MAP: Record<string, CubicBezier> = {
  linear: { x1: 0, y1: 0, x2: 1, y2: 1 },
  ease: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 },
  'ease-in': { x1: 0.42, y1: 0, x2: 1, y2: 1 },
  'ease-out': { x1: 0, y1: 0, x2: 0.58, y2: 1 },
  'ease-in-out': { x1: 0.42, y1: 0, x2: 0.58, y2: 1 },
}

export const EASING_PRESETS: readonly EasingPreset[] = [
  { id: 'standard', labelKey: 'tokens.easingStandard', css: 'cubic-bezier(0.2, 0, 0, 1)', points: { x1: 0.2, y1: 0, x2: 0, y2: 1 } },
  { id: 'emphasized', labelKey: 'tokens.easingEmphasized', css: 'cubic-bezier(0.34, 1.3, 0.64, 1)', points: { x1: 0.34, y1: 1.3, x2: 0.64, y2: 1 } },
  { id: 'ease', labelKey: 'tokens.easingEase', css: 'ease', points: KEYWORD_MAP.ease! },
  { id: 'ease-in-out', labelKey: 'tokens.easingEaseInOut', css: 'ease-in-out', points: KEYWORD_MAP['ease-in-out']! },
  { id: 'linear', labelKey: 'tokens.easingLinear', css: 'linear', points: KEYWORD_MAP.linear! },
] as const

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function round4(n: number): number {
  return Math.round(n * 1000) / 1000
}

export function clampBezier(points: CubicBezier): CubicBezier {
  return {
    x1: clamp(points.x1, 0, 1),
    y1: clamp(points.y1, -1, 2),
    x2: clamp(points.x2, 0, 1),
    y2: clamp(points.y2, -1, 2),
  }
}

export function formatCubicBezier(points: CubicBezier): string {
  const p = clampBezier(points)
  return `cubic-bezier(${round4(p.x1)}, ${round4(p.y1)}, ${round4(p.x2)}, ${round4(p.y2)})`
}

export function parseCubicBezier(raw: string): CubicBezier | null {
  const trimmed = raw.trim().toLowerCase()
  if (!trimmed) return null
  if (KEYWORD_MAP[trimmed]) return { ...KEYWORD_MAP[trimmed]! }
  const m = trimmed.match(
    /^cubic-bezier\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)$/,
  )
  if (!m) return null
  const x1 = Number(m[1])
  const y1 = Number(m[2])
  const x2 = Number(m[3])
  const y2 = Number(m[4])
  if (![x1, y1, x2, y2].every((n) => Number.isFinite(n))) return null
  return clampBezier({ x1, y1, x2, y2 })
}

/** Sample cubic-bezier curve points in unit space (0..1 time → progress). */
export function sampleBezierPath(points: CubicBezier, steps = 32): Array<{ x: number; y: number }> {
  const p = clampBezier(points)
  const out: Array<{ x: number; y: number }> = []
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps
    const u = 1 - t
    const x = 3 * u * u * t * p.x1 + 3 * u * t * t * p.x2 + t * t * t
    const y = 3 * u * u * t * p.y1 + 3 * u * t * t * p.y2 + t * t * t
    out.push({ x, y })
  }
  return out
}

export function bezierPathD(points: CubicBezier, size: number, pad = 0): string {
  const samples = sampleBezierPath(points)
  return samples
    .map((pt, i) => {
      const x = pad + pt.x * size
      const y = pad + (1 - pt.y) * size
      return `${i === 0 ? 'M' : 'L'}${round4(x)} ${round4(y)}`
    })
    .join(' ')
}

export function matchingPresetId(css: string): string | null {
  const parsed = parseCubicBezier(css)
  const trimmed = css.trim().toLowerCase()
  for (const preset of EASING_PRESETS) {
    if (preset.css.toLowerCase() === trimmed) return preset.id
    if (parsed && pointsEqual(parsed, preset.points)) return preset.id
  }
  return null
}

function pointsEqual(a: CubicBezier, b: CubicBezier): boolean {
  return (
    Math.abs(a.x1 - b.x1) < 0.001 &&
    Math.abs(a.y1 - b.y1) < 0.001 &&
    Math.abs(a.x2 - b.x2) < 0.001 &&
    Math.abs(a.y2 - b.y2) < 0.001
  )
}
