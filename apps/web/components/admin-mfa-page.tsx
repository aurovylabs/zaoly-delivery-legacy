'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { startRegistration } from '@simplewebauthn/browser'
import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/browser'
import { Button, EmptyState, Field, Input, SettingsBand } from '../lib/zaoly-ui'
import { paths } from '../lib/paths'
import { useUserPrefs } from '../lib/user-prefs'

type Status = { enabled: boolean; required: boolean }
type PasskeyItem = {
  id: string
  credentialId: string
  deviceType: string | null
  backedUp: boolean
  createdAt: string
}

export function AdminMfaPage() {
  const { t } = useUserPrefs()
  const [status, setStatus] = useState<Status | null>(null)
  const [passkeys, setPasskeys] = useState<PasskeyItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [secret, setSecret] = useState<string | null>(null)
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)

  const loadPasskeys = useCallback(async () => {
    const res = await fetch(paths.routes.apiAdminWebAuthnCredentials)
    if (!res.ok) return
    const data = (await res.json()) as { items?: PasskeyItem[] }
    setPasskeys(data.items ?? [])
  }, [])

  const load = useCallback(async () => {
    setError(null)
    const res = await fetch(paths.routes.apiAdminMfa)
    if (!res.ok) {
      setError(res.status === 403 ? t('users.adminOnly') : t('admin.mfaLoadFailed'))
      return
    }
    setStatus((await res.json()) as Status)
    await loadPasskeys()
  }, [t, loadPasskeys])

  useEffect(() => {
    void load()
  }, [load])

  async function addPasskey() {
    setBusy(true)
    setError(null)
    try {
      const optRes = await fetch(paths.routes.apiAdminWebAuthnRegisterOptions, {
        method: 'POST',
      })
      if (!optRes.ok) throw new Error(t('admin.passkeyRegisterFailed'))
      const options = (await optRes.json()) as PublicKeyCredentialCreationOptionsJSON
      const attestation = await startRegistration({ optionsJSON: options })
      const verifyRes = await fetch(paths.routes.apiAdminWebAuthnRegisterVerify, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(attestation),
      })
      if (!verifyRes.ok) throw new Error(t('admin.passkeyRegisterFailed'))
      await loadPasskeys()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.passkeyRegisterFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function removePasskey(id: string) {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(paths.routes.apiAdminWebAuthnCredential(id), {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error(t('admin.passkeyDeleteFailed'))
      await loadPasskeys()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.passkeyDeleteFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function startSetup() {
    setBusy(true)
    setError(null)
    setRecoveryCodes(null)
    try {
      const res = await fetch(paths.routes.apiAdminMfaSetup, { method: 'POST' })
      const data = (await res.json()) as {
        error?: string
        secret?: string
        otpauthUrl?: string
      }
      if (!res.ok) throw new Error(data.error || t('admin.mfaSetupFailed'))
      setSecret(data.secret ?? null)
      setOtpauthUrl(data.otpauthUrl ?? null)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.mfaSetupFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(paths.routes.apiAdminMfaConfirm, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = (await res.json()) as {
        error?: string
        recoveryCodes?: string[]
      }
      if (!res.ok) throw new Error(data.error || t('admin.mfaConfirmFailed'))
      setRecoveryCodes(data.recoveryCodes ?? [])
      setSecret(null)
      setOtpauthUrl(null)
      setCode('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.mfaConfirmFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function disable() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(paths.routes.apiAdminMfaDisable, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error || t('admin.mfaDisableFailed'))
      setCode('')
      setRecoveryCodes(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('admin.mfaDisableFailed'))
    } finally {
      setBusy(false)
    }
  }

  if (error && !status) {
    return (
      <p className="zaoly-users-hub__error" role="alert">
        {error}
      </p>
    )
  }

  if (!status) {
    return <EmptyState>{t('common.loading')}</EmptyState>
  }

  return (
    <div className="zaoly-admin-hub" data-testid="zaoly-admin-mfa">
      <SettingsBand title={t('admin.mfaTitle')} help={t('admin.mfaHelp')}>
        {error ? (
          <p className="zaoly-users-hub__error" role="alert">
            {error}
          </p>
        ) : null}
        <p>
          {status.enabled ? t('admin.mfaEnabled') : t('admin.mfaDisabled')}
          {status.required ? ` · ${t('admin.mfaRequiredFlag')}` : ''}
        </p>
        {!status.enabled && !secret ? (
          <Button variant="primary" size="sm" disabled={busy} onClick={() => void startSetup()}>
            {t('admin.mfaStart')}
          </Button>
        ) : null}
        {secret && otpauthUrl ? (
          <div className="zaoly-admin-mfa__setup" data-testid="zaoly-admin-mfa-setup">
            <p>{t('admin.mfaScanHint')}</p>
            <code className="zaoly-admin-mfa__secret">{secret}</code>
            <p className="zaoly-admin-mfa__uri">{otpauthUrl}</p>
            <Field label={t('admin.mfaCode')} size="md">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="one-time-code"
                inputMode="numeric"
                block
              />
            </Field>
            <Button variant="primary" size="sm" disabled={busy || code.length < 6} onClick={() => void confirm()}>
              {t('admin.mfaConfirm')}
            </Button>
          </div>
        ) : null}
        {recoveryCodes ? (
          <div data-testid="zaoly-admin-mfa-recovery">
            <p>{t('admin.mfaRecoveryHint')}</p>
            <ul>
              {recoveryCodes.map((c) => (
                <li key={c}>
                  <code>{c}</code>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {status.enabled ? (
          <div className="zaoly-admin-mfa__disable">
            <Field label={t('admin.mfaCodeOrRecovery')} size="md">
              <Input value={code} onChange={(e) => setCode(e.target.value)} block />
            </Field>
            <Button variant="ghost" size="sm" disabled={busy || !code} onClick={() => void disable()}>
              {t('admin.mfaDisable')}
            </Button>
          </div>
        ) : null}
      </SettingsBand>

      <SettingsBand title={t('admin.passkeyTitle')} help={t('admin.passkeyHelp')}>
        <Button variant="primary" size="sm" disabled={busy} onClick={() => void addPasskey()}>
          {t('admin.passkeyAdd')}
        </Button>
        {passkeys.length === 0 ? (
          <p>{t('admin.passkeyEmpty')}</p>
        ) : (
          <ul className="zaoly-admin-mfa__passkeys" data-testid="zaoly-admin-passkeys">
            {passkeys.map((p) => (
              <li key={p.id}>
                <code>{p.credentialId.slice(0, 16)}…</code>
                <span>{p.deviceType ?? '—'}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => void removePasskey(p.id)}
                >
                  {t('admin.passkeyRemove')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SettingsBand>
    </div>
  )
}
