/** Parse / format CSS cubic-bezier() for EasingCurveEditor. */

export type CubicBezierTuple = [x1: number, y1: number, x2: number, y2: number]

const CUBIC_BEZIER_RE =
  /^cubic-bezier\s*\(\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*\)$/i

export function parseCubicBezier(value: string | undefined | null): CubicBezierTuple | null {
  if (!value) return null
  const match = value.trim().match(CUBIC_BEZIER_RE)
  if (!match) return null
  const nums = match.slice(1, 5).map(Number)
  if (nums.some((n) => !Number.isFinite(n))) return null
  return nums as CubicBezierTuple
}

export function formatCubicBezier([x1, y1, x2, y2]: CubicBezierTuple): string {
  const round = (n: number) => {
    const r = Math.round(n * 1000) / 1000
    return Number.isInteger(r) ? String(r) : String(r)
  }
  return `cubic-bezier(${round(x1)}, ${round(y1)}, ${round(x2)}, ${round(y2)})`
}

export function defaultMaterialBezier(): CubicBezierTuple {
  return [0.4, 0, 0.2, 1]
}

export function cubicBezierSvgPath([x1, y1, x2, y2]: CubicBezierTuple): string {
  const sx = (x: number) => x * 100
  const sy = (y: number) => (1 - y) * 100
  return `M ${sx(0)} ${sy(0)} C ${sx(x1)} ${sy(y1)}, ${sx(x2)} ${sy(y2)}, ${sx(1)} ${sy(1)}`
}

export function bezierTupleFromSvgPercent(sx: number, sy: number): { x: number; y: number } {
  const x = Math.min(1, Math.max(0, sx / 100))
  const y = 1 - sy / 100
  return { x, y }
}

export function svgPercentFromBezierTuple([x1, y1, x2, y2]: CubicBezierTuple): {
  cp1: { cx: number; cy: number }
  cp2: { cx: number; cy: number }
} {
  return {
    cp1: { cx: x1 * 100, cy: (1 - y1) * 100 },
    cp2: { cx: x2 * 100, cy: (1 - y2) * 100 },
  }
}
