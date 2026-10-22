'use client'

import { useState, type HTMLAttributes, type ReactNode } from 'react'
import { Button } from './Button'
import type { FlowNodeRunState } from './FlowNodeCard'

export type FlowInspectorSection = {
  id: string
  title: string
  meta?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}

export type FlowInspectorShellProps = {
  kind?: string
  kindLabel?: string
  title: string
  nodeId?: string
  runState?: FlowNodeRunState
  badges?: ReactNode
  onClose?: () => void
  sections: FlowInspectorSection[]
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children' | 'title'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Inspector dock chrome — collapsible sections; domain content via slots. */
export function FlowInspectorShell({
  kind,
  kindLabel,
  title,
  nodeId,
  runState = 'idle',
  badges,
  onClose,
  sections,
  className,
  ...rest
}: FlowInspectorShellProps) {
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    for (const s of sections) init[s.id] = s.defaultOpen !== false
    return init
  })

  return (
    <div
      className={cx(
        'zaoly-flow-inspector-body',
        kind && `zaoly-flow-inspector-body--${kind}`,
        className
      )}
      {...rest}
    >
      <header className="zaoly-flow-inspector-head">
        <div className="zaoly-flow-inspector-head-main">
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
          <h2 className="zaoly-flow-inspector-title">{title}</h2>
          {nodeId ? <p className="zaoly-flow-inspector-id">{nodeId}</p> : null}
        </div>
        {onClose ? (
          <Button type="button" size="sm" variant="ghost" onClick={onClose} aria-label="Close">
            ×
          </Button>
        ) : null}
      </header>

      {sections.map((section) => {
        const isOpen = open[section.id] !== false
        return (
          <section
            key={section.id}
            className={cx(
              'zaoly-flow-inspector-section',
              section.id === 'gate' && 'zaoly-flow-inspector-section--gate',
              section.id === 'run' && 'zaoly-flow-inspector-section--run'
            )}
          >
            <button
              type="button"
              className="zaoly-flow-inspector-section-toggle"
              aria-expanded={isOpen}
              onClick={() => setOpen((prev) => ({ ...prev, [section.id]: !isOpen }))}
            >
              <span className="zaoly-flow-inspector-section-title">{section.title}</span>
              {section.meta ? (
                <span className="zaoly-flow-inspector-section-meta">{section.meta}</span>
              ) : null}
              <span className="zaoly-flow-inspector-chevron" aria-hidden>
                {isOpen ? '▾' : '▸'}
              </span>
            </button>
            {isOpen ? (
              <div className="zaoly-flow-inspector-section-body">{section.children}</div>
            ) : null}
          </section>
        )
      })}
    </div>
  )
}
