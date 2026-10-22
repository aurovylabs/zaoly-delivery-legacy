import { describe, expect, it } from 'vitest'
import {
  HUD_LENGTH_PRESETS,
  hudLengthLiteralPath,
  isHudLengthLiteralPath,
  parseHudLengthLiteralPath,
} from '../lib/inspect/hud-length-presets'

describe('hud-length-presets', () => {
  it('round-trips synthetic ln: paths', () => {
    expect(hudLengthLiteralPath('16px')).toBe('ln:16px')
    expect(parseHudLengthLiteralPath('ln:16px')).toBe('16px')
    expect(parseHudLengthLiteralPath('spacing.static.medium')).toBeNull()
    expect(isHudLengthLiteralPath('ln:8px')).toBe(true)
  })

  it('exposes a 4px-base CSS ladder (no Brandion spacing.* paths)', () => {
    expect(HUD_LENGTH_PRESETS.length).toBeGreaterThanOrEqual(6)
    expect(HUD_LENGTH_PRESETS).toContain('8px')
    expect(HUD_LENGTH_PRESETS).toContain('16px')
    expect(HUD_LENGTH_PRESETS.every((v) => /^\d+px$/.test(v))).toBe(true)
  })
})
