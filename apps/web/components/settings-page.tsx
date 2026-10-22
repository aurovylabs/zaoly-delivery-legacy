'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  AccentSwatchGroup,
  Avatar,
  Button,
  Field,
  Input,
  resolveAccentOption,
  SettingsShell,
  ToggleGroup,
} from '@zaoly/ui'
import { paths } from '../lib/paths'
import { useUserPrefs, type UiLocaleId, type UiThemeId } from '../lib/user-prefs'

export function SettingsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { displayName, setDisplayName, theme, setTheme, accent, setAccent, locale, setLocale, t } =
    useUserPrefs()
  const [draft, setDraft] = useState(displayName)
  const [loggingOut, setLoggingOut] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [hasPassword, setHasPassword] = useState(true)
  const [emailVerified, setEmailVerified] = useState(true)
  const [passwordDraft, setPasswordDraft] = useState('')
  const [currentPasswordDraft, setCurrentPasswordDraft] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null)
  const [verifyBusy, setVerifyBusy] = useState(false)
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') {
      setIsAdmin(false)
      setHasPassword(true)
      setEmailVerified(true)
      return
    }
    void fetch(paths.routes.apiMe)
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (data: {
          role?: string
          realRole?: string
          hasPassword?: boolean
          emailVerified?: boolean
        } | null) => {
          setIsAdmin(
            data?.role === 'admin' ||
              data?.role === 'platform_admin' ||
              data?.realRole === 'admin' ||
              data?.realRole === 'platform_admin',
          )
          if (typeof data?.hasPassword === 'boolean') setHasPassword(data.hasPassword)
          if (typeof data?.emailVerified === 'boolean') setEmailVerified(data.emailVerified)
        },
      )
      .catch(() => setIsAdmin(false))
  }, [status])

  const themeLabels: Record<UiThemeId, string> = {
    light: t('settings.themeLight'),
    dark: t('settings.themeDark'),
    auto: t('settings.themeAuto'),
  }

  const localeLabels: Record<UiLocaleId, string> = {
    en: t('settings.english'),
    de: t('settings.deutsch'),
  }

  useEffect(() => {
    setDraft(displayName)
  }, [displayName])

  useEffect(() => {
    const sessionName = session?.user?.name?.trim()
    if (status !== 'authenticated' || !sessionName) return
    if (displayName === paths.defaultDisplayName || !displayName.trim()) {
      setDisplayName(sessionName)
      setDraft(sessionName)
    }
  }, [status, session?.user?.name, displayName, setDisplayName])

  function commitName() {
    setDisplayName(draft)
    if (status === 'authenticated') {
      void fetch(paths.routes.apiMe, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: draft.trim() }),
      })
    }
  }

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await signOut({ redirect: false })
      router.replace(paths.routes.login)
      router.refresh()
    } finally {
      setLoggingOut(false)
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault()
    setPasswordBusy(true)
    setPasswordMsg(null)
    try {
      const body: { password: string; currentPassword?: string } = { password: passwordDraft }
      if (hasPassword) body.currentPassword = currentPasswordDraft
      const res = await fetch(paths.routes.apiMePassword, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        if (data.error === 'password_too_short') {
          setPasswordMsg(t('register.passwordTooShort'))
        } else if (data.error === 'invalid_current_password') {
          setPasswordMsg(t('settings.passwordCurrentInvalid'))
        } else {
          setPasswordMsg(t('settings.passwordFailed'))
        }
        return
      }
      setHasPassword(true)
      setPasswordDraft('')
      setCurrentPasswordDraft('')
      setPasswordMsg(t('settings.passwordSaved'))
    } catch {
      setPasswordMsg(t('settings.passwordFailed'))
    } finally {
      setPasswordBusy(false)
    }
  }

  async function handleResendVerify() {
    setVerifyBusy(true)
    setVerifyMsg(null)
    try {
      const res = await fetch(paths.routes.apiAuthVerifyEmailResend, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ locale }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        emailSent?: boolean
        already_verified?: boolean
      }
      if (!res.ok) {
        setVerifyMsg(t('settings.verifyResendFailed'))
        return
      }
      if (data.already_verified) {
        setEmailVerified(true)
        setVerifyMsg(t('settings.verifyAlready'))
        return
      }
      setVerifyMsg(
        data.emailSent ? t('settings.verifyResent') : t('settings.verifyResendNoSmtp'),
      )
    } catch {
      setVerifyMsg(t('settings.verifyResendFailed'))
    } finally {
      setVerifyBusy(false)
    }
  }

  const accountEmail = session?.user?.email ?? null
  const accountName = session?.user?.name ?? null
  const avatarSrc = session?.user?.image ?? undefined
  const accentOption = resolveAccentOption(accent)

  return (
    <SettingsShell
      className="creation-settings"
      labels={{
        account: t('settings.account'),
        profile: t('settings.profile'),
        appearance: t('settings.appearance'),
        language: t('settings.language'),
      }}
      account={
        status === 'authenticated' && accountEmail ? (
          <>
            <dl className="ds-settings-account-dl creation-settings-account">
              {accountName ? (
                <>
                  <dt>{t('settings.name')}</dt>
                  <dd>{accountName}</dd>
                </>
              ) : null}
              <dt>{t('settings.email')}</dt>
              <dd>
                {accountEmail}
                {!emailVerified ? ` · ${t('settings.emailUnverified')}` : ''}
              </dd>
            </dl>
            {!emailVerified ? (
              <div style={{ marginTop: '0.75rem' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={verifyBusy}
                  onClick={() => void handleResendVerify()}
                >
                  {verifyBusy ? t('common.loading') : t('settings.verifyResend')}
                </Button>
                {verifyMsg ? (
                  <p role="status" style={{ marginTop: '0.35rem', fontSize: '0.875rem' }}>
                    {verifyMsg}
                  </p>
                ) : null}
              </div>
            ) : null}
            <form
              onSubmit={(e) => void handlePasswordSave(e)}
              style={{ marginTop: '1rem', display: 'grid', gap: '0.5rem', maxWidth: '20rem' }}
            >
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
                {hasPassword ? t('settings.passwordChange') : t('settings.passwordSet')}
              </p>
              {hasPassword ? (
                <Field label={t('settings.passwordCurrent')} size="sm">
                  <Input
                    type="password"
                    autoComplete="current-password"
                    value={currentPasswordDraft}
                    onChange={(e) => setCurrentPasswordDraft(e.target.value)}
                    required
                    block
                    aria-label={t('settings.passwordCurrent')}
                  />
                </Field>
              ) : null}
              <Field label={t('settings.passwordNew')} size="sm">
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={passwordDraft}
                  onChange={(e) => setPasswordDraft(e.target.value)}
                  required
                  minLength={10}
                  block
                  aria-label={t('settings.passwordNew')}
                />
              </Field>
              <Button type="submit" variant="ghost" size="sm" disabled={passwordBusy}>
                {passwordBusy ? t('common.loading') : t('settings.passwordSave')}
              </Button>
              {passwordMsg ? (
                <p role="status" style={{ margin: 0, fontSize: '0.875rem' }}>
                  {passwordMsg}
                </p>
              ) : null}
            </form>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              {isAdmin ? (
                <Link href={paths.routes.admin}>
                  <Button variant="ghost" size="sm">
                    {t('nav.admin')}
                  </Button>
                </Link>
              ) : null}
              <Button variant="ghost" size="sm" disabled={loggingOut} onClick={handleLogout}>
                {loggingOut ? t('common.signingOut') : t('common.signOut')}
              </Button>
            </div>
          </>
        ) : null
      }
      profile={
        <div className="ds-settings-profile-row creation-settings-profile-row">
          <Avatar
            name={draft.trim() || displayName}
            src={avatarSrc}
            size="lg"
            accent={accentOption.preview}
            accentContrast={accentOption.textColor}
          />
          <Field label={t('settings.displayName')} size="sm">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commitName()
                }
              }}
              block
              aria-label={t('settings.displayName')}
              maxLength={40}
            />
          </Field>
        </div>
      }
      appearance={
        <div className="ds-settings-appearance-stack">
          <ToggleGroup
            className="theme-toggle"
            aria-label={t('settings.theme')}
            value={theme}
            onChange={(next) => setTheme(next as UiThemeId)}
            options={paths.themeChoices.map((id) => ({
              value: id,
              label: themeLabels[id],
            }))}
          />
          <AccentSwatchGroup
            value={accent}
            onChange={setAccent}
            aria-label={t('settings.appearance')}
          />
        </div>
      }
      language={
        <ToggleGroup
          aria-label={t('settings.language')}
          value={locale}
          onChange={(next) => setLocale(next as UiLocaleId)}
          options={paths.localeChoices.map((id) => ({
            value: id,
            label: localeLabels[id],
          }))}
        />
      }
    />
  )
}
