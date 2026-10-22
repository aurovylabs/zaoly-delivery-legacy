'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  Button,
  Chip,
  EmptyState,
  Field,
  Input,
  SettingsBand,
  ToggleGroup,
} from '../lib/zaoly-ui'
import { paths } from '../lib/paths'
import { useUserPrefs } from '../lib/user-prefs'

type AppRole = 'admin' | 'member' | 'platform_admin'

type UserRow = {
  id: string
  email: string
  name: string | null
  role: AppRole
  disabled: boolean
  createdAt: string
  lastLoginAt: string | null
  hasPassword?: boolean
  hasGoogle?: boolean
  ownedSceneCount?: number
}

function roleLabel(t: (key: string) => string, role: AppRole): string {
  if (role === 'platform_admin') return t('users.rolePlatform')
  if (role === 'admin') return t('users.roleAdmin')
  return t('users.roleMember')
}

function nextRole(role: AppRole): AppRole {
  if (role === 'member') return 'admin'
  if (role === 'admin') return 'platform_admin'
  return 'member'
}

function formatWhen(iso: string | null, locale: string, never: string): string {
  if (!iso) return never
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function SettingsUsersPage() {
  const { t, locale } = useUserPrefs()
  const [users, setUsers] = useState<UserRow[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member'>('member')
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false)
  const [impersonationEnabled, setImpersonationEnabled] = useState(false)

  useEffect(() => {
    void fetch(paths.routes.apiMe)
      .then(async (res) => {
        if (!res.ok) return
        const data = (await res.json()) as { role?: string; realRole?: string }
        const r = data.realRole ?? data.role
        setIsPlatformAdmin(r === 'platform_admin')
      })
      .catch(() => {
        /* ignore */
      })
    void fetch(paths.routes.apiAdminOverview)
      .then(async (res) => {
        if (!res.ok) return
        const data = (await res.json()) as { impersonationEnabled?: boolean }
        setImpersonationEnabled(Boolean(data.impersonationEnabled))
      })
      .catch(() => {
        /* ignore */
      })
  }, [])

  const load = useCallback(
    async (opts?: { cursor?: string | null; append?: boolean; q?: string }) => {
      setError(null)
      const params = new URLSearchParams()
      const q = (opts?.q ?? appliedQuery).trim()
      if (q) params.set('q', q)
      params.set('limit', String(paths.adminUsersPageSizeDefault))
      if (opts?.cursor) params.set('cursor', opts.cursor)
      const res = await fetch(`${paths.routes.apiAdminUsers}?${params.toString()}`)
      if (!res.ok) {
        setError(res.status === 403 ? t('users.adminOnly') : t('users.loadFailed'))
        return
      }
      const data = (await res.json()) as {
        users: UserRow[]
        nextCursor?: string | null
      }
      setUsers((prev) => (opts?.append ? [...prev, ...data.users] : data.users))
      setNextCursor(data.nextCursor ?? null)
    },
    [appliedQuery, t],
  )

  useEffect(() => {
    void load()
  }, [load])

  async function invite() {
    setBusy(true)
    setInviteUrl(null)
    setEmailSent(null)
    setError(null)
    try {
      const res = await fetch(paths.routes.apiAdminUsersInvite, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, role }),
      })
      const data = (await res.json()) as {
        error?: string
        inviteUrl?: string
        emailSent?: boolean
        emailError?: string
      }
      if (!res.ok) throw new Error(data.error || t('users.inviteFailed'))
      setInviteUrl(data.inviteUrl || null)
      setEmailSent(Boolean(data.emailSent))
      if (data.emailError) setError(data.emailError)
      setEmail('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('users.inviteFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function patchUser(id: string, body: { disabled?: boolean; role?: AppRole }) {
    setBusy(true)
    setError(null)
    setOkMsg(null)
    try {
      const res = await fetch(paths.routes.apiAdminUser(id), {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error || t('users.patchFailed'))
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('users.patchFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function forcePasswordReset(id: string) {
    setBusy(true)
    setError(null)
    setOkMsg(null)
    try {
      const res = await fetch(paths.routes.apiAdminUserForcePasswordReset(id), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ locale }),
      })
      const data = (await res.json()) as {
        error?: string
        emailSent?: boolean
        emailError?: string
      }
      if (!res.ok) throw new Error(data.error || t('users.resetFailed'))
      if (data.emailError) setError(data.emailError)
      setOkMsg(data.emailSent ? t('users.resetSent') : t('users.resetTokenReady'))
    } catch (e) {
      setError(e instanceof Error ? e.message : t('users.resetFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function anonymize(id: string) {
    if (!window.confirm(t('users.anonymizeConfirm'))) return
    setBusy(true)
    setError(null)
    setOkMsg(null)
    try {
      const res = await fetch(paths.routes.apiAdminUserAnonymize(id), { method: 'POST' })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error || t('users.anonymizeFailed'))
      setOkMsg(t('users.anonymizeOk'))
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : t('users.anonymizeFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function impersonate(id: string) {
    const reason = window.prompt(t('users.impersonateReasonPrompt'), '')?.trim() ?? ''
    if (reason.length < paths.impersonationReasonMinLength) {
      setError(t('users.impersonateReasonRequired'))
      return
    }
    setBusy(true)
    setError(null)
    setOkMsg(null)
    try {
      const res = await fetch(paths.routes.apiAdminImpersonate, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId: id, reason }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error || t('users.impersonateFailed'))
      window.location.assign(paths.routes.editor)
    } catch (e) {
      setError(e instanceof Error ? e.message : t('users.impersonateFailed'))
      setBusy(false)
    }
  }

  function applySearch(e: React.FormEvent) {
    e.preventDefault()
    setAppliedQuery(query.trim())
  }

  return (
    <div className="zaoly-users-hub" data-testid="zaoly-users-hub">
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
      <SettingsBand title={t('users.inviteTitle')} help={t('users.inviteHelp')}>
        <form
          className="zaoly-users-hub__invite"
          onSubmit={(e) => {
            e.preventDefault()
            void invite()
          }}
        >
          <Field label={t('users.email')} size="sm">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              block
              aria-label={t('users.email')}
            />
          </Field>
          <ToggleGroup
            aria-label={t('users.role')}
            value={role}
            onChange={(v) => setRole(v === 'admin' ? 'admin' : 'member')}
            options={[
              { value: 'member', label: t('users.roleMember') },
              { value: 'admin', label: t('users.roleAdmin') },
            ]}
          />
          <Button type="submit" variant="primary" disabled={busy || !email.trim()}>
            {t('users.invite')}
          </Button>
        </form>
        {inviteUrl ? (
          <div className="zaoly-users-hub__invite-url">
            <Field label={t('users.inviteUrlLabel')} size="sm">
              <Input value={inviteUrl} readOnly block onFocus={(e) => e.currentTarget.select()} />
            </Field>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void navigator.clipboard.writeText(inviteUrl)}
            >
              {t('users.copy')}
            </Button>
            {emailSent === true ? (
              <p className="zaoly-users-hub__ok" role="status">
                {t('users.emailSent')}
              </p>
            ) : emailSent === false ? (
              <p className="zaoly-users-hub__meta">{t('users.emailNotSent')}</p>
            ) : null}
          </div>
        ) : null}
      </SettingsBand>
      <SettingsBand title={t('users.directory')} help={String(users.length)}>
        <form className="zaoly-users-hub__invite" onSubmit={applySearch}>
          <Field label={t('users.search')} size="sm">
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              block
              placeholder={t('users.searchPlaceholder')}
              aria-label={t('users.search')}
            />
          </Field>
          <Button type="submit" variant="ghost" size="sm">
            {t('users.searchApply')}
          </Button>
        </form>
        {users.length === 0 ? (
          <EmptyState>{t('users.empty')}</EmptyState>
        ) : (
          <ul className="zaoly-users-hub__list">
            {users.map((u) => (
              <li key={u.id} className="zaoly-users-hub__row">
                <div className="zaoly-users-hub__identity">
                  <strong>{u.name || u.email}</strong>
                  <span className="zaoly-users-hub__meta">
                    {u.email}
                    {u.disabled ? ` · ${t('users.disabled')}` : ''}
                    {u.hasPassword ? ` · ${t('users.authPassword')}` : ''}
                    {u.hasGoogle ? ` · ${t('users.authGoogle')}` : ''}
                    {` · ${t('users.lastLogin')}: ${formatWhen(u.lastLoginAt, locale, t('users.neverLogin'))}`}
                    {` · ${t('users.scenes')}: ${u.ownedSceneCount ?? 0}`}
                  </span>
                </div>
                <Chip
                  static
                  size="sm"
                  selected={u.role === 'admin' || u.role === 'platform_admin'}
                >
                  {roleLabel(t, u.role)}
                </Chip>
                <div className="zaoly-users-hub__actions">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => void patchUser(u.id, { role: nextRole(u.role) })}
                  >
                    {t('users.cycleRole')} ({roleLabel(t, nextRole(u.role))})
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => void patchUser(u.id, { disabled: !u.disabled })}
                  >
                    {u.disabled ? t('users.enable') : t('users.disable')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy || u.disabled}
                    onClick={() => void forcePasswordReset(u.id)}
                  >
                    {t('users.forceReset')}
                  </Button>
                  {isPlatformAdmin ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy || u.disabled}
                      onClick={() => void anonymize(u.id)}
                    >
                      {t('users.anonymize')}
                    </Button>
                  ) : null}
                  {isPlatformAdmin && impersonationEnabled ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy || u.disabled}
                      onClick={() => void impersonate(u.id)}
                    >
                      {t('users.impersonate')}
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
        {nextCursor ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => void load({ cursor: nextCursor, append: true })}
          >
            {t('users.loadMore')}
          </Button>
        ) : null}
      </SettingsBand>
    </div>
  )
}

/** Canonical name for platform admin directory · `zaoly-platform-admin.md` */
export const AdminUsersPage = SettingsUsersPage
