import { describe, expect, it } from 'vitest'
import {
  offsetSelectionBoundsForPan,
  resolveDisplaySelectionBounds,
} from '../lib/editor/selection-bounds-viewport'

describe('selection-bounds-viewport (Wave 7 / P84)', () => {
  const snapshot = {
    bounds: { left: 100, top: 50, width: 80, height: 40 },
    panX: 0,
    panY: 0,
    zoom: 1,
  }

  it('offsets bounds by pan delta without remeasure', () => {
    expect(offsetSelectionBoundsForPan(snapshot, 12, -8, 1)).toEqual({
      left: 112,
      top: 42,
      width: 80,
      height: 40,
    })
  })

  it('returns null offset when zoom changed (caller remeasures)', () => {
    expect(offsetSelectionBoundsForPan(snapshot, 12, 0, 1.5)).toBeNull()
  })

  it('resolveDisplaySelectionBounds falls back to snapshot bounds when zoom differs', () => {
    expect(resolveDisplaySelectionBounds(snapshot, 5, 5, 2)).toEqual(snapshot.bounds)
  })
})
