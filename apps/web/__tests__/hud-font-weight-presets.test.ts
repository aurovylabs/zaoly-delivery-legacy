import { describe, expect, it } from 'vitest'
import {
  HUD_FONT_WEIGHT_PRESETS,
  fontWeightSortKey,
  hudFontWeightLiteralPath,
  isHudFontWeightLiteralPath,
  parseHudFontWeightLiteralPath,
} from '../lib/inspect/hud-font-weight-presets'

describe('hud-font-weight-presets', () => {
  it('round-trips synthetic wt: paths', () => {
    expect(hudFontWeightLiteralPath('700')).toBe('wt:700')
    expect(parseHudFontWeightLiteralPath('wt:700')).toBe('700')
    expect(parseHudFontWeightLiteralPath('typography.body.family')).toBeNull()
    expect(isHudFontWeightLiteralPath('wt:400')).toBe(true)
  })

  it('exposes 100–900 ladder (no Brandion fontWeight.* paths)', () => {
    expect(HUD_FONT_WEIGHT_PRESETS).toEqual([
      '100',
      '200',
      '300',
      '400',
      '500',
      '600',
      '700',
      '800',
      '900',
    ])
  })

  it('sorts numeric and keyword weights', () => {
    expect(fontWeightSortKey('400')).toBe(400)
    expect(fontWeightSortKey('bold')).toBe(700)
    expect(fontWeightSortKey('normal')).toBe(400)
  })
})
