import { describe, expect, it } from 'vitest'
import {
  breakpointDevicePct,
  breakpointPresetsForChannel,
  DEFAULT_DIGITAL_BREAKPOINT_PRESETS,
} from '../lib/breakpoint-editor'

describe('breakpoint-editor', () => {
  it('returns channel presets', () => {
    expect(breakpointPresetsForChannel('digital')).toEqual(DEFAULT_DIGITAL_BREAKPOINT_PRESETS)
    expect(breakpointPresetsForChannel('print')).toHaveLength(2)
  })

  it('maps minWidth to device percentage', () => {
    expect(breakpointDevicePct('640px', 'digital', 1280)).toBe('50%')
  })
})
