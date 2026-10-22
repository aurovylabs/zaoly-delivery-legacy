import { describe, expect, it } from 'vitest'
import { studioTypeForHudGroup } from '../components/hud-promote-context'

describe('studioTypeForHudGroup', () => {
  it('maps HUD groups to Brandion studio scalars', () => {
    expect(studioTypeForHudGroup('color')).toBe('color')
    expect(studioTypeForHudGroup('space')).toBe('spacing')
    expect(studioTypeForHudGroup('radius')).toBe('radius')
    expect(studioTypeForHudGroup('fontSize')).toBe('size')
    expect(studioTypeForHudGroup('size')).toBe('size')
    expect(studioTypeForHudGroup('fontFamily')).toBeNull()
    expect(studioTypeForHudGroup('fontWeight')).toBeNull()
  })
})
