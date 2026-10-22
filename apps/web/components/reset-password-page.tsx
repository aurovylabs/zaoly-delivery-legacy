'use client'

import React, { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, Field, Input, Panel, SectionChrome, Text } from '@zaoly/ui'
import { paths } from '../lib/paths'
import { useUserPrefs } from '../lib/user-prefs'
import { AuthScreenLayout } from './auth-screen-layout'

function ResetPasswordForm({ authConfigured }: { authConfigured: boolean }) {
  const { t, locale } = useUserPrefs()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')?.trim() || ''
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!authConfigured || !token) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(paths.routes.apiAuthResetPassword, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password, locale }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        if (data.error === 'password_too_short') throw new Error(t('register.passwordTooShort'))
        if (data.error === 'token_expired' || data.error === 'invalid_token') {
          throw new Error(t('reset.invalidToken'))
        }
        throw new Error(data.error || t('reset.failed'))
      }
      router.replace(paths.routes.login)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('reset.failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Panel>
      <SectionChrome title={t('reset.sectionTitle')} meta={paths.brandLabel} />
      {!authConfigured ? (
        <Text role="body">{t('login.unconfiguredHint')}</Text>
      ) : !token ? (
        <Text role="body">{t('reset.invalidToken')}</Text>
      ) : (
        <>
          <Text role="body">{t('reset.body')}</Text>
          {error ? (
            <p role="alert" style={{ color: 'var(--danger)', marginTop: '0.75rem' }}>
              {error}
            </p>
          ) : null}
          <form onSubmit={onSubmit} style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
            <Field label={t('login.password')} size="md">
              <Input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={10}
                block
                aria-label={t('login.password')}
              />
            </Field>
            <Text role="meta">{t('register.passwordHint')}</Text>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? t('common.loading') : t('reset.submit')}
            </Button>
          </form>
        </>
      )}
      <Text role="meta" as="p" style={{ marginTop: '1rem' }}>
        <Link href={paths.routes.login}>{t('common.signIn')}</Link>
      </Text>
    </Panel>
  )
}

export function ResetPasswordPage({ authConfigured }: { authConfigured: boolean }) {
  return (
    <AuthScreenLayout>
      <Suspense fallback={<Panel>Loading…</Panel>}>
        <ResetPasswordForm authConfigured={authConfigured} />
      </Suspense>
    </AuthScreenLayout>
  )
}
