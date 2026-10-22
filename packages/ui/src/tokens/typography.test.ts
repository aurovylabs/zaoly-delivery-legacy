import { describe, expect, it } from 'vitest'
import { fontStacks, fontWeights, letterSpacing, textRoles, typeSteps } from './typography'

describe('typography tokens (spec zaoly-ui-typography)', () => {
  it('defines size steps from 2xs through display', () => {
    expect(typeSteps.xs).toBe('0.65rem')
    expect(typeSteps.sm).toBe('0.72rem')
    expect(typeSteps.md).toBe('0.78rem')
    expect(typeSteps.lg).toBe('0.88rem')
    expect(typeSteps.display).toContain('clamp')
    expect(typeSteps.brand).toContain('clamp')
    expect(Object.keys(typeSteps)).toEqual([
      '2xs',
      'xs',
      'sm',
      'md',
      'lg',
      'xl',
      '2xl',
      '3xl',
      'display',
      'brand',
    ])
  })

  it('keeps regular 400 as default UI weight', () => {
    expect(fontWeights.regular).toBe(400)
    expect(fontWeights.thin).toBe(200)
    expect(fontWeights.semibold).toBe(600)
    expect(fontWeights.bold).toBe(700)
  })

  it('exposes stacks and tracking', () => {
    expect(fontStacks.body).toContain('Noto Sans JP')
    expect(fontStacks.mono).toContain('IBM Plex Mono')
    expect(letterSpacing.meta).toBe('0.04em')
    expect(letterSpacing.display).toBe('-0.02em')
    expect(textRoles).toContain('hint')
    expect(textRoles).toContain('display')
    expect(textRoles).toContain('headline')
  })
})
