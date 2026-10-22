'use client'

/**
 * Width/Height Smart HUD — icon strip → Hug / Fill / Fixed menu (+ length ±).
 * Spec: `specs/domain/canvas-smart-hud.md` · Knowledge: `knowledge/hud-control-language.md` (Wave B)
 */
import React, { useEffect, useRef, useState } from 'react'
import type { SceneNode, SceneOp } from '@zaoly/contracts'
import { useHudPromote } from './hud-promote-context'
import { inspectPropIcon } from '../lib/inspect/icons'
import { HUD_SIZE_DIM_PRESETS } from '../lib/inspect/hud-size-dim-presets'
import {
  buildHudTokenWriteOps,
  nudgeCssLengthLiteral,
  readSizeMode,
  sizeModeToValue,
  type SizeMode,
} from '../lib/inspect/resolve-hud-model'

const MODE_OPTS: { value: SizeMode; label: string }[] = [
  { value: 'hug', label: 'Hug' },
  { value: 'fill', label: 'Fill' },
  { value: 'fixed', label: 'Fixed' },
]

function modeSummary(mode: SizeMode, fixedRaw: string): string {
  if (mode === 'fixed') return fixedRaw.trim() || '320px'
  if (mode === 'fill') return 'Fill'
  return 'Hug'
}

export function HudSizeDimField({
  node,
  dim,
  label,
  disabled,
  onOps,
}: {
  node: SceneNode
  dim: 'width' | 'height'
  label: string
  disabled?: boolean
  onOps?: (ops: SceneOp[]) => void
}) {
  const mode = readSizeMode(node, dim)
  const raw = String(node.style?.[dim] ?? node.props?.[dim] ?? '').trim()
  const fixedValue = mode === 'fixed' ? raw || '320px' : ''
  const [draft, setDraft] = useState<string | null>(null)
  const shown = draft ?? fixedValue
  const summary = modeSummary(mode, shown || raw)
  const promote = useHudPromote()
  const canPromote = Boolean(mode === 'fixed' && promote?.canPromote('size', shown))
  const [menuOpen, setMenuOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setMenuOpen(false)
      }
    }
    function onPointer(event: MouseEvent) {
      const target = event.target as HTMLElement | null
      if (!target) return
      if (rootRef.current?.contains(target)) return
      setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const timer = window.setTimeout(() => window.addEventListener('mousedown', onPointer), 0)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onPointer)
    }
  }, [menuOpen])

  const emitLiteral = (value: string) => {
    onOps?.(buildHudTokenWriteOps(node, dim, { kind: 'literal', value }))
  }

  const setMode = (next: SizeMode) => {
    onOps?.([{ op: 'set_prop', nodeId: node.id, key: dim, value: sizeModeToValue(next) }])
    setDraft(null)
  }

  return (
    <div
      ref={rootRef}
      className="creation-canvas-floating-hud__token-icon"
      data-testid={`hud-slot-${dim}`}
    >
      <button
        type="button"
        className={`creation-canvas-floating-hud__btn creation-canvas-floating-hud__token-icon-btn${menuOpen ? ' creation-canvas-floating-hud__btn--on' : ''}`}
        title={`${label}: ${summary}`}
        aria-label={`${label}: ${summary}`}
        aria-expanded={menuOpen}
        aria-haspopup="dialog"
        disabled={disabled}
        data-testid={`hud-token-${dim}`}
        onClick={() => setMenuOpen((v) => !v)}
      >
        <span className="creation-canvas-floating-hud__token-icon-glyph" aria-hidden>
          {inspectPropIcon(dim)}
        </span>
      </button>
      {menuOpen ? (
        <div
          className="creation-canvas-floating-hud__token-menu creation-canvas-floating-hud__size-mode-menu"
          role="dialog"
          aria-label={label}
          data-testid={`hud-token-menu-${dim}`}
        >
          <div className="creation-canvas-floating-hud__token-menu-head">
            <span>{label}</span>
            <span className="creation-canvas-floating-hud__token-menu-value">{summary}</span>
          </div>
          <div
            className="creation-canvas-floating-hud__size-mode-seg"
            role="group"
            aria-label={`${label} mode`}
          >
            {MODE_OPTS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`creation-canvas-floating-hud__size-mode-seg-btn${mode === opt.value ? ' is-on' : ''}`}
                data-testid={`hud-size-mode-${dim}-${opt.value}`}
                aria-pressed={mode === opt.value}
                disabled={disabled}
                onClick={() => setMode(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {mode === 'fixed' ? (
            <>
              <div
                className="creation-canvas-floating-hud__size-mode-presets"
                role="group"
                aria-label={`${label} presets`}
              >
                {HUD_SIZE_DIM_PRESETS.map((css) => (
                  <button
                    key={css}
                    type="button"
                    className={`creation-canvas-floating-hud__size-mode-preset${shown === css ? ' is-on' : ''}`}
                    data-testid={`hud-size-preset-${dim}-${css}`}
                    disabled={disabled}
                    onClick={() => {
                      setDraft(null)
                      emitLiteral(css)
                    }}
                  >
                    {css}
                  </button>
                ))}
              </div>
              <div className="creation-canvas-floating-hud__size-mode-fixed">
                <input
                  type="text"
                  className="creation-canvas-floating-hud__size-literal"
                  data-testid={`hud-literal-${dim}`}
                  disabled={disabled}
                  value={shown}
                  placeholder="320px"
                  aria-label={`${label} value`}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={(e) => {
                    const next = e.currentTarget.value.trim() || '320px'
                    setDraft(null)
                    emitLiteral(next)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      e.currentTarget.blur()
                    }
                  }}
                />
                <div
                  className="creation-canvas-floating-hud__nudge"
                  role="group"
                  aria-label={`${label} nudge`}
                >
                  <button
                    type="button"
                    className="creation-canvas-floating-hud__nudge-btn"
                    data-testid={`hud-nudge-dec-${dim}`}
                    disabled={disabled}
                    aria-label={`${label} decrease`}
                    onClick={() => {
                      setDraft(null)
                      emitLiteral(nudgeCssLengthLiteral(shown || '320px', -1))
                    }}
                  >
                    −
                  </button>
                  <button
                    type="button"
                    className="creation-canvas-floating-hud__nudge-btn"
                    data-testid={`hud-nudge-inc-${dim}`}
                    disabled={disabled}
                    aria-label={`${label} increase`}
                    onClick={() => {
                      setDraft(null)
                      emitLiteral(nudgeCssLengthLiteral(shown || '320px', 1))
                    }}
                  >
                    +
                  </button>
                </div>
                {canPromote ? (
                  <button
                    type="button"
                    className="creation-canvas-floating-hud__promote-btn"
                    data-testid={`hud-promote-${dim}`}
                    disabled={disabled}
                    title="Save as token"
                    aria-label="Save as token"
                    onClick={() =>
                      promote?.tryPromote({
                        slotKey: dim,
                        tokenGroup: 'size',
                        literal: shown,
                      })
                    }
                  >
                    Tok
                  </button>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
