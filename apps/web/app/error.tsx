'use client'

import { useEffect } from 'react'
import { Button } from '../lib/zaoly-ui'
import { reportError } from '../lib/observability/report-error'
import { useT } from '../lib/user-prefs'

/**
 * App Router segment error fallback.
 * Spec: specs/domain/ci-and-error-boundary.md · observability-and-unbound-w4.md
 */
export default function CreationError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useT()

  useEffect(() => {
    reportError(error, { source: 'error-boundary', digest: error.digest })
  }, [error])

  return (
    <main className="creation-error-fallback" data-testid="creation-error-boundary">
      <h1 className="creation-error-fallback__title">{t('common.errorTitle')}</h1>
      <p className="creation-error-fallback__body">{t('common.errorBody')}</p>
      <Button type="button" variant="primary" onClick={reset}>
        {t('common.errorRetry')}
      </Button>
    </main>
  )
}
