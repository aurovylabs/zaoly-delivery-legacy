'use client'

import React, { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button, Field, Hint, Input, Panel, SectionChrome, Text } from '@zaoly/ui'
import { paths } from '../lib/paths'
import { useUserPrefs } from '../lib/user-prefs'
import { AuthScreenLayout } from './auth-screen-layout'

function RegisterForm({
  signupEnabled,
  googleEnabled,
}: {
  signupEnabled: boolean
  googleEnabled: boolean
}) {
  const { t } = useUserPrefs()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || paths.routes.editor

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGoogle() {
    setLoading(true)
    setError(null)
    try {
      await signIn('google', { callbackUrl: redirectTo })
    } catch {
      setError(t('register.failed'))
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!signupEnabled) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(paths.routes.apiRegister, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name: name.trim() || undefined,
        }),
      })
      const data = (await res.json()) as { error?: string; email?: string }
      if (!res.ok) {
        if (data.error === 'already_exists') throw new Error(t('register.alreadyExists'))
        if (data.error === 'password_too_short') throw new Error(t('register.passwordTooShort'))
        if (data.error === 'signup_disabled') throw new Error(t('register.disabled'))
        throw new Error(t('register.failed'))
      }
      const login = await signIn('credentials', {
        email: data.email || email,
        password,
        redirect: false,
        callbackUrl: redirectTo,
      })
      if (login?.error) throw new Error(t('login.failed'))
      router.replace(redirectTo)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('register.failed'))
    } finally {
      setLoading(false)
    }
  }

  if (!signupEnabled) {
    return (
      <Panel>
        <SectionChrome title={t('register.sectionTitle')} />
        <Hint panel>{t('register.disabled')}</Hint>
        <div style={{ marginTop: '1rem' }}>
          <Link href={paths.routes.login}>
            <Button>{t('common.signIn')}</Button>
          </Link>
        </div>
      </Panel>
    )
  }

  return (
    <Panel>
      <SectionChrome title={t('register.sectionTitle')} />
      <Text role="body">{t('register.body')}</Text>
      {error ? (
        <p role="alert" style={{ color: 'var(--danger)', marginTop: '0.75rem' }}>
          {error}
        </p>
      ) : null}
      {googleEnabled ? (
        <div style={{ marginTop: '1rem' }}>
          <Button type="button" variant="subtle" disabled={loading} onClick={handleGoogle} block>
            {t('login.continueWithGoogle')}
          </Button>
        </div>
      ) : null}
      <form onSubmit={handleSubmit} style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
        <Field label={t('register.name')} size="md">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            block
            aria-label={t('register.name')}
          />
        </Field>
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
          {loading ? t('common.loading') : t('register.submit')}
        </Button>
      </form>
      <Text role="meta" as="p" className="creation-login__footer">
        {t('register.haveAccount')}{' '}
        <Link href={paths.routes.login}>{t('common.signIn')}</Link>
      </Text>
    </Panel>
  )
}

export function RegisterPage({
  signupEnabled,
  googleEnabled,
}: {
  signupEnabled: boolean
  googleEnabled: boolean
}) {
  return (
    <AuthScreenLayout landscape>
      <Suspense fallback={<Panel>Loading…</Panel>}>
        <RegisterForm signupEnabled={signupEnabled} googleEnabled={googleEnabled} />
      </Suspense>
    </AuthScreenLayout>
  )
}
