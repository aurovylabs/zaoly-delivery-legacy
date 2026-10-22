'use client'

/**
 * Project team roster — compact magazine rows with inline draft email row.
 * Spec: `specs/domain/project-team.md`
 */

import { useEffect, useRef, useState } from 'react'
import { Button, EmptyState, Panel, SectionChrome, Text } from '@zaoly/ui'
import { paths } from '../lib/paths'
import { isRealPlatformProjectId } from '../lib/platform-project-id'
import { useT } from '../lib/user-prefs'

type TeamRow = {
  id: string
  email: string
  role: string
  status: string
}

export function ProjectTeamPanel({
  projectId,
  platformProjectId,
}: {
  projectId: string
  platformProjectId?: string | null
}) {
  const t = useT()
  const bound = isRealPlatformProjectId(platformProjectId)
  const [items, setItems] = useState<TeamRow[]>([])
  const [draftOpen, setDraftOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const skipBlurSave = useRef(false)

  async function reload() {
    if (!bound) return
    const res = await fetch(paths.routes.apiProjectMembers(projectId), { cache: 'no-store' })
    const body = (await res.json().catch(() => ({}))) as {
      items?: TeamRow[]
      error?: string
    }
    if (!res.ok) {
      if (body.error === 'suite_out_of_scope') {
        setError(t('projects.teamUnavailableStandalone'))
        setItems([])
        return
      }
      setError(body.error || t('projects.teamLoadFailed', { status: String(res.status) }))
      return
    }
    setItems(body.items ?? [])
    setError(null)
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, platformProjectId])

  useEffect(() => {
    if (!draftOpen) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [draftOpen])

  function beginDraft() {
    if (busy || draftOpen) return
    setDraftOpen(true)
    setDraft('')
    setError(null)
    setStatus(null)
  }

  function cancelDraft() {
    skipBlurSave.current = true
    setDraftOpen(false)
    setDraft('')
  }

  async function commitDraft() {
    const trimmed = draft.trim()
    if (!trimmed) {
      setDraftOpen(false)
      setDraft('')
      return
    }
    if (busy) return
    setBusy(true)
    setError(null)
    setStatus(null)
    try {
      const res = await fetch(paths.routes.apiProjectMembers(projectId), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: trimmed, role: 'member' }),
      })
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        if (body.error === 'user_not_found' || body.error === 'wrong_company') {
          throw new Error(t('projects.teamUserMissing'))
        }
        throw new Error(body.error || t('projects.teamAddFailed', { status: String(res.status) }))
      }
      setDraftOpen(false)
      setDraft('')
      setStatus(t('projects.teamAdded'))
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('projects.teamAddFailedGeneric'))
    } finally {
      setBusy(false)
    }
  }

  async function onInviteLink() {
    const toEmail = draft.trim() || undefined
    skipBlurSave.current = true
    setBusy(true)
    setError(null)
    setInviteUrl(null)
    setStatus(null)
    try {
      const res = await fetch(paths.routes.apiProjectInvites(projectId), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          role: 'member',
          ...(toEmail ? { toEmail } : {}),
        }),
      })
      const body = (await res.json().catch(() => ({}))) as {
        inviteUrl?: string
        emailedTo?: string
        error?: string
      }
      if (!res.ok) {
        throw new Error(
          body.error || t('projects.teamInviteFailed', { status: String(res.status) }),
        )
      }
      const url = body.inviteUrl ?? ''
      setInviteUrl(url)
      if (body.emailedTo) {
        setStatus(t('projects.teamInviteEmailed', { email: body.emailedTo }))
        setDraftOpen(false)
        setDraft('')
      } else if (url && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        setStatus(t('projects.teamInviteCopied'))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('projects.teamInviteFailedGeneric'))
    } finally {
      setBusy(false)
    }
  }

  async function onRemove(userId: string) {
    if (busy || draftOpen) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(paths.routes.apiProjectMember(projectId, userId), {
        method: 'DELETE',
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(
          body.error || t('projects.teamRemoveFailed', { status: String(res.status) }),
        )
      }
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('projects.teamRemoveFailedGeneric'))
    } finally {
      setBusy(false)
    }
  }

  if (!bound) {
    return (
      <Panel className="creation-project-team">
        <SectionChrome quiet title={t('projects.teamTitle')} meta="—" as="h3" />
        <EmptyState>{t('projects.teamNeedsCollection')}</EmptyState>
      </Panel>
    )
  }

  const nextNum = String(items.length + (draftOpen ? 1 : 0) + 1).padStart(2, '0')
  const showList = items.length > 0 || draftOpen

  return (
    <Panel className="creation-project-team">
      <SectionChrome quiet title={t('projects.teamTitle')} meta={`${items.length}`} as="h3" />

      {showList ? (
        <ol className="creation-magazine-list creation-project-team__items">
          {items.map((member, index) => (
            <li key={member.id} className="creation-project-team__row">
              <span className="creation-magazine-list-num" aria-hidden>
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="creation-project-team__main">
                <span className="creation-project-team__email">{member.email}</span>
                <span className="creation-project-team__meta">
                  {member.role} · {member.status}
                </span>
              </div>
              {member.status !== 'owner' ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="creation-project-team__delete"
                  aria-label={t('projects.teamRemove')}
                  disabled={busy}
                  onClick={() => void onRemove(member.id)}
                >
                  ×
                </Button>
              ) : (
                <span aria-hidden />
              )}
            </li>
          ))}
          {draftOpen ? (
            <li className="creation-project-team__row">
              <span className="creation-magazine-list-num" aria-hidden>
                {String(items.length + 1).padStart(2, '0')}
              </span>
              <div className="creation-project-team__main">
                <input
                  ref={inputRef}
                  className="creation-project-team__input"
                  type="email"
                  value={draft}
                  disabled={busy}
                  placeholder={t('projects.teamAddPlaceholder')}
                  aria-label={t('projects.teamAdd')}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => {
                    if (skipBlurSave.current) {
                      skipBlurSave.current = false
                      return
                    }
                    void commitDraft()
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void commitDraft()
                    } else if (e.key === 'Escape') {
                      e.preventDefault()
                      cancelDraft()
                    }
                  }}
                />
              </div>
              <span aria-hidden />
            </li>
          ) : null}
        </ol>
      ) : (
        <EmptyState>{t('projects.teamEmpty')}</EmptyState>
      )}

      <div className="creation-project-team__foot">
        <button
          type="button"
          className="creation-project-team__add"
          aria-label={t('projects.teamAdd')}
          disabled={busy || draftOpen}
          onClick={beginDraft}
        >
          <span className="creation-magazine-list-num" aria-hidden>
            {nextNum}
          </span>
          <span className="creation-project-team__add-label">{t('projects.teamAdd')}</span>
        </button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="creation-project-team__invite"
          disabled={busy}
          onClick={() => void onInviteLink()}
        >
          {t('projects.teamInviteLink')}
        </Button>
      </div>

      {error ? (
        <Text role="meta" as="p">
          {error}
        </Text>
      ) : null}
      {status ? (
        <p className="creation-project-team__hint" role="status">
          {status}
        </p>
      ) : null}
      {inviteUrl ? (
        <Text role="meta" as="p">
          <a href={inviteUrl}>{inviteUrl}</a>
        </Text>
      ) : null}
    </Panel>
  )
}
