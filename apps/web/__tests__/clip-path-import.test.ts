import { describe, expect, it } from 'vitest'
import { clipInsetsFromCssPolygon } from '../lib/scene/clip-path-import'

describe('clip-path-import (CL12)', () => {
  it('maps bottom-slant polygon to clipInsetBottomLeftY', () => {
    expect(clipInsetsFromCssPolygon('polygon(0 0, 100% 0, 100% 100%, 0 88%)')).toEqual({
      clipInsetBottomLeftY: '12%',
    })
  })

  it('maps calc-based far edges', () => {
    expect(
      clipInsetsFromCssPolygon(
        'polygon(0 0, calc(100% - 8px) 0, 100% calc(100% - 12%), 0 100%)',
      ),
    ).toEqual({
      clipInsetTopRightX: '8px',
      clipInsetBottomRightY: '12%',
    })
  })

  it('returns null for non-polygon or wrong point count', () => {
    expect(clipInsetsFromCssPolygon('circle(50%)')).toBeNull()
    expect(clipInsetsFromCssPolygon('polygon(0 0, 100% 0, 100% 100%)')).toBeNull()
  })
})
