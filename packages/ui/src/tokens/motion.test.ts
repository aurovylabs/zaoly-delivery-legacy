import { describe, expect, it } from 'vitest'
import { duration, easing, motion } from './motion'

describe('motion tokens', () => {
  it('exposes duration scale used by product UI', () => {
    expect(duration.fast).toBe('120ms')
    expect(duration.normal).toBe('220ms')
    expect(duration.slow).toBe('420ms')
    expect(duration.fade).toBe('100ms')
  })

  it('exposes easing curves', () => {
    expect(easing.standard).toContain('cubic-bezier')
    expect(easing.enter).toContain('cubic-bezier')
    expect(easing.exit).toContain('cubic-bezier')
  })

  it('builds semantic recipes from duration + easing', () => {
    expect(motion.hover).toBe(`${duration.fast} ${easing.standard}`)
    expect(motion.enter).toBe(`${duration.normal} ${easing.enter}`)
    expect(motion.sheet).toContain(duration.normal)
  })
})
