import { describe, expect, it } from 'vitest'
import {
  nudgeCssLengthLiteral,
  nudgeFontWeightLiteral,
} from '../lib/inspect/resolve-hud-model'

describe('HUD literal nudges', () => {
  it('nudges px lengths', () => {
    expect(nudgeCssLengthLiteral('16px', 1)).toBe('17px')
    expect(nudgeCssLengthLiteral('16px', -1)).toBe('15px')
    expect(nudgeCssLengthLiteral('', 1)).toBe('17px')
  })

  it('nudges rem lengths', () => {
    expect(nudgeCssLengthLiteral('1rem', 1)).toBe('2rem')
    expect(nudgeCssLengthLiteral('0.5rem', -1)).toBe('0.01rem')
  })

  it('nudges font weights in 100 steps', () => {
    expect(nudgeFontWeightLiteral('400', 1)).toBe('500')
    expect(nudgeFontWeightLiteral('400', -1)).toBe('300')
    expect(nudgeFontWeightLiteral('', 1)).toBe('500')
    expect(nudgeFontWeightLiteral('900', 1)).toBe('900')
    expect(nudgeFontWeightLiteral('100', -1)).toBe('100')
  })
})
