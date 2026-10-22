'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button, Field, Input, Panel, SectionChrome, Text } from '@zaoly/ui'
import { paths } from '../lib/paths'
import { useUserPrefs } from '../lib/user-prefs'
import { AuthScreenLayout } from './auth-screen-layout'

export function ForgotPasswordPage({ authConfigured }: { authConfigured: boolean }) {
  const { t, locale } = useUserPrefs()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!authConfigured) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(paths.routes.apiAuthForgotPassword, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error || t('forgot.failed'))
      }
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('forgot.failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthScreenLayout>
      <Panel>
        <SectionChrome title={t('forgot.sectionTitle')} meta={paths.brandLabel} />
        {!authConfigured ? (
          <Text role="body">{t('login.unconfiguredHint')}</Text>
        ) : done ? (
          <Text role="body">{t('forgot.sent')}</Text>
        ) : (
          <>
            <Text role="body">{t('forgot.body')}</Text>
            {error ? (
              <p role="alert" style={{ color: 'var(--danger)', marginTop: '0.75rem' }}>
                {error}
              </p>
            ) : null}
            <form onSubmit={onSubmit} style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
              <Field label={t('login.email')} size="md">
                <Input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  block
                  aria-label={t('login.email')}
                />
              </Field>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? t('common.loading') : t('forgot.submit')}
              </Button>
            </form>
          </>
        )}
        <Text role="meta" as="p" className="creation-login__footer">
          <Link href={paths.routes.login}>{t('common.signIn')}</Link>
        </Text>
      </Panel>
    </AuthScreenLayout>
  )
}
