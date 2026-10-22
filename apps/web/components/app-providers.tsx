'use client'

import type { ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import { ToastProvider } from '../lib/zaoly-ui-client'
import { UserPrefsProvider } from '../lib/user-prefs'
import type { UiLocaleId } from '../lib/user-prefs'

export function AppProviders({
  children,
  initialLocale,
}: {
  children: ReactNode
  initialLocale?: UiLocaleId
}) {
  return (
    <SessionProvider>
      <UserPrefsProvider initialLocale={initialLocale}>
        <ToastProvider>{children}</ToastProvider>
      </UserPrefsProvider>
    </SessionProvider>
  )
}
