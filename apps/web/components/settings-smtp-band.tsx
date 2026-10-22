'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Button, Field, Input, SettingsBand, ToggleGroup } from '../lib/zaoly-ui'
import { paths } from '../lib/paths'
import { useUserPrefs } from '../lib/user-prefs'

type SmtpStatus = {
  configured: boolean
  source: 'db' | 'env' | 'none'
  managed: boolean
  host: string | null
  port: number
  user: string | null
  from: string | null
  fromName: string | null
  tls: 'starttls' | 'tls' | 'none'
  passwordSet: boolean
  dbEnabled: boolean
}

export function SettingsSmtpBand() {
  const { t } = useUserPrefs()
  const [status, setStatus] = useState<SmtpStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [host, setHost] = useState('')
  const [port, setPort] = useState(String(paths.smtpDefaultPort))
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [from, setFrom] = useState('')
  const [fromName, setFromName] = useState<string>(paths.smtpDefaultFromName)
  const [tls, setTls] = useState<'starttls' | 'tls' | 'none'>(paths.smtpDefaultTls)

  const load = useCallback(async () => {
    setError(null)
    const res = await fetch(paths.routes.apiAdminSmtp)
    if (!res.ok) {
      setError(res.status === 403 ? t('users.adminOnly') : t('smtp.loadFailed'))
      return
    }
    const data = (await res.json()) as SmtpStatus
    setStatus(data)
    setEnabled(data.dbEnabled)
    setHost(data.host ?? '')
    setPort(String(data.port || paths.smtpDefaultPort))
    setUser(data.user ?? '')
    setFrom(data.from ?? '')
    setFromName(data.fromName ?? paths.smtpDefaultFromName)
    setTls(data.tls)
    setPass('')
  }, [t])

  useEffect(() => {
    void load()
  }, [load])

  async function save() {
    setBusy(true)
    setError(null)
    setOkMsg(null)
    try {
      const res = await fetch(paths.routes.apiAdminSmtp, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          enabled,
          host,
          port: Number.parseInt(port, 10) || paths.smtpDefaultPort,
          user,
          from,
          fromName,
          tls,
          ...(pass.trim() ? { pass: pass.trim() } : {}),
        }),
      })
      const data = (await res.json()) as SmtpStatus & { error?: string; ok?: boolean }
      if (!res.ok) throw new Error(data.error || t('smtp.saveFailed'))
      setStatus(data)
      setEnabled(data.dbEnabled)
      setPass('')
      setOkMsg(t('smtp.saved'))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('smtp.saveFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function testSend() {
    setBusy(true)
    setError(null)
    setOkMsg(null)
    try {
      const res = await fetch(paths.routes.apiAdminSmtpTest, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) throw new Error(data.error || t('smtp.testFailed'))
      setOkMsg(t('smtp.testOk'))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('smtp.testFailed'))
    } finally {
      setBusy(false)
    }
  }

  const managed = Boolean(status?.managed)
  const sourceLabel = managed
    ? t('smtp.sourceManaged')
    : status?.source === 'db'
      ? t('smtp.sourceDb')
      : status?.source === 'env'
        ? t('smtp.sourceEnv')
        : t('smtp.sourceNone')

  return (
    <SettingsBand
      title={t('smtp.title')}
      help={managed ? t('smtp.helpManaged') : t('smtp.help')}
    >
      <div className="zaoly-users-hub__smtp" data-testid="zaoly-smtp-settings" data-managed={managed ? '1' : '0'}>
        {status ? (
          <p className="zaoly-users-hub__meta" data-testid="zaoly-smtp-status">
            {status.configured ? t('smtp.configured') : t('smtp.notConfigured')} · {sourceLabel}
            {status.from ? ` · ${status.from}` : ''}
            {status.passwordSet ? ` · ${t('smtp.passwordSet')}` : ''}
          </p>
        ) : null}
        {error ? (
          <p className="zaoly-users-hub__error" role="alert">
            {error}
          </p>
        ) : null}
        {okMsg ? (
          <p className="zaoly-users-hub__ok" role="status">
            {okMsg}
          </p>
        ) : null}

        {managed ? (
          <div className="zaoly-users-hub__smtp-actions">
            <Button
              type="button"
              variant="primary"
              disabled={busy || !(status?.configured)}
              onClick={() => void testSend()}
              data-testid="zaoly-smtp-test"
            >
              {t('smtp.test')}
            </Button>
          </div>
        ) : (
          <>
            <ToggleGroup
              aria-label={t('smtp.enabled')}
              value={enabled ? 'on' : 'off'}
              onChange={(v) => setEnabled(v === 'on')}
              options={[
                { value: 'off', label: t('smtp.off') },
                { value: 'on', label: t('smtp.on') },
              ]}
            />
            <div className="zaoly-users-hub__smtp-grid">
              <Field label={t('smtp.host')} size="sm">
                <Input value={host} onChange={(e) => setHost(e.target.value)} block aria-label={t('smtp.host')} />
              </Field>
              <Field label={t('smtp.port')} size="sm">
                <Input value={port} onChange={(e) => setPort(e.target.value)} block aria-label={t('smtp.port')} />
              </Field>
              <Field label={t('smtp.user')} size="sm">
                <Input value={user} onChange={(e) => setUser(e.target.value)} block aria-label={t('smtp.user')} />
              </Field>
              <Field label={t('smtp.pass')} size="sm">
                <Input
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  block
                  autoComplete="new-password"
                  placeholder={status?.passwordSet ? t('smtp.passKeep') : undefined}
                  aria-label={t('smtp.pass')}
                />
              </Field>
              <Field label={t('smtp.from')} size="sm">
                <Input value={from} onChange={(e) => setFrom(e.target.value)} block aria-label={t('smtp.from')} />
              </Field>
              <Field label={t('smtp.fromName')} size="sm">
                <Input
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  block
                  aria-label={t('smtp.fromName')}
                />
              </Field>
            </div>
            <ToggleGroup
              aria-label={t('smtp.tls')}
              value={tls}
              onChange={(v) => setTls(v === 'tls' || v === 'none' ? v : 'starttls')}
              options={[
                { value: 'starttls', label: 'STARTTLS' },
                { value: 'tls', label: 'TLS' },
                { value: 'none', label: t('smtp.tlsNone') },
              ]}
            />
            <div className="zaoly-users-hub__smtp-actions">
              <Button type="button" variant="primary" disabled={busy} onClick={() => void save()}>
                {t('smtp.save')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={busy || !(status?.configured)}
                onClick={() => void testSend()}
                data-testid="zaoly-smtp-test"
              >
                {t('smtp.test')}
              </Button>
            </div>
          </>
        )}
      </div>
    </SettingsBand>
  )
}
