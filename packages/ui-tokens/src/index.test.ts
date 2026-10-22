import { describe, expect, it } from 'vitest'
import {
  brandionPromoteCssVar,
  breakpoints,
  shadows,
  typeSteps,
  webSystemAliases,
  zIndex,
} from './index'

describe('ui tokens', () => {
  it('re-exports typography scale', () => {
    expect(typeSteps.display).toContain('clamp(')
  })

  it('exposes web-system scales', () => {
    expect(shadows.sm).toContain('rgba')
    expect(zIndex.modal).toBe(1400)
    expect(zIndex.navRail).toBe(1200)
    expect(breakpoints.sm).toBe('640px')
    expect(breakpoints['2xl']).toBe('1920px')
    expect(webSystemAliases.background).toBe('var(--bg0)')
    expect(webSystemAliases.primary).toBe('var(--accent)')
    expect(webSystemAliases.mutedForeground).toBe('var(--muted)')
    expect(brandionPromoteCssVar['color.action.primary']).toBe('--accent')
  })
})
