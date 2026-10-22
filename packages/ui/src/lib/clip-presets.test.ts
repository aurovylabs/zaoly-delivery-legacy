import { describe, expect, it } from 'vitest'
import {
  CLIP_PRESET_IDS,
  DEFAULT_CLIP_PRESET_AMOUNT,
  cornerInsetsFromClipPreset,
} from './clip-presets'
import { clipPathFromCornerInsets } from './clip-path-from-corner-insets'

describe('cornerInsetsFromClipPreset', () => {
  it('exposes the Phase B preset ids', () => {
    expect(CLIP_PRESET_IDS).toEqual([
      'none',
      'slant-bottom',
      'slant-bottom-flip',
      'slant-top',
      'trapezoid',
      'parallelogram',
    ])
    expect(DEFAULT_CLIP_PRESET_AMOUNT).toBe('12%')
  })

  it('returns empty insets for none', () => {
    expect(cornerInsetsFromClipPreset('none')).toEqual({})
    expect(clipPathFromCornerInsets(cornerInsetsFromClipPreset('none'))).toBeUndefined()
  })

  it('maps slant-bottom with default amount', () => {
    expect(cornerInsetsFromClipPreset('slant-bottom')).toEqual({
      bottomLeft: { y: '12%' },
    })
  })

  it('maps each shape with a custom amount', () => {
    expect(cornerInsetsFromClipPreset('slant-bottom-flip', '8%')).toEqual({
      bottomRight: { y: '8%' },
    })
    expect(cornerInsetsFromClipPreset('slant-top', '10%')).toEqual({
      topLeft: { y: '10%' },
    })
    expect(cornerInsetsFromClipPreset('trapezoid', '16%')).toEqual({
      bottomLeft: { x: '16%' },
      bottomRight: { x: '16%' },
    })
    expect(cornerInsetsFromClipPreset('parallelogram', '20%')).toEqual({
      topLeft: { x: '20%' },
      bottomRight: { x: '20%' },
    })
  })

  it('uses default when amount is blank', () => {
    expect(cornerInsetsFromClipPreset('slant-bottom', '  ')).toEqual({
      bottomLeft: { y: '12%' },
    })
  })
})
