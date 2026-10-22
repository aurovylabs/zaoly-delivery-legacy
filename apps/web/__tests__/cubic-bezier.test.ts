import { describe, expect, it } from 'vitest'
import {
  formatCubicBezier,
  matchingPresetId,
  parseCubicBezier,
  sampleBezierPath,
} from '../lib/tokens/cubic-bezier'

describe('cubic-bezier', () => {
  it('parses keywords and cubic-bezier strings', () => {
    expect(parseCubicBezier('ease')).toEqual({ x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 })
    expect(parseCubicBezier('cubic-bezier(0.2, 0, 0, 1)')).toEqual({
      x1: 0.2,
      y1: 0,
      x2: 0,
      y2: 1,
    })
    expect(parseCubicBezier('nope')).toBeNull()
  })

  it('formats and clamps control points', () => {
    expect(formatCubicBezier({ x1: -0.2, y1: 1.3, x2: 1.4, y2: 1 })).toBe(
      'cubic-bezier(0, 1.3, 1, 1)',
    )
  })

  it('samples a curve and matches presets', () => {
    const samples = sampleBezierPath({ x1: 0, y1: 0, x2: 1, y2: 1 }, 4)
    expect(samples[0]).toEqual({ x: 0, y: 0 })
    expect(samples.at(-1)).toEqual({ x: 1, y: 1 })
    expect(matchingPresetId('cubic-bezier(0.2, 0, 0, 1)')).toBe('standard')
    expect(matchingPresetId('ease-in-out')).toBe('ease-in-out')
  })
})
