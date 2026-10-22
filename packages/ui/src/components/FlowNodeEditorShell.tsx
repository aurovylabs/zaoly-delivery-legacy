'use client'

import { useEffect, type HTMLAttributes, type ReactNode } from 'react'
import { Button } from './Button'
import type { FlowNodeRunState } from './FlowNodeCard'

export type FlowNodeEditorShellProps = {
  open: boolean
  onClose: () => void
  kind?: string
  kindLabel?: string
  title: string
  nodeId?: string
  runState?: FlowNodeRunState
  badges?: ReactNode
  /** Left column — upstream INPUT context. */
  input?: ReactNode
  /** Center column — node parameters. */
  params?: ReactNode
  /** Right column — node OUTPUT. */
  output?: ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children' | 'title'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** n8n-like fullscreen node editor — INPUT | Parameters | OUTPUT columns. */
export function FlowNodeEditorShell({
  open,
  onClose,
  kind,
  kindLabel,
  title,
  nodeId,
  runState = 'idle',
  badges,
  input,
  params,
  output,
  className,
  ...rest
}: FlowNodeEditorShellProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className={cx('zaoly-flow-node-editor', className)}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      {...rest}
    >
      <button
        type="button"
        className="zaoly-flow-node-editor-backdrop"
        aria-label="Editor schließen"
        onClick={onClose}
      />
      <div className="zaoly-flow-node-editor-sheet">
        <header
          className={cx(
            'zaoly-flow-node-editor-head',
            kind && `zaoly-flow-node-editor-head--${kind}`
          )}
        >
          <div className="zaoly-flow-node-editor-head-main">
            {badges ? <div className="zaoly-flow-inspector-badges">{badges}</div> : null}
            <div className="zaoly-flow-inspector-meta">
              {kindLabel || kind ? (
                <span
                  className={cx(
                    'zaoly-flow-inspector-kind',
                    kind && `zaoly-flow-inspector-kind--${kind}`
                  )}
                >
                  {kindLabel ?? kind}
                </span>
              ) : null}
              {runState !== 'idle' ? (
                <span
                  className={cx(
                    'zaoly-flow-inspector-run',
                    `zaoly-flow-inspector-run--${runState}`
                  )}
                >
                  {runState}
                </span>
              ) : null}
            </div>
            <h2 className="zaoly-flow-node-editor-title">{title}</h2>
            {nodeId ? <p className="zaoly-flow-inspector-id">{nodeId}</p> : null}
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={onClose} aria-label="Close">
            ×
          </Button>
        </header>

        <div className="zaoly-flow-node-editor-columns">
          <section className="zaoly-flow-node-editor-col zaoly-flow-node-editor-col--input">
            <h3 className="zaoly-flow-node-editor-col-title">INPUT</h3>
            <div className="zaoly-flow-node-editor-col-body">{input}</div>
          </section>
          <section className="zaoly-flow-node-editor-col zaoly-flow-node-editor-col--params">
            <h3 className="zaoly-flow-node-editor-col-title">Parameters</h3>
            <div className="zaoly-flow-node-editor-col-body">{params}</div>
          </section>
          <section className="zaoly-flow-node-editor-col zaoly-flow-node-editor-col--output">
            <h3 className="zaoly-flow-node-editor-col-title">OUTPUT</h3>
            <div className="zaoly-flow-node-editor-col-body">{output}</div>
          </section>
        </div>
      </div>
    </div>
  )
}
