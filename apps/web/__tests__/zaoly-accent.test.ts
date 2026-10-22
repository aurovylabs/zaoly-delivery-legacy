import { afterEach, describe, expect, it } from 'vitest'
import { paths } from '../lib/paths'
import { applyZaolyAccentPreference, migrateZaolyAccent } from '../lib/zaoly-accent'

describe('zaoly accent', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('style')
    document.documentElement.removeAttribute('data-accent')
  })

  it('defaults empty storage to blue', () => {
    expect(migrateZaolyAccent(null)).toBe('blue')
    expect(migrateZaolyAccent(undefined)).toBe('blue')
    expect(migrateZaolyAccent('')).toBe('blue')
  })

  it('maps cobalt hex to blue preference', () => {
    expect(migrateZaolyAccent(paths.brandPrimaryHex)).toBe('blue')
    expect(migrateZaolyAccent('cobalt')).toBe('blue')
  })

  it('applies CD cobalt for blue preference', () => {
    applyZaolyAccentPreference('blue')
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#1f44ff')
    expect(document.documentElement.style.getPropertyValue('--brand-primary')).toBe('#1f44ff')
    expect(document.documentElement.getAttribute('data-accent')).toBe('blue')
  })
})
