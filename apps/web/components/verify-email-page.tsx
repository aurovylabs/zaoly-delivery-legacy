'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button, Panel, SectionChrome, Text } from '@zaoly/ui'
import { paths } from '../lib/paths'
import { useUserPrefs } from '../lib/user-prefs'
import { AuthScreenLayout } from './auth-screen-layout'

export function VerifyEmailPage({ authConfigured }: { authConfigured: boolean }) {
  const { t } = useUserPrefs()
  const search = useSearchParams()
  const token = search.get('token')?.trim() ?? ''
  const [status, setStatus] = useState<'idle' | 'working' | 'ok' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authConfigured || !token || status !== 'idle') return
    setStatus('working')
    void fetch(paths.routes.apiAuthVerifyEmail, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (r) => {
        const data = (await r.json().catch(() => ({}))) as { error?: string }
        if (!r.ok) {
          setError(
            data.error === 'token_expired' ? t('verify.expired') : t('verify.invalid'),
          )
          setStatus('error')
          return
        }
        setStatus('ok')
      })
      .catch(() => {
        setError(t('verify.failed'))
        setStatus('error')
      })
  }, [authConfigured, token, status, t])

  const body = !authConfigured
    ? t('login.unconfiguredHint')
    : !token
      ? t('verify.missingToken')
      : status === 'ok'
        ? t('verify.success')
        : status === 'error'
          ? (error ?? t('verify.failed'))
          : t('verify.working')

  return (
    <AuthScreenLayout>
      <Panel>
        <SectionChrome title={t('verify.sectionTitle')} meta={paths.brandLabel} />
        <Text role="body">{body}</Text>
        <Text role="meta" as="p" className="creation-login__footer">
          <Link href={paths.routes.login}>{t('common.signIn')}</Link>
          {' · '}
          <Link href={paths.routes.settings}>{t('verify.settings')}</Link>
        </Text>
        {status === 'ok' ? (
          <div style={{ marginTop: '1rem' }}>
            <Link href={paths.routes.editor}>
              <Button variant="primary" size="sm">
                {t('verify.openEditor')}
              </Button>
            </Link>
          </div>
        ) : null}
      </Panel>
    </AuthScreenLayout>
  )
}
