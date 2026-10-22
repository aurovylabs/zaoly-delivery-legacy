import { describe, expect, it } from 'vitest'
import {
  HUD_FONT_SIZE_PRESETS,
  hudFontSizeLiteralPath,
  isHudFontSizeLiteralPath,
  parseHudFontSizeLiteralPath,
} from '../lib/inspect/hud-font-size-presets'

describe('hud-font-size-presets', () => {
  it('round-trips synthetic sz: paths', () => {
    expect(hudFontSizeLiteralPath('16px')).toBe('sz:16px')
    expect(parseHudFontSizeLiteralPath('sz:16px')).toBe('16px')
    expect(parseHudFontSizeLiteralPath('typography.body.family')).toBeNull()
    expect(isHudFontSizeLiteralPath('sz:24px')).toBe(true)
  })

  it('exposes a short CSS ladder (no Brandion fontSize.* paths)', () => {
    expect(HUD_FONT_SIZE_PRESETS.length).toBeGreaterThanOrEqual(6)
    expect(HUD_FONT_SIZE_PRESETS).toContain('16px')
    expect(HUD_FONT_SIZE_PRESETS.every((v) => /^\d+px$/.test(v))).toBe(true)
  })
})
