'use client'

/**
 * Public Client Page Share viewer — AppShell preview + CanvasViewport zoom/pan + spatial pins (P7).
 * Spec: specs/domain/client-page-share.md
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { paths } from '../../lib/paths'
import { useTopbarTrailHost } from '../topbar-trail-host'
import {
  ClientSharePreviewStage,
  type SharePreviewZoomControls,
} from './client-share-preview-stage'
import { ClientShareTrailChrome } from './client-share-trail-chrome'

type SharePageMeta = {
  id: string
  name: string
  breakpoint: string | null
  frame: { width?: number; height?: number } | null
}

type ShareComment = {
  id: string
  pageId: string
  authorName: string
  body: string
  createdAt: string
  pinX?: number
  pinY?: number
  resolved?: boolean
  replies?: Array<{
    id: string
    author: string
    body: string
    createdAt: string
  }>
}

type SharePayload = {
  id: string
  label: string | null
  pageIds: string[]
  pages: SharePageMeta[]
  sceneName: string
  pinnedAt: string
  expiresAt: string | null
  draft?: boolean
  contentMode?: string
  commentsEnabled?: boolean
  comments?: ShareComment[]
}

const DEFAULT_W = 1280
const DEFAULT_H = 800

export function ClientPageShareViewer({ token }: { token: string }) {
  const trailHost = useTopbarTrailHost()
  const zoomRef = useRef<SharePreviewZoomControls | null>(null)
  const [zoomPct, setZoomPct] = useState(100)
  const [pinMode, setPinMode] = useState(false)
  const [payload, setPayload] = useState<SharePayload | null>(null)
  const [gate, setGate] = useState<'password' | 'email' | null>(null)
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [pageId, setPageId] = useState<string | null>(null)
  const [authorName, setAuthorName] = useState('')
  const [exportBusy, setExportBusy] = useState(false)

  const refreshZoomChrome = useCallback(() => {
    setZoomPct(Math.round((zoomRef.current?.zoom ?? 1) * 100))
  }, [])

  const onViewportChange = useCallback((state: { zoom: number; pinMode: boolean }) => {
    setZoomPct(Math.round(state.zoom * 100))
    setPinMode(state.pinMode)
  }, [])

  const load = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(paths.routes.apiPublicClientShare(token), {
        credentials: 'include',
        cache: 'no-store',
      })
      const data = (await res.json().catch(() => ({}))) as SharePayload & {
        code?: string
        error?: string
      }
      if (res.status === 401) {
        const sso = await fetch(paths.routes.apiPublicClientShareUnlock(token), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ sso: true }),
        })
        if (sso.ok) {
          const retry = await fetch(paths.routes.apiPublicClientShare(token), {
            credentials: 'include',
            cache: 'no-store',
          })
          const retryData = (await retry.json().catch(() => ({}))) as SharePayload
          if (retry.ok) {
            setGate(null)
            setPayload(retryData)
            setPageId((prev) => prev ?? retryData.pages[0]?.id ?? retryData.pageIds[0] ?? null)
            return
          }
        }
        if (data.code === 'email_required') {
          setGate('email')
          setPayload(null)
          return
        }
        setGate('password')
        setPayload(null)
        return
      }
      if (!res.ok) {
        setError('not_found')
        setPayload(null)
        return
      }
      setGate(null)
      setPayload(data)
      setPageId((prev) => prev ?? data.pages[0]?.id ?? data.pageIds[0] ?? null)
    } catch {
      setError('not_found')
    } finally {
      setBusy(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  // Soft-refresh comments so designer replies appear live (P9).
  const shareUnlocked = Boolean(payload && !gate)
  const refreshComments = useCallback(async () => {
    try {
      const res = await fetch(paths.routes.apiPublicClientShareComments(token), {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!res.ok) return
      const data = (await res.json().catch(() => ({}))) as { comments?: ShareComment[] }
      if (!Array.isArray(data.comments)) return
      setPayload((prev) => (prev ? { ...prev, comments: data.comments } : prev))
    } catch {
      // ignore
    }
  }, [token])

  useEffect(() => {
    if (!shareUnlocked) return
    const id = window.setInterval(() => {
      void refreshComments()
    }, 3_000)
    return () => window.clearInterval(id)
  }, [shareUnlocked, refreshComments])

  const onUnlock = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setBusy(true)
      setError(null)
      try {
        const body = gate === 'email' ? { email } : { password }
        const res = await fetch(paths.routes.apiPublicClientShareUnlock(token), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          setError(gate === 'email' ? 'bad_email' : 'bad_password')
          return
        }
        await load()
      } catch {
        setError(gate === 'email' ? 'bad_email' : 'bad_password')
      } finally {
        setBusy(false)
      }
    },
    [email, gate, load, password, token],
  )

  const pageComments = useMemo(() => {
    if (!payload?.comments || !pageId) return []
    return payload.comments.filter((c) => c.pageId === pageId)
  }, [pageId, payload?.comments])

  const activePage = useMemo(
    () => payload?.pages.find((p) => p.id === pageId) ?? null,
    [pageId, payload?.pages],
  )

  const artboard = useMemo(() => {
    const w = activePage?.frame?.width
    const h = activePage?.frame?.height
    return {
      width: typeof w === 'number' && w > 0 ? Math.round(w) : DEFAULT_W,
      height: typeof h === 'number' && h > 0 ? Math.round(h) : DEFAULT_H,
    }
  }, [activePage])

  const placeComment = async (input: { pinX: number; pinY: number; body: string }) => {
    if (!pageId || !authorName.trim()) return
    setBusy(true)
    try {
      const res = await fetch(paths.routes.apiPublicClientShareComments(token), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          pageId,
          authorName: authorName.trim(),
          body: input.body,
          pinX: input.pinX,
          pinY: input.pinY,
        }),
      })
      if (!res.ok) return
      await load()
    } finally {
      setBusy(false)
    }
  }

  const downloadExport = async (format: 'png' | 'pdf') => {
    if (!pageId) return
    setExportBusy(true)
    try {
      const res = await fetch(paths.routes.apiPublicClientShareExport(token), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ format, pageId }),
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `share.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExportBusy(false)
    }
  }

  const htmlSrc = useMemo(() => {
    if (!pageId) return null
    const base = paths.routes.apiPublicClientShareHtml(token)
    return `${base}?pageId=${encodeURIComponent(pageId)}`
  }, [pageId, token])

  const trailChrome =
    payload && !gate && error !== 'not_found' ? (
      <ClientShareTrailChrome
        title={payload.label || payload.sceneName}
        draft={Boolean(payload.draft)}
        pages={payload.pages}
        pageId={pageId}
        onPageChange={setPageId}
        zoomPct={zoomPct}
        pinMode={pinMode}
        exportBusy={exportBusy}
        onZoomOut={() => {
          zoomRef.current?.zoomOut()
          refreshZoomChrome()
        }}
        onZoomReset={() => {
          zoomRef.current?.setZoom(1)
          refreshZoomChrome()
        }}
        onZoomIn={() => {
          zoomRef.current?.zoomIn()
          refreshZoomChrome()
        }}
        onFit={() => {
          zoomRef.current?.fit()
          refreshZoomChrome()
        }}
        onToggleComment={() => {
          zoomRef.current?.togglePinMode()
          setPinMode((v) => !v)
        }}
        onExportPng={() => void downloadExport('png')}
        onExportPdf={() => void downloadExport('pdf')}
      />
    ) : null

  if (error === 'not_found') {
    return (
      <div style={stageCenterStyle} data-testid="client-share-not-found">
        <p style={{ color: '#a1a1aa' }}>This share link is unavailable.</p>
      </div>
    )
  }

  if (gate) {
    return (
      <div style={stageCenterStyle} data-testid={`client-share-${gate}`}>
        <form onSubmit={onUnlock} style={cardStyle}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            {gate === 'email' ? 'Email required' : 'Protected preview'}
          </h1>
          <p style={{ margin: 0, color: '#a1a1aa', fontSize: 13 }}>
            {gate === 'email'
              ? 'Enter an allowed email to view this page share.'
              : 'Enter the password to view this page share.'}
          </p>
          {gate === 'email' ? (
            <input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              data-testid="client-share-email-input"
              style={inputStyle}
            />
          ) : (
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              data-testid="client-share-password-input"
              style={inputStyle}
            />
          )}
          {error === 'bad_password' || error === 'bad_email' ? (
            <p style={{ margin: 0, color: '#f87171', fontSize: 12 }}>
              {error === 'bad_email' ? 'Email not on allowlist' : 'Incorrect password'}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy || (gate === 'email' ? !email : !password)}
            style={buttonStyle}
            data-testid="client-share-unlock"
          >
            {busy ? '…' : 'Unlock'}
          </button>
        </form>
      </div>
    )
  }

  if (!payload || !htmlSrc) {
    return (
      <div style={stageCenterStyle} data-testid="client-share-loading">
        <p style={{ color: '#a1a1aa' }}>{busy ? 'Loading…' : '…'}</p>
      </div>
    )
  }

  return (
    <div
      className="creation-share-preview-root"
      style={viewerRootStyle}
      data-testid="client-share-viewer"
    >
      {trailHost && trailChrome ? createPortal(trailChrome, trailHost) : null}
      {!trailHost && trailChrome ? (
        <header style={fallbackHeaderStyle}>{trailChrome}</header>
      ) : null}
      <ClientSharePreviewStage
        htmlSrc={htmlSrc}
        pageTitle={payload.sceneName}
        artboard={artboard}
        comments={pageComments}
        authorName={authorName}
        onAuthorNameChange={setAuthorName}
        onPlaceComment={(input) => void placeComment(input)}
        zoomControlsRef={zoomRef}
        onViewportChange={onViewportChange}
        pinMode={pinMode}
        onPinModeChange={setPinMode}
        onPinOpen={() => {
          void refreshComments()
        }}
      />
    </div>
  )
}

const stageCenterStyle: React.CSSProperties = {
  height: '100%',
  minHeight: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#f4f4f5',
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
}

const viewerRootStyle: React.CSSProperties = {
  height: '100%',
  minHeight: '100%',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  color: '#f4f4f5',
  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
}

const fallbackHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 16px',
  borderBottom: '1px solid #27272a',
  background: '#09090b',
  flexWrap: 'wrap',
}

const cardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  width: 360,
  padding: 20,
  borderRadius: 10,
  border: '1px solid #27272a',
  background: '#18181b',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid #3f3f46',
  background: '#09090b',
  color: '#f4f4f5',
  fontSize: 13,
}

const buttonStyle: React.CSSProperties = {
  borderRadius: 6,
  border: '1px solid #3f3f46',
  background: '#27272a',
  color: '#f4f4f5',
  padding: '8px 12px',
  fontSize: 13,
  cursor: 'pointer',
}
