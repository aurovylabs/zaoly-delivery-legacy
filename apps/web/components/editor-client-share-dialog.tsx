'use client'

/**
 * Editor dialog: invite collaborator vs share pages with client.
 * Spec: specs/domain/client-page-share.md
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { paths } from '../lib/paths'

export type ClientSharePageOption = { id: string; name: string }

type ListedShare = {
  id: string
  pageIds: string[]
  accessMode: string
  expiresAt: string | null
  label: string | null
  revoked: boolean
  approved?: boolean
  status?: string
  createdAt: string
  shareUrl?: string | null
}

type Props = {
  open: boolean
  onClose: () => void
  sceneId: string
  pages: ClientSharePageOption[]
  collectionBound: boolean
  t: (key: string, vars?: Record<string, string | number>) => string
  onInviteCollaborator: () => void | Promise<void>
  inviteBusy: boolean
  onStatus: (message: string) => void
  onError: (message: string) => void
}

export function EditorClientShareDialog({
  open,
  onClose,
  sceneId,
  pages,
  collectionBound,
  t,
  onInviteCollaborator,
  inviteBusy,
  onStatus,
  onError,
}: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const [accessMode, setAccessMode] = useState<'link' | 'password' | 'email_allowlist'>(
    'password',
  )
  const [contentMode, setContentMode] = useState<'pinned_revision' | 'live_head'>(
    'pinned_revision',
  )
  const [password, setPassword] = useState('')
  const [emailsText, setEmailsText] = useState('')
  const [commentsEnabled, setCommentsEnabled] = useState(true)
  const [expiresInDays, setExpiresInDays] = useState(14)
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState(false)
  const [shares, setShares] = useState<ListedShare[]>([])
  const [tab, setTab] = useState<'client' | 'invite'>('client')
  const [localError, setLocalError] = useState<string | null>(null)
  const [createdUrl, setCreatedUrl] = useState<string | null>(null)
  const [copiedOk, setCopiedOk] = useState(false)

  const allSelected = selected.length > 0 && selected.length === pages.length

  useEffect(() => {
    if (!open) return
    setSelected(pages.map((p) => p.id))
    setPassword('')
    setEmailsText('')
    setCommentsEnabled(true)
    setLabel('')
    setContentMode('pinned_revision')
    setTab('client')
    setLocalError(null)
    setCreatedUrl(null)
    setCopiedOk(false)
  }, [open, pages])

  const mapCreateError = (code: string | undefined): string => {
    switch (code) {
      case 'password_required':
      case 'password_required_by_policy':
        return t('editor.clientShareNeedPassword')
      case 'email_allowlist_required':
      case 'email_allowlist_disabled':
        return t('editor.clientShareNeedEmails')
      case 'collection_required':
        return t('editor.shareInviteNeedCollection')
      case 'client_share_disabled':
        return t('editor.clientShareDisabled')
      case 'live_head_disabled':
        return t('editor.clientShareLiveDisabled')
      case 'ttl_invalid':
        return t('editor.clientShareTtlInvalid')
      case 'empty_page_ids':
      case 'unknown_page_id':
        return t('editor.clientShareNeedPages')
      default:
        return code ? `${t('editor.clientShareError')}: ${code}` : t('editor.clientShareError')
    }
  }

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedOk(true)
      onStatus(t('editor.clientShareOk'))
      return true
    } catch {
      setCopiedOk(false)
      return false
    }
  }

  const loadShares = useCallback(async () => {
    if (!collectionBound) return
    try {
      const res = await fetch(paths.routes.apiSceneClientShares(sceneId), {
        credentials: 'same-origin',
        cache: 'no-store',
      })
      const data = (await res.json().catch(() => ({}))) as {
        shares?: ListedShare[]
      }
      if (res.ok && Array.isArray(data.shares)) setShares(data.shares)
    } catch {
      // ignore list errors in dialog
    }
  }, [collectionBound, sceneId])

  useEffect(() => {
    if (open) void loadShares()
  }, [open, loadShares])

  const togglePage = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const createShare = async () => {
    setLocalError(null)
    setCreatedUrl(null)
    setCopiedOk(false)
    if (!collectionBound) {
      const msg = t('editor.shareInviteNeedCollection')
      setLocalError(msg)
      onError(msg)
      return
    }
    if (selected.length === 0) {
      const msg = t('editor.clientShareNeedPages')
      setLocalError(msg)
      onError(msg)
      return
    }
    if (accessMode === 'password' && !password.trim()) {
      const msg = t('editor.clientShareNeedPassword')
      setLocalError(msg)
      onError(msg)
      return
    }
    if (accessMode === 'email_allowlist' && !emailsText.trim()) {
      const msg = t('editor.clientShareNeedEmails')
      setLocalError(msg)
      onError(msg)
      return
    }
    setBusy(true)
    try {
      const emails = emailsText
        .split(/[\s,;]+/)
        .map((e) => e.trim())
        .filter(Boolean)
      const res = await fetch(paths.routes.apiSceneClientShares(sceneId), {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageIds: selected,
          accessMode,
          password: accessMode === 'password' ? password : undefined,
          emails: accessMode === 'email_allowlist' ? emails : undefined,
          expiresInDays,
          label: label.trim() || undefined,
          contentMode,
          commentsEnabled: true,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        shareUrl?: string
        error?: string
      }
      if (!res.ok || !data.shareUrl) {
        const msg = mapCreateError(data.error)
        setLocalError(msg)
        onError(msg)
        return
      }
      setCreatedUrl(data.shareUrl)
      const copied = await copyUrl(data.shareUrl)
      if (!copied) {
        onStatus(data.shareUrl)
      }
      setPassword('')
      setEmailsText('')
      await loadShares()
    } catch {
      const msg = t('editor.clientShareError')
      setLocalError(msg)
      onError(msg)
    } finally {
      setBusy(false)
    }
  }

  const revoke = async (shareId: string) => {
    setBusy(true)
    setLocalError(null)
    try {
      const res = await fetch(paths.routes.apiSceneClientShare(sceneId, shareId), {
        method: 'DELETE',
        credentials: 'same-origin',
      })
      if (!res.ok) {
        const msg = t('editor.clientShareRevokeError')
        setLocalError(msg)
        onError(msg)
        return
      }
      onStatus(t('editor.clientShareRevoked'))
      await loadShares()
    } catch {
      const msg = t('editor.clientShareRevokeError')
      setLocalError(msg)
      onError(msg)
    } finally {
      setBusy(false)
    }
  }

  const approve = async (shareId: string) => {
    setBusy(true)
    setLocalError(null)
    try {
      const res = await fetch(paths.routes.apiSceneClientShare(sceneId, shareId), {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve: true }),
      })
      if (!res.ok) {
        const msg = t('editor.clientShareApproveError')
        setLocalError(msg)
        onError(msg)
        return
      }
      onStatus(t('editor.clientShareApproved'))
      await loadShares()
    } catch {
      const msg = t('editor.clientShareApproveError')
      setLocalError(msg)
      onError(msg)
    } finally {
      setBusy(false)
    }
  }

  const activeShares = useMemo(
    () => shares.filter((s) => !s.revoked),
    [shares],
  )

  if (!open) return null

  return (
    <div
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      data-testid="editor-client-share-dialog"
    >
      <div style={dialogStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{t('editor.shareMenuTitle')}</h3>
          <button type="button" onClick={onClose} style={ghostBtn} aria-label="Close">
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button
            type="button"
            data-testid="client-share-tab-client"
            onClick={() => setTab('client')}
            style={{ ...tabBtn, ...(tab === 'client' ? tabActive : {}) }}
          >
            {t('editor.clientShareTab')}
          </button>
          <button
            type="button"
            data-testid="client-share-tab-invite"
            onClick={() => setTab('invite')}
            style={{ ...tabBtn, ...(tab === 'invite' ? tabActive : {}) }}
          >
            {t('editor.shareInvite')}
          </button>
        </div>

        {tab === 'invite' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#a1a1aa' }}>
              {t('editor.shareInviteHint')}
            </p>
            <button
              type="button"
              disabled={inviteBusy || !collectionBound}
              data-testid="editor-share-invite-from-dialog"
              onClick={() => void onInviteCollaborator()}
              style={primaryBtn}
            >
              {inviteBusy ? t('editor.shareInviteBusy') : t('editor.shareInvite')}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#a1a1aa' }}>
              {t('editor.clientShareHint')}
            </p>

            <div data-testid="client-share-active-list">
              <span style={labelStyle}>{t('editor.clientShareActive')}</span>
              {activeShares.length === 0 ? (
                <p
                  data-testid="client-share-active-empty"
                  style={{ margin: '8px 0 0', fontSize: 12, color: '#71717a' }}
                >
                  {t('editor.clientShareNone')}
                </p>
              ) : (
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '8px 0 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {activeShares.map((s) => (
                    <li
                      key={s.id}
                      data-testid={`client-share-row-${s.id}`}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        fontSize: 12,
                        padding: 10,
                        border: '1px solid #27272a',
                        borderRadius: 8,
                        background: '#09090b',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span>
                          {s.label || s.id.slice(0, 8)} · {s.pageIds.length}p · {s.accessMode}
                          {s.approved ? ` · ${t('editor.clientShareStatusApproved')}` : ''}
                        </span>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          {!s.approved ? (
                            <button
                              type="button"
                              data-testid={`client-share-approve-${s.id}`}
                              disabled={busy}
                              onClick={() => void approve(s.id)}
                              style={{ ...ghostBtn, color: '#86efac' }}
                            >
                              {t('editor.clientShareApprove')}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            data-testid={`client-share-revoke-${s.id}`}
                            disabled={busy}
                            onClick={() => void revoke(s.id)}
                            style={{ ...ghostBtn, color: '#f87171' }}
                          >
                            {t('editor.clientShareRevoke')}
                          </button>
                        </div>
                      </div>
                      {s.shareUrl ? (
                        <>
                          <input
                            readOnly
                            value={s.shareUrl}
                            data-testid={`client-share-url-${s.id}`}
                            style={inputStyle}
                            onFocus={(e) => e.currentTarget.select()}
                          />
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              data-testid={`client-share-copy-${s.id}`}
                              onClick={() => void copyUrl(s.shareUrl!)}
                              style={{ ...primaryBtn, flex: 1 }}
                            >
                              {t('editor.clientShareCopy')}
                            </button>
                            <a
                              href={s.shareUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              data-testid={`client-share-open-${s.id}`}
                              style={{
                                ...primaryBtn,
                                flex: 1,
                                textAlign: 'center',
                                textDecoration: 'none',
                                boxSizing: 'border-box',
                              }}
                            >
                              {t('editor.clientShareOpen')}
                            </a>
                          </div>
                        </>
                      ) : (
                        <p
                          data-testid={`client-share-url-missing-${s.id}`}
                          style={{ margin: 0, color: '#a1a1aa' }}
                        >
                          {t('editor.clientShareUrlUnavailable')}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={labelStyle}>{t('editor.clientSharePages')}</span>
                <button
                  type="button"
                  onClick={() =>
                    setSelected(allSelected ? [] : pages.map((p) => p.id))
                  }
                  style={ghostBtn}
                >
                  {allSelected ? t('editor.clientShareClearPages') : t('editor.clientShareAllPages')}
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 140, overflow: 'auto' }}>
                {pages.map((p) => (
                  <label key={p.id} style={{ display: 'flex', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      onChange={() => togglePage(p.id)}
                      data-testid={`client-share-page-check-${p.id}`}
                    />
                    {p.name}
                  </label>
                ))}
              </div>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={labelStyle}>{t('editor.clientShareAccess')}</span>
              <select
                value={accessMode}
                onChange={(e) =>
                  setAccessMode(e.target.value as 'link' | 'password' | 'email_allowlist')
                }
                data-testid="client-share-access-mode"
                style={inputStyle}
              >
                <option value="password">{t('editor.clientShareAccessPassword')}</option>
                <option value="link">{t('editor.clientShareAccessLink')}</option>
                <option value="email_allowlist">{t('editor.clientShareAccessEmail')}</option>
              </select>
            </label>

            {accessMode === 'password' ? (
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={labelStyle}>{t('editor.clientSharePassword')}</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="client-share-password-field"
                  style={inputStyle}
                />
              </label>
            ) : null}

            {accessMode === 'email_allowlist' ? (
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={labelStyle}>{t('editor.clientShareEmails')}</span>
                <textarea
                  value={emailsText}
                  onChange={(e) => setEmailsText(e.target.value)}
                  data-testid="client-share-emails-field"
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                  placeholder="a@client.com, b@client.com"
                />
              </label>
            ) : null}

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={labelStyle}>{t('editor.clientShareContent')}</span>
              <select
                value={contentMode}
                onChange={(e) =>
                  setContentMode(e.target.value as 'pinned_revision' | 'live_head')
                }
                data-testid="client-share-content-mode"
                style={inputStyle}
              >
                <option value="pinned_revision">{t('editor.clientShareContentPinned')}</option>
                <option value="live_head">{t('editor.clientShareContentLive')}</option>
              </select>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={commentsEnabled}
                onChange={(e) => setCommentsEnabled(e.target.checked)}
                data-testid="client-share-comments-enabled"
              />
              {t('editor.clientShareComments')}
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={labelStyle}>{t('editor.clientShareTtl')}</span>
              <input
                type="number"
                min={1}
                max={90}
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value) || 14)}
                data-testid="client-share-ttl"
                style={inputStyle}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={labelStyle}>{t('editor.clientShareLabel')}</span>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                data-testid="client-share-label"
                style={inputStyle}
                placeholder={t('editor.clientShareLabelPlaceholder')}
              />
            </label>

            <button
              type="button"
              disabled={busy || !collectionBound}
              data-testid="client-share-create"
              onClick={() => void createShare()}
              style={primaryBtn}
            >
              {busy ? t('editor.clientShareBusy') : t('editor.clientShareCreate')}
            </button>

            {localError ? (
              <p
                role="alert"
                data-testid="client-share-dialog-error"
                style={{ margin: 0, fontSize: 13, color: '#f87171' }}
              >
                {localError}
              </p>
            ) : null}

            {createdUrl ? (
              <div
                data-testid="client-share-created-url"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  padding: 10,
                  borderRadius: 8,
                  border: '1px solid #3f3f46',
                  background: '#09090b',
                }}
              >
                <span style={labelStyle}>
                  {copiedOk ? t('editor.clientShareOk') : t('editor.clientShareCreated')}
                </span>
                <input
                  readOnly
                  value={createdUrl}
                  data-testid="client-share-created-url-input"
                  style={inputStyle}
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  type="button"
                  data-testid="client-share-copy-again"
                  onClick={() => void copyUrl(createdUrl)}
                  style={primaryBtn}
                >
                  {t('editor.clientShareCopyAgain')}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.65)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10000,
}

const dialogStyle: React.CSSProperties = {
  backgroundColor: '#18181b',
  border: '1px solid #27272a',
  borderRadius: 10,
  width: 440,
  maxHeight: '90vh',
  overflow: 'auto',
  padding: 20,
  color: '#f4f4f5',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#a1a1aa',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  backgroundColor: '#09090b',
  border: '1px solid #3f3f46',
  borderRadius: 6,
  padding: '8px 10px',
  color: '#f4f4f5',
  fontSize: 13,
}

const primaryBtn: React.CSSProperties = {
  borderRadius: 6,
  border: '1px solid #3f3f46',
  background: '#27272a',
  color: '#f4f4f5',
  padding: '8px 12px',
  fontSize: 13,
  cursor: 'pointer',
}

const ghostBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#a1a1aa',
  cursor: 'pointer',
  fontSize: 12,
}

const tabBtn: React.CSSProperties = {
  ...primaryBtn,
  background: 'transparent',
  flex: 1,
}

const tabActive: React.CSSProperties = {
  background: '#27272a',
}
