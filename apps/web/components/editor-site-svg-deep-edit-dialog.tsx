'use client'

import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { Button, Dialog, Tabs, Text } from '@zaoly/ui'
import {
  SITE_SVG_MARKS,
  promoteSiteSvgMarkupToCurrentColor,
  sanitizeSiteSvgMarkup,
} from '@zaoly/site-kit'
import { useUserPrefs } from '../lib/user-prefs'
import {
  appendLinePoint,
  closeActivePath,
  draftHasCommands,
  emptyVectorDraft,
  parsePathsFromSvgMarkup,
  serializeCommandsToPathD,
  serializeDraftToSvgMarkup,
  type VectorDraft,
} from '../lib/vector'

type Props = {
  open: boolean
  initialMarkup: string
  onClose: () => void
  onApply: (markup: string) => void
}

type PreviewBg = 'checker' | 'dark' | 'light'
type DeepEditTab = 'draw' | 'markup'

/**
 * SiteSvg Phase 4 — isolated Draw + Markup deep-edit (spec R16–R20).
 * Draw keeps a session vector draft; Apply serializes → sanitize → set_prop markup.
 * Markup tab remains the escape hatch for unparseable craft.
 */
export function EditorSiteSvgDeepEditDialog({
  open,
  initialMarkup,
  onClose,
  onApply,
}: Props) {
  const { t } = useUserPrefs()
  const [tab, setTab] = useState<DeepEditTab>('markup')
  const [markupDraft, setMarkupDraft] = useState(initialMarkup)
  const [vectorDraft, setVectorDraft] = useState<VectorDraft>(() => emptyVectorDraft())
  const [drawDirty, setDrawDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewBg, setPreviewBg] = useState<PreviewBg>('checker')
  const [statusNotice, setStatusNotice] = useState<string | null>(null)
  const drawSurfaceRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    if (!open) return
    setMarkupDraft(initialMarkup)
    setError(null)
    setStatusNotice(null)
    setDrawDirty(false)
    const parsed = parsePathsFromSvgMarkup(initialMarkup)
    if (parsed) {
      setVectorDraft(parsed)
      setTab('draw')
    } else {
      setVectorDraft(emptyVectorDraft())
      setTab('markup')
    }
  }, [open, initialMarkup])

  const activeMarkup = useMemo(() => {
    if (tab === 'draw' && (drawDirty || draftHasCommands(vectorDraft))) {
      return serializeDraftToSvgMarkup(vectorDraft)
    }
    return markupDraft
  }, [tab, drawDirty, vectorDraft, markupDraft])

  const preview = useMemo(() => sanitizeSiteSvgMarkup(activeMarkup), [activeMarkup])

  function handleTabChange(id: string) {
    const next = id === 'draw' ? 'draw' : 'markup'
    if (next === tab) return

    if (next === 'draw') {
      const parsed = parsePathsFromSvgMarkup(markupDraft)
      if (!parsed) {
        setStatusNotice(t('editor.siteSvgEditDrawUnparseable'))
        setTab('markup')
        return
      }
      setVectorDraft(parsed)
      setDrawDirty(false)
      setStatusNotice(null)
      setTab('draw')
      return
    }

    // Draw → Markup: sync serialized draft only when Draw was edited or has commands.
    if (drawDirty || draftHasCommands(vectorDraft)) {
      setMarkupDraft(serializeDraftToSvgMarkup(vectorDraft))
    }
    setStatusNotice(null)
    setTab('markup')
  }

  function handleApply() {
    const candidate =
      tab === 'draw' ? serializeDraftToSvgMarkup(vectorDraft) : markupDraft
    const result = sanitizeSiteSvgMarkup(candidate)
    if (!result.ok) {
      setError(t('editor.siteSvgEditMarkupInvalid'))
      return
    }
    onApply(result.markup)
    onClose()
  }

  function handlePromoteCurrentColor() {
    const res = promoteSiteSvgMarkupToCurrentColor(markupDraft)
    if (res.ok) {
      setMarkupDraft(res.markup)
      setStatusNotice('Promoted static colors to currentColor')
    }
  }

  function handleSelectMark(markup: string, label: string) {
    setMarkupDraft(markup)
    setError(null)
    setStatusNotice(`Loaded curated mark: ${label}`)
    const parsed = parsePathsFromSvgMarkup(markup)
    if (parsed) {
      setVectorDraft(parsed)
      setDrawDirty(false)
    }
  }

  function handleDrawClick(event: MouseEvent<SVGSVGElement>) {
    const svg = drawSurfaceRef.current
    if (!svg) return
    const pt = svg.createSVGPoint()
    pt.x = event.clientX
    pt.y = event.clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return
    const local = pt.matrixTransform(ctm.inverse())
    setVectorDraft((prev) => appendLinePoint(prev, { x: local.x, y: local.y }))
    setDrawDirty(true)
    setError(null)
  }

  function handleClosePath() {
    setVectorDraft((prev) => closeActivePath(prev))
    setDrawDirty(true)
  }

  function handleClearDraw() {
    setVectorDraft(emptyVectorDraft(vectorDraft.viewBox))
    setDrawDirty(true)
  }

  const bgStyle =
    previewBg === 'checker'
      ? {
          backgroundImage:
            'repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%)',
          backgroundSize: '16px 16px',
        }
      : previewBg === 'dark'
        ? { background: '#12141a', color: '#f3f4f6' }
        : { background: '#ffffff', color: '#111827' }

  const viewBox = vectorDraft.viewBox ?? '0 0 48 48'

  const kitMarksBar = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
      <Text role="meta" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)' }}>
        KIT MARKS:
      </Text>
      {SITE_SVG_MARKS.map((m) => (
        <Button
          key={m.id}
          type="button"
          size="sm"
          variant="ghost"
          style={{ fontSize: '11px', padding: '2px 8px', height: '24px' }}
          onClick={() => handleSelectMark(m.markup, m.label)}
        >
          {m.label}
        </Button>
      ))}
    </div>
  )

  const actionBar = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {tab === 'markup' ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            style={{ fontSize: '11px', height: '24px' }}
            onClick={handlePromoteCurrentColor}
            title="Convert static fills and strokes to currentColor for token recoloring"
          >
            Promote to currentColor
          </Button>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              style={{ fontSize: '11px', height: '24px' }}
              onClick={handleClosePath}
              data-testid="site-svg-deep-edit-close-path"
            >
              {t('editor.siteSvgEditClosePath')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              style={{ fontSize: '11px', height: '24px' }}
              onClick={handleClearDraw}
              data-testid="site-svg-deep-edit-clear"
            >
              {t('editor.siteSvgEditClearDraw')}
            </Button>
          </>
        )}
        {preview.ok && preview.viewBox ? (
          <span
            style={{
              fontSize: '10px',
              fontFamily: 'monospace',
              padding: '2px 6px',
              borderRadius: '3px',
              background: 'var(--surface-subtle, rgba(0,0,0,0.05))',
              color: 'var(--muted)',
            }}
          >
            viewBox: {preview.viewBox}
          </span>
        ) : null}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        {(['checker', 'dark', 'light'] as const).map((bg) => (
          <button
            key={bg}
            type="button"
            onClick={() => setPreviewBg(bg)}
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '3px',
              border: 'none',
              cursor: 'pointer',
              background: previewBg === bg ? 'var(--brand-primary, #1f44ff)' : 'transparent',
              color: previewBg === bg ? '#fff' : 'var(--muted)',
              fontWeight: previewBg === bg ? 600 : 400,
            }}
          >
            {bg.charAt(0).toUpperCase() + bg.slice(1)}
          </button>
        ))}
      </div>
    </div>
  )

  const previewPane = (
    <div
      className="creation-editor-site-svg-deep-edit__preview"
      style={bgStyle}
      data-testid="site-svg-deep-edit-preview"
      aria-label={t('editor.siteSvgEditMarkupPreview')}
    >
      {preview.ok ? (
        <div
          className="creation-editor-site-svg-deep-edit__preview-host"
          dangerouslySetInnerHTML={{ __html: preview.markup }}
        />
      ) : (
        <Text role="meta" as="p" className="creation-editor-site-svg-deep-edit__preview-error">
          {error ?? t('editor.siteSvgEditMarkupInvalid')}
        </Text>
      )}
    </div>
  )

  const drawPanel = (
    <div className="creation-editor-site-svg-deep-edit__draw">
      <Text role="meta" as="p" className="creation-editor-site-svg-deep-edit__draw-hint">
        {t('editor.siteSvgEditDrawHint')}
      </Text>
      <svg
        ref={drawSurfaceRef}
        className="creation-editor-site-svg-deep-edit__draw-surface"
        viewBox={viewBox}
        role="img"
        aria-label={t('editor.siteSvgEditDraw')}
        data-testid="site-svg-deep-edit-draw-surface"
        onClick={handleDrawClick}
      >
        {vectorDraft.paths.map((path, pi) => {
          const d = serializeCommandsToPathD(path.commands)
          if (!d) return null
          return (
            <path
              key={`path-${pi}`}
              d={d}
              fill={path.fill ?? 'currentColor'}
              stroke={path.stroke}
              strokeWidth={path.strokeWidth}
              pointerEvents="none"
            />
          )
        })}
        {vectorDraft.paths.flatMap((path, pi) =>
          path.commands.map((cmd, ci) => {
            if (cmd.type === 'Z') return null
            const x = cmd.x
            const y = cmd.y
            return (
              <circle
                key={`${pi}-${ci}`}
                cx={x}
                cy={y}
                r={1.2}
                fill="var(--brand-primary, #1f44ff)"
                pointerEvents="none"
              />
            )
          }),
        )}
      </svg>
      {previewPane}
    </div>
  )

  const markupPanel = (
    <div className="creation-editor-site-svg-deep-edit__markup">
      <label className="creation-editor-site-svg-deep-edit__field">
        <span className="visually-hidden">markup</span>
        <textarea
          className="creation-editor-site-svg-deep-edit__textarea"
          value={markupDraft}
          onChange={(event) => {
            setMarkupDraft(event.target.value)
            setError(null)
          }}
          spellCheck={false}
          rows={12}
          data-testid="site-svg-deep-edit-textarea"
          aria-label={t('editor.siteSvgEditMarkupTitle')}
        />
      </label>
      {previewPane}
    </div>
  )

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('editor.siteSvgEditMarkupTitle')}
      className="creation-editor-site-svg-deep-edit"
      data-testid="site-svg-deep-edit-dialog"
      actions={
        <>
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="subtle"
            disabled={!preview.ok}
            data-testid="site-svg-deep-edit-apply"
            onClick={handleApply}
          >
            {t('editor.siteSvgEditMarkupApply')}
          </Button>
        </>
      }
    >
      <div className="creation-editor-site-svg-deep-edit__body">
        {kitMarksBar}
        {actionBar}

        {statusNotice ? (
          <div
            style={{
              fontSize: '11px',
              padding: '4px 8px',
              borderRadius: '4px',
              background: 'rgba(2, 132, 199, 0.1)',
              color: 'var(--brand-primary, #1f44ff)',
            }}
            data-testid="site-svg-deep-edit-status"
          >
            {statusNotice}
          </div>
        ) : null}

        {preview.ok && preview.stripped ? (
          <div
            style={{
              fontSize: '11px',
              padding: '4px 8px',
              borderRadius: '4px',
              background: 'rgba(234, 179, 8, 0.15)',
              color: '#b45309',
            }}
          >
            Sanitization notice: active elements (scripts/foreignObjects/event handlers) stripped.
          </div>
        ) : null}

        <Tabs
          aria-label={t('editor.siteSvgEditTabs')}
          value={tab}
          onChange={handleTabChange}
          className="creation-editor-site-svg-deep-edit__tabs"
          items={[
            {
              id: 'draw',
              label: t('editor.siteSvgEditDraw'),
              panel: drawPanel,
            },
            {
              id: 'markup',
              label: t('editor.siteSvgEditMarkupTab'),
              panel: markupPanel,
            },
          ]}
        />

        {error ? (
          <Text
            role="meta"
            as="p"
            className="creation-editor-site-svg-deep-edit__error"
            data-testid="site-svg-deep-edit-error"
          >
            {error}
          </Text>
        ) : null}
      </div>
    </Dialog>
  )
}
