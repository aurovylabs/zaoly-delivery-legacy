'use client'

import React, { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { startAuthentication } from '@simplewebauthn/browser'
import type { PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/browser'
import { Button, Field, Hint, Input, Panel, SectionChrome, Text } from '@zaoly/ui'
import { paths } from '../lib/paths'
import { useUserPrefs } from '../lib/user-prefs'
import { AuthScreenLayout } from './auth-screen-layout'

function LoginForm({
  authConfigured,
  signupEnabled,
  googleEnabled,
}: {
  authConfigured: boolean
  signupEnabled: boolean
  googleEnabled: boolean
}) {
  const { t } = useUserPrefs()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || paths.routes.editor

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totp, setTotp] = useState('')
  const [mfaStep, setMfaStep] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGoogle() {
    setLoading(true)
    setError(null)
    try {
      await signIn('google', { callbackUrl: redirectTo })
    } catch {
      setError(t('login.failed'))
      setLoading(false)
    }
  }

  async function handlePasskey() {
    if (!authConfigured || !email.trim()) {
      setError(t('login.passkeyEmailRequired'))
      return
    }
    setLoading(true)
    setError(null)
    try {
      const optRes = await fetch(paths.routes.apiAuthWebAuthnLoginOptions, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const optData = (await optRes.json()) as {
        ok?: boolean
        options?: PublicKeyCredentialRequestOptionsJSON
      }
      if (!optData.ok || !optData.options) {
        throw new Error(t('login.passkeyUnavailable'))
      }
      const assertion = await startAuthentication({ optionsJSON: optData.options })
      const verifyRes = await fetch(paths.routes.apiAuthWebAuthnLoginVerify, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, response: assertion }),
      })
      const verifyData = (await verifyRes.json()) as {
        ok?: boolean
        webauthnTicket?: string
      }
      if (!verifyData.ok || !verifyData.webauthnTicket) {
        throw new Error(t('login.passkeyFailed'))
      }
      const result = await signIn('credentials', {
        webauthnTicket: verifyData.webauthnTicket,
        redirect: false,
        callbackUrl: redirectTo,
      })
      if (result?.error || !result?.ok) throw new Error(t('login.passkeyFailed'))
      router.replace(redirectTo)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.passkeyFailed'))
    } finally {
      setLoading(false)
    }
  }

  async function completeSignIn(otp?: string) {
    const result = await signIn('credentials', {
      email,
      password,
      totp: otp ?? '',
      redirect: false,
      callbackUrl: redirectTo,
    })
    if (result?.error) {
      if (String(result.code ?? result.error).includes('mfa_required')) {
        setMfaStep(true)
        return
      }
      throw new Error(t('login.invalidCredentials'))
    }
    if (result?.ok) {
      router.replace(redirectTo)
      router.refresh()
      return
    }
    throw new Error(t('login.failed'))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!authConfigured) return
    setLoading(true)
    setError(null)
    try {
      if (!mfaStep) {
        const prep = await fetch(paths.routes.apiAuthMfaPrepare, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const data = (await prep.json()) as { ok?: boolean; mfaRequired?: boolean }
        if (!data.ok) throw new Error(t('login.invalidCredentials'))
        if (data.mfaRequired) {
          setMfaStep(true)
          return
        }
        await completeSignIn()
        return
      }
      await completeSignIn(totp)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.failed'))
    } finally {
      setLoading(false)
    }
  }

  if (!authConfigured) {
    return (
      <Panel>
        <SectionChrome title={t('login.sectionTitle')} />
        <Hint panel>{t('login.unconfiguredHint')}</Hint>
        <Text role="meta" as="p" style={{ marginTop: '0.75rem' }}>
          Set ZAOLY_DATABASE_URL and ZAOLY_BOOTSTRAP_ADMIN_EMAIL / PASSWORD, or ZAOLY_AUTH_BYPASS=1 for local DX.
        </Text>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
          <Link href={paths.routes.home}>
            <Button>{t('login.continueToApp')}</Button>
          </Link>
          <Link href={paths.routes.settings}>
            <Button variant="ghost">{t('nav.settings')}</Button>
          </Link>
        </div>
      </Panel>
    )
  }

  return (
    <Panel>
      <SectionChrome title={t('login.sectionTitle')} />
      <Text role="meta" as="p" className="creation-login__lede">
        {t('login.localBody')}
      </Text>
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
      {!mfaStep ? (
        <div style={{ marginTop: '0.75rem' }}>
          <Button
            type="button"
            variant="subtle"
            disabled={loading}
            onClick={() => void handlePasskey()}
            block
            data-testid="login-passkey"
          >
            {t('login.continueWithPasskey')}
          </Button>
        </div>
      ) : null}
      <form onSubmit={handleSubmit} style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
        {!mfaStep ? (
          <>
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
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                block
                aria-label={t('login.password')}
              />
            </Field>
            <Text role="meta" as="p">
              <Link href={paths.routes.forgotPassword}>{t('login.forgotPassword')}</Link>
            </Text>
          </>
        ) : (
          <Field label={t('login.mfaCode')} size="md">
            <Input
              type="text"
              autoComplete="one-time-code"
              inputMode="numeric"
              value={totp}
              onChange={(e) => setTotp(e.target.value)}
              required
              block
              aria-label={t('login.mfaCode')}
              data-testid="login-mfa-code"
            />
            <Hint panel>{t('login.mfaHint')}</Hint>
          </Field>
        )}
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? t('common.loading') : mfaStep ? t('login.mfaVerify') : t('common.signIn')}
        </Button>
      </form>
      {signupEnabled ? (
        <Text role="meta" as="p" className="creation-login__footer">
          {t('login.noAccount')}{' '}
          <Link href={paths.routes.register}>{t('login.register')}</Link>
        </Text>
      ) : null}
    </Panel>
  )
}

export function LoginPage({
  authConfigured,
  signupEnabled = false,
  googleEnabled = false,
}: {
  authConfigured: boolean
  signupEnabled?: boolean
  googleEnabled?: boolean
}) {
  return (
    <AuthScreenLayout landscape>
      <Suspense fallback={<Panel>Loading…</Panel>}>
        <LoginForm
          authConfigured={authConfigured}
          signupEnabled={signupEnabled}
          googleEnabled={googleEnabled}
        />
      </Suspense>
    </AuthScreenLayout>
  )
}
