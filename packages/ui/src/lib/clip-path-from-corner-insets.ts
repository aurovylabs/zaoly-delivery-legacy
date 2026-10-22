/**
 * Corner-inset → CSS `clip-path` polygon (zaoly-ui-surface-clip / CREATION CL3).
 * Layout box stays rectangular; paint silhouette only.
 */

export type CornerInsetAxes = {
  x?: string
  y?: string
}

export type CornerInsets = {
  topLeft?: CornerInsetAxes
  topRight?: CornerInsetAxes
  bottomRight?: CornerInsetAxes
  bottomLeft?: CornerInsetAxes
}

const ZERO = /^(0|0px|0rem|0em|0%)$/i

function axisValue(raw: string | undefined): string | null {
  if (raw == null) return null
  const v = raw.trim()
  if (!v || ZERO.test(v)) return null
  return v
}

function isActive(insets: CornerInsets | undefined | null): boolean {
  if (!insets) return false
  for (const corner of [
    insets.topLeft,
    insets.topRight,
    insets.bottomRight,
    insets.bottomLeft,
  ]) {
    if (!corner) continue
    if (axisValue(corner.x) || axisValue(corner.y)) return true
  }
  return false
}

/**
 * Build `clip-path: polygon(...)` value, or `undefined` when all insets are empty/zero.
 *
 * ```
 * TL = (0 + xTL, 0 + yTL)
 * TR = (100% − xTR, 0 + yTR)
 * BR = (100% − xBR, 100% − yBR)
 * BL = (0 + xBL, 100% − yBL)
 * ```
 */
export function clipPathFromCornerInsets(
  insets: CornerInsets | undefined | null,
): string | undefined {
  if (!isActive(insets)) return undefined

  const tlX = axisValue(insets!.topLeft?.x) ?? '0'
  const tlY = axisValue(insets!.topLeft?.y) ?? '0'
  const trX = axisValue(insets!.topRight?.x) ?? '0'
  const trY = axisValue(insets!.topRight?.y) ?? '0'
  const brX = axisValue(insets!.bottomRight?.x) ?? '0'
  const brY = axisValue(insets!.bottomRight?.y) ?? '0'
  const blX = axisValue(insets!.bottomLeft?.x) ?? '0'
  const blY = axisValue(insets!.bottomLeft?.y) ?? '0'

  const tl = `${tlX === '0' ? '0' : tlX} ${tlY === '0' ? '0' : tlY}`
  const tr =
    trX === '0' && trY === '0'
      ? '100% 0'
      : `${trX === '0' ? '100%' : `calc(100% - ${trX})`} ${trY === '0' ? '0' : trY}`
  const br =
    brX === '0' && brY === '0'
      ? '100% 100%'
      : `${brX === '0' ? '100%' : `calc(100% - ${brX})`} ${brY === '0' ? '100%' : `calc(100% - ${brY})`}`
  const bl =
    blX === '0' && blY === '0'
      ? '0 100%'
      : `${blX === '0' ? '0' : blX} ${blY === '0' ? '100%' : `calc(100% - ${blY})`}`

  return `polygon(${tl}, ${tr}, ${br}, ${bl})`
}
