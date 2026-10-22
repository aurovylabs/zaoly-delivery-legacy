'use client'

import type { ReactNode } from 'react'

export function CollapsibleInspectSection({
  title,
  titleId,
  sectionId,
  open,
  onToggle,
  collapseLabel,
  expandLabel,
  children,
  testId,
}: {
  title: string
  titleId: string
  sectionId: string
  open: boolean
  onToggle: () => void
  collapseLabel: string
  expandLabel: string
  children: ReactNode
  testId?: string
}) {
  return (
    <div
      className={
        open
          ? 'creation-inspect-collapse'
          : 'creation-inspect-collapse creation-inspect-collapse--closed'
      }
      data-inspect-collapse={sectionId}
      data-open={open ? 'true' : 'false'}
      data-testid={testId}
    >
      <button
        type="button"
        className="creation-inspect-collapse__toggle"
        aria-expanded={open}
        aria-controls={titleId}
        onClick={onToggle}
        title={open ? collapseLabel : expandLabel}
      >
        <span aria-hidden="true">{open ? '▾' : '▸'}</span>
        <span>{title}</span>
      </button>
      {open ? (
        <div
          id={titleId}
          className="creation-inspect-collapse__body ds-inspect-section"
          data-inspect-section={sectionId}
          data-testid="inspect-section"
        >
          <div className="ds-inspect-section__body">{children}</div>
        </div>
      ) : (
        <span id={titleId} className="creation-inspect-collapse__sr" hidden>
          {title}
        </span>
      )}
    </div>
  )
}
