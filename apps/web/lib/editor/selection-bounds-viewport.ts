import type { Bounds } from '../scene/selection'

/** Snapshot taken when selection bounds were last measured in the DOM. */
export type SelectionBoundsSnapshot = {
  bounds: Bounds
  panX: number
  panY: number
  zoom: number
}

/** P84 — derive overlay position from pan delta without layout measure. */
export function offsetSelectionBoundsForPan(
  snapshot: SelectionBoundsSnapshot,
  panX: number,
  panY: number,
  zoom: number,
): Bounds | null {
  if (zoom !== snapshot.zoom) return null
  const dPanX = panX - snapshot.panX
  const dPanY = panY - snapshot.panY
  if (dPanX === 0 && dPanY === 0) return snapshot.bounds
  return {
    left: snapshot.bounds.left + dPanX,
    top: snapshot.bounds.top + dPanY,
    width: snapshot.bounds.width,
    height: snapshot.bounds.height,
  }
}

export function resolveDisplaySelectionBounds(
  snapshot: SelectionBoundsSnapshot | null,
  panX: number,
  panY: number,
  zoom: number,
): Bounds | null {
  if (!snapshot) return null
  return offsetSelectionBoundsForPan(snapshot, panX, panY, zoom) ?? snapshot.bounds
}
