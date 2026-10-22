import { cookies } from 'next/headers'
import { paths } from './paths'
import type { UiLocaleId } from './user-prefs'

/** Cookie when set; otherwise product default (`en`). No Accept-Language sniff. */
export async function getPublicSiteLocale(): Promise<UiLocaleId> {
  const cookieStore = await cookies()
  const stored = cookieStore.get(paths.localeStorageKey)?.value
  if (stored === 'de' || stored === 'en') return stored
  return paths.defaultLocale
}
