/** HiDPI-aware selection handle sizing — `specs/domain/editor-performance.md` P95. */

export const SELECTION_HANDLE_BASE_PX = 8

/** Snap a CSS length to device pixels for crisp borders on Retina / 125–200 % zoom. */
export function snapCssLengthToDevicePx(cssPx: number, devicePixelRatio: number): number {
  const dpr = Math.max(1, devicePixelRatio)
  return Math.round(cssPx * dpr) / dpr
}

export function resolveSelectionHandleChromeVars(
  devicePixelRatio: number,
): Record<string, string> {
  const handleSizePx = snapCssLengthToDevicePx(SELECTION_HANDLE_BASE_PX, devicePixelRatio)
  const borderPx = snapCssLengthToDevicePx(1, devicePixelRatio)
  const offsetPx = handleSizePx / 2
  return {
    '--creation-selection-handle-size': `${handleSizePx}px`,
    '--creation-selection-handle-offset': `${offsetPx}px`,
    '--creation-selection-border-width': `${borderPx}px`,
  }
}
