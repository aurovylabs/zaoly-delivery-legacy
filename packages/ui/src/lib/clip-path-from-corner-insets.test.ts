import { describe, expect, it } from 'vitest'
import { clipPathFromCornerInsets } from './clip-path-from-corner-insets'

describe('clipPathFromCornerInsets', () => {
  it('returns undefined when empty or all zero', () => {
    expect(clipPathFromCornerInsets(undefined)).toBeUndefined()
    expect(clipPathFromCornerInsets({})).toBeUndefined()
    expect(
      clipPathFromCornerInsets({
        bottomLeft: { x: '0', y: '0%' },
        bottomRight: { y: '0px' },
      }),
    ).toBeUndefined()
  })

  it('builds bottom-slant (BL raised) polygon', () => {
    expect(
      clipPathFromCornerInsets({
        bottomLeft: { y: '12%' },
      }),
    ).toBe('polygon(0 0, 100% 0, 100% 100%, 0 calc(100% - 12%))')
  })

  it('builds four-corner insets with length units', () => {
    expect(
      clipPathFromCornerInsets({
        topLeft: { x: '8px', y: '4px' },
        topRight: { x: '1rem', y: '0' },
        bottomRight: { x: '0', y: '2rem' },
        bottomLeft: { x: '10%', y: '5%' },
      }),
    ).toBe(
      'polygon(8px 4px, calc(100% - 1rem) 0, 100% calc(100% - 2rem), 10% calc(100% - 5%))',
    )
  })
})
