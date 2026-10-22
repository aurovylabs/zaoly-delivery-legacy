import { describe, expect, it } from 'vitest'
import {
  CLIP_POLYGON_MAX_POINTS,
  CLIP_POLYGON_MIN_POINTS,
  clipPathFromPolygonPoints,
  defaultClipPolygonPoints,
  formatClipPolygonPoints,
  parseClipPolygonPoints,
} from './clip-path-from-polygon-points'

describe('clipPathFromPolygonPoints', () => {
  it('builds polygon from four points', () => {
    expect(
      clipPathFromPolygonPoints([
        { x: '0', y: '0' },
        { x: '100%', y: '0' },
        { x: '100%', y: '100%' },
        { x: '0', y: '88%' },
      ]),
    ).toBe('polygon(0 0, 100% 0, 100% 100%, 0 88%)')
  })

  it('rejects fewer than 4 or more than 8 points', () => {
    expect(clipPathFromPolygonPoints([{ x: '0', y: '0' }])).toBeUndefined()
    const nine = Array.from({ length: CLIP_POLYGON_MAX_POINTS + 1 }, () => ({
      x: '0',
      y: '0',
    }))
    expect(clipPathFromPolygonPoints(nine)).toBeUndefined()
  })

  it('accepts up to 8 points', () => {
    const pts = Array.from({ length: CLIP_POLYGON_MAX_POINTS }, (_, i) => ({
      x: `${i * 10}%`,
      y: `${i * 5}%`,
    }))
    expect(clipPathFromPolygonPoints(pts)?.startsWith('polygon(')).toBe(true)
  })
})

describe('parseClipPolygonPoints', () => {
  it('parses interior string and wrapped polygon()', () => {
    expect(parseClipPolygonPoints('0 0, 100% 0, 100% 100%, 0 88%')).toEqual([
      { x: '0', y: '0' },
      { x: '100%', y: '0' },
      { x: '100%', y: '100%' },
      { x: '0', y: '88%' },
    ])
    expect(
      parseClipPolygonPoints('polygon(0 0, 100% 0, 50% 100%, 0 100%)'),
    ).toHaveLength(CLIP_POLYGON_MIN_POINTS)
  })

  it('parses calc() vertices', () => {
    expect(
      parseClipPolygonPoints(
        '0 0, calc(100% - 8px) 0, 100% calc(100% - 12%), 0 100%',
      ),
    ).toEqual([
      { x: '0', y: '0' },
      { x: 'calc(100% - 8px)', y: '0' },
      { x: '100%', y: 'calc(100% - 12%)' },
      { x: '0', y: '100%' },
    ])
  })

  it('rejects wrong counts', () => {
    expect(parseClipPolygonPoints('0 0, 100% 0, 100% 100%')).toBeNull()
    expect(parseClipPolygonPoints('')).toBeNull()
  })

  it('round-trips format', () => {
    const pts = defaultClipPolygonPoints()
    expect(parseClipPolygonPoints(formatClipPolygonPoints(pts))).toEqual(pts)
  })
})
