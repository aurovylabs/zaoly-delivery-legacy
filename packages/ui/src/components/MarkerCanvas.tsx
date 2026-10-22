'use client'

import {
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'

export type MarkerCanvasTone = 'neutral' | 'pass' | 'fail' | 'warn'

export type MarkerCanvasRect = {
  id: string
  /** Normalized 0–1 relative to media box. */
  x: number
  y: number
  w: number
  h: number
  tone?: MarkerCanvasTone
  label?: string
  selected?: boolean
}

export type MarkerCanvasProps = {
  /** Background image URL / data URL. */
  src?: string
  alt?: string
  /** Custom paint / canvas slot under markers. */
  media?: ReactNode
  markers?: MarkerCanvasRect[]
  showMarkers?: boolean
  onMarkerActivate?: (id: string) => void
  empty?: ReactNode
  className?: string
  'aria-label'?: string
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}

/**
 * Media frame with normalized rectangular markers.
 * Spec: specs/domain/zaoly-ui-marker-canvas.md
 */
export function MarkerCanvas({
  src,
  alt = '',
  media,
  markers = [],
  showMarkers = true,
  onMarkerActivate,
  empty,
  className,
  'aria-label': ariaLabel = 'Document preview',
  ...rest
}: MarkerCanvasProps) {
  const hasMedia = Boolean(src) || media != null
  const visible = showMarkers ? markers : []

  if (!hasMedia && visible.length === 0) {
    return (
      <section
        className={cx('ds-marker-canvas', 'ds-marker-canvas--empty', className)}
        aria-label={ariaLabel}
        {...rest}
      >
        {empty ?? <p className="ds-marker-canvas__empty">No preview</p>}
      </section>
    )
  }

  const activate = (id: string) => {
    onMarkerActivate?.(id)
  }

  const onKeyDown = (id: string) => (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      activate(id)
    }
  }

  const onClick = (id: string) => (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    activate(id)
  }

  return (
    <section
      className={cx('ds-marker-canvas', className)}
      aria-label={ariaLabel}
      data-marker-count={visible.length}
      {...rest}
    >
      <div className="ds-marker-canvas__frame">
        {media != null ? <div className="ds-marker-canvas__media">{media}</div> : null}
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- package has no Next Image
          <img className="ds-marker-canvas__img" src={src} alt={alt} draggable={false} />
        ) : null}
        {visible.map((m) => {
          const tone = m.tone ?? 'neutral'
          const style = {
            left: `${clamp01(m.x) * 100}%`,
            top: `${clamp01(m.y) * 100}%`,
            width: `${clamp01(m.w) * 100}%`,
            height: `${clamp01(m.h) * 100}%`,
          }
          const interactive = Boolean(onMarkerActivate)
          const cls = cx(
            'ds-marker-canvas__marker',
            `ds-marker-canvas__marker--${tone}`,
            m.selected && 'ds-marker-canvas__marker--selected'
          )
          if (interactive) {
            return (
              <button
                key={m.id}
                type="button"
                className={cls}
                style={style}
                title={m.label || m.id}
                aria-label={m.label || m.id}
                aria-pressed={m.selected ? true : undefined}
                onClick={onClick(m.id)}
                onKeyDown={onKeyDown(m.id)}
              />
            )
          }
          return (
            <span
              key={m.id}
              className={cls}
              style={style}
              title={m.label || m.id}
              aria-hidden
            />
          )
        })}
      </div>
    </section>
  )
}
