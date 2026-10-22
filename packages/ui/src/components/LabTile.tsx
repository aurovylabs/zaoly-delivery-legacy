'use client'

import type { HTMLAttributes, ReactNode } from 'react'

export type LabTileTone = 'neutral' | 'pos' | 'low' | 'neg'

export type LabTileProps = {
  label: ReactNode
  value: ReactNode
  meta?: ReactNode
  unit?: ReactNode
  tone?: LabTileTone
  /** Highlight current / selected tile (e.g. sibling device). */
  active?: boolean
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children' | 'title'>

export type LabTileStripProps = {
  children: ReactNode
  columns?: number
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Soft Collection value card — Checks / Quickscan / wave metrics.
 * Spec: specs/domain/zaoly-ui-lab-tile.md
 * Magazine dashboard KPIs → KpiMetric (shell-free).
 */
export function LabTile({
  label,
  value,
  meta,
  unit,
  tone = 'neutral',
  active = false,
  className,
  ...rest
}: LabTileProps) {
  return (
    <div
      className={cx('ds-lab-tile', className)}
      data-tone={tone === 'neutral' ? undefined : tone}
      data-active={active ? 'true' : undefined}
      {...rest}
    >
      <strong className="ds-lab-tile__v">
        {value}
        {unit != null ? <span className="ds-lab-tile__unit">{unit}</span> : null}
      </strong>
      <span className="ds-lab-tile__k">{label}</span>
      {meta != null ? <span className="ds-lab-tile__m">{meta}</span> : null}
    </div>
  )
}

/** Gap grid of soft LabTiles (replaces hairline-joined sharp columns). */
export function LabTileStrip({
  children,
  columns = 4,
  className,
  style,
  ...rest
}: LabTileStripProps) {
  return (
    <div
      className={cx('ds-lab-tile-strip', className)}
      style={{
        ...style,
        ['--ds-lab-cols' as string]: String(Math.max(1, columns)),
      }}
      {...rest}
    >
      {children}
    </div>
  )
}
