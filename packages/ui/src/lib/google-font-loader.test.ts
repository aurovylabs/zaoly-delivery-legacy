import { describe, expect, it } from 'vitest'
import { filterGoogleFontsCatalog, GOOGLE_FONTS_CATALOG } from '../lib/google-fonts-catalog'
import { googleFontStylesheetHref, resolveGoogleFontFamily } from '../lib/google-font-loader'

describe('google-fonts-catalog', () => {
  it('filters by family name', () => {
    const hits = filterGoogleFontsCatalog('inter', GOOGLE_FONTS_CATALOG)
    expect(hits.some((e) => e.family === 'Inter')).toBe(true)
  })
})

describe('google-font-loader', () => {
  it('resolves geist alias', () => {
    expect(resolveGoogleFontFamily('Geist')).toBe('Inter')
  })

  it('builds stylesheet href', () => {
    const href = googleFontStylesheetHref('Inter', ['400', '600'])
    expect(href).toContain('fonts.googleapis.com')
    expect(href).toContain('Inter')
  })
})
