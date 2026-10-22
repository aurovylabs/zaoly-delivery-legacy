import { paths } from './paths'
import type { UiLocaleId } from './user-prefs'

export function siteText(locale: UiLocaleId, de: string, en: string): string {
  return locale === 'de' ? de : en
}

/**
 * Product default is English. Accept-Language is ignored so DE browsers
 * do not force German UI — users pick locale explicitly in Settings.
 * @deprecated Prefer `paths.defaultLocale`; kept for callers/tests.
 */
export function requestLocaleFromAcceptLanguage(
  _value: string | null | undefined,
): UiLocaleId {
  return paths.defaultLocale
}
