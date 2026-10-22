import { describe, expect, it } from 'vitest'
import { requestLocaleFromAcceptLanguage, siteText } from '../lib/public-site-locale'
import { paths } from '../lib/paths'

describe('public-site-locale', () => {
  it('defaults to English regardless of Accept-Language', () => {
    expect(requestLocaleFromAcceptLanguage('de-DE,de;q=0.9,en;q=0.8')).toBe('en')
    expect(requestLocaleFromAcceptLanguage('en-US,en;q=0.9')).toBe('en')
    expect(requestLocaleFromAcceptLanguage(null)).toBe(paths.defaultLocale)
    expect(paths.defaultLocale).toBe('en')
  })

  it('siteText picks by explicit locale', () => {
    expect(siteText('de', 'Hallo', 'Hello')).toBe('Hallo')
    expect(siteText('en', 'Hallo', 'Hello')).toBe('Hello')
  })
})
