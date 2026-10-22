import type { ReactNode } from 'react'
import { AppProviders } from './app-providers'
import { getPublicSiteLocale } from '../lib/public-site-locale-server'

/** Suspense-bounded cookie locale → AppProviders (Cache Components). */
export async function RootProvidersWithLocale({ children }: { children: ReactNode }) {
  const initialLocale = await getPublicSiteLocale()
  return <AppProviders initialLocale={initialLocale}>{children}</AppProviders>
}
