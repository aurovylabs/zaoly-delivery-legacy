import { describe, expect, it } from 'vitest'
import {
  amountForClipPreset,
  clipInsetPropsFromPreset,
  detectClipPreset,
  cornerInsetsFromClipPreset,
} from '../lib/inspect/clip-presets'

describe('clip presets (W16 Phase B / CL14–CL17)', () => {
  it('maps slant-bottom to flat props and clears other axes', () => {
    expect(clipInsetPropsFromPreset('slant-bottom', '12%')).toEqual({
      clipInsetTopLeftX: '',
      clipInsetTopLeftY: '',
      clipInsetTopRightX: '',
      clipInsetTopRightY: '',
      clipInsetBottomRightX: '',
      clipInsetBottomRightY: '',
      clipInsetBottomLeftX: '',
      clipInsetBottomLeftY: '12%',
    })
  })

  it('defaults blank amount to 12%', () => {
    expect(cornerInsetsFromClipPreset('trapezoid')).toEqual({
      bottomLeft: { x: '12%' },
      bottomRight: { x: '12%' },
    })
  })

  it('detects presets from insets', () => {
    expect(detectClipPreset({ props: {} })).toBe('none')
    expect(
      detectClipPreset({ props: { clipInsetBottomLeftY: '12%' } }),
    ).toBe('slant-bottom')
    expect(
      detectClipPreset({ props: { clipInsetBottomRightY: '8%' } }),
    ).toBe('slant-bottom-flip')
    expect(
      detectClipPreset({
        props: { clipInsetBottomLeftX: '10%', clipInsetBottomRightX: '10%' },
      }),
    ).toBe('trapezoid')
    expect(
      detectClipPreset({
        props: { clipInsetTopLeftX: '8px', clipInsetBottomLeftY: '12%' },
      }),
    ).toBeNull()
  })

  it('reads amount for the active preset', () => {
    expect(
      amountForClipPreset({ props: { clipInsetBottomLeftY: '12%' } }),
    ).toBe('12%')
    expect(
      amountForClipPreset({
        props: { clipInsetTopLeftX: '20%', clipInsetBottomRightX: '20%' },
      }),
    ).toBe('20%')
  })
})
