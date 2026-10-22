/** System mail locales. Spec: `specs/domain/zaoly-system-mail.md` */
export type MailLocale = 'en' | 'de'

export function resolveMailLocale(raw?: string | null): MailLocale {
  if (!raw) return 'en'
  const normalized = raw.trim().toLowerCase()
  if (normalized === 'de' || normalized.startsWith('de-')) return 'de'
  return 'en'
}
