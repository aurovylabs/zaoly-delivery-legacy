'use client'

import { useEffect, useMemo } from 'react'
import { createTranslator, type Locale } from '../lib/i18n'
import { reportError } from '../lib/observability/report-error'
import { paths } from '../lib/paths'

/**
 * Root-layout crash fallback — no AppProviders / DS dependency.
 * Spec: specs/domain/ci-and-error-boundary.md · observability-and-unbound-w4.md
 */
function readLocale(): Locale {
  if (typeof window === 'undefined') return paths.defaultLocale
  try {
    const raw = window.localStorage.getItem(paths.localeStorageKey)
    if (raw && (paths.localeChoices as readonly string[]).includes(raw)) {
      return raw as Locale
    }
  } catch {
    /* ignore */
  }
  return paths.defaultLocale
}

export default function CreationGlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useMemo(() => createTranslator(readLocale()), [])

  useEffect(() => {
    reportError(error, { source: 'global-error', digest: error.digest })
  }, [error])

  return (
    <html lang={paths.defaultLocale}>
      <body>
        <main className="creation-error-fallback" data-testid="creation-error-boundary">
          <h1 className="creation-error-fallback__title">{t('common.errorTitle')}</h1>
          <p className="creation-error-fallback__body">{t('common.errorBody')}</p>
          <button type="button" onClick={reset}>
            {t('common.errorRetry')}
          </button>
        </main>
      </body>
    </html>
  )
}
