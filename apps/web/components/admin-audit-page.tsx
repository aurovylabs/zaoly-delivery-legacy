'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Button, EmptyState, SettingsBand } from '../lib/zaoly-ui'
import { paths } from '../lib/paths'
import { useUserPrefs } from '../lib/user-prefs'

type AuditEvent = {
  id: string
  at: string
  actorUserId: string
  actorEmail: string | null
  action: string
  targetUserId: string | null
  meta: Record<string, unknown> | null
}

function formatWhen(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function AdminAuditPage() {
  const { t, locale } = useUserPrefs()
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(
    async (opts?: { cursor?: string | null; append?: boolean }) => {
      setError(null)
      setBusy(true)
      try {
        const params = new URLSearchParams()
        params.set('limit', String(paths.adminAuditPageSizeDefault))
        if (opts?.cursor) params.set('cursor', opts.cursor)
        const res = await fetch(`${paths.routes.apiAdminAudit}?${params.toString()}`)
        if (!res.ok) {
          setError(res.status === 403 ? t('users.adminOnly') : t('admin.auditFailed'))
          return
        }
        const data = (await res.json()) as {
          events: AuditEvent[]
          nextCursor?: string | null
        }
        setEvents((prev) => (opts?.append ? [...prev, ...data.events] : data.events))
        setNextCursor(data.nextCursor ?? null)
      } finally {
        setBusy(false)
      }
    },
    [t],
  )

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="zaoly-admin-hub" data-testid="zaoly-admin-audit">
      {error ? (
        <p className="zaoly-users-hub__error" role="alert">
          {error}
        </p>
      ) : null}
      <SettingsBand title={t('admin.auditTitle')} help={t('admin.auditHelp')}>
        {events.length === 0 && !error ? (
          <EmptyState>{t('admin.auditEmpty')}</EmptyState>
        ) : (
          <ul className="zaoly-users-hub__list">
            {events.map((ev) => (
              <li key={ev.id} className="zaoly-users-hub__row">
                <div className="zaoly-users-hub__identity">
                  <strong>{ev.action}</strong>
                  <span className="zaoly-users-hub__meta">
                    {formatWhen(ev.at, locale)}
                    {ev.actorEmail ? ` · ${ev.actorEmail}` : ''}
                    {ev.targetUserId ? ` · target ${ev.targetUserId.slice(0, 8)}…` : ''}
                  </span>
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
