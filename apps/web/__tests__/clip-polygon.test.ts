import { describe, expect, it } from 'vitest'
import {
  CLIP_POLYGON_MAX_POINTS,
  clipPathFromPolygonPoints,
  formatClipPolygonPoints,
  parseClipPolygonPoints,
} from '../lib/inspect/clip-polygon'
import { resolveClipPathFromSceneProps } from '../lib/inspect/clip-insets'
import {
  clipInsetsFromCssPolygon,
  clipPropsFromCssPolygon,
} from '../lib/scene/clip-path-import'

describe('clip polygon Phase C', () => {
  it('paint prefers clipPolygon over insets (CL19)', () => {
    expect(
      resolveClipPathFromSceneProps({
        clipInsetBottomLeftY: '12%',
        clipPolygon: '0 0, 100% 0, 80% 100%, 0 100%',
      }),
    ).toBe('polygon(0 0, 100% 0, 80% 100%, 0 100%)')
  })

  it('falls back to insets when clipPolygon empty', () => {
    expect(
      resolveClipPathFromSceneProps({
        clipInsetBottomLeftY: '12%',
        clipPolygon: '',
      }),
    ).toBe('polygon(0 0, 100% 0, 100% 100%, 0 calc(100% - 12%))')
  })

  it('builds clip-path from 5–8 points', () => {
    const pts = [
      { x: '0', y: '0' },
      { x: '50%', y: '0' },
      { x: '100%', y: '0' },
      { x: '100%', y: '100%' },
      { x: '0', y: '100%' },
    ]
    expect(clipPathFromPolygonPoints(pts)).toBe(
      'polygon(0 0, 50% 0, 100% 0, 100% 100%, 0 100%)',
    )
    expect(parseClipPolygonPoints(formatClipPolygonPoints(pts))).toEqual(pts)
  })

  it('rejects >8 points', () => {
    const nine = Array.from({ length: CLIP_POLYGON_MAX_POINTS + 1 }, () => ({
      x: '0',
      y: '0',
    }))
    expect(clipPathFromPolygonPoints(nine)).toBeUndefined()
    expect(parseClipPolygonPoints(formatClipPolygonPoints(nine))).toBeNull()
  })
})

describe('clipPropsFromCssPolygon CL22', () => {
  it('still maps corner-inset 4-point to insets', () => {
    expect(clipPropsFromCssPolygon('polygon(0 0, 100% 0, 100% 100%, 0 88%)')).toEqual({
      clipInsetBottomLeftY: '12%',
    })
  })

  it('maps non-inset 4-point to clipPolygon', () => {
    // BR at 40% is not a far-edge inset silhouette (CL12), so CL22 stores clipPolygon.
    expect(clipPropsFromCssPolygon('polygon(0 0, 100% 0, 40% 100%, 0 100%)')).toEqual({
      clipPolygon: '0 0, 100% 0, 40% 100%, 0 100%',
    })
    expect(clipInsetsFromCssPolygon('polygon(0 0, 100% 0, 40% 100%, 0 100%)')).toBeNull()
  })

  it('maps 5-point polygon to clipPolygon', () => {
    expect(
      clipPropsFromCssPolygon('polygon(0 0, 50% 0, 100% 0, 100% 100%, 0 100%)'),
    ).toEqual({
      clipPolygon: '0 0, 50% 0, 100% 0, 100% 100%, 0 100%',
    })
  })

  it('returns null for circle', () => {
    expect(clipPropsFromCssPolygon('circle(50%)')).toBeNull()
  })
})
