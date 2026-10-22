'use client'

import type { CSSProperties, HTMLAttributes } from 'react'

export type TokenPreviewKind =
  | 'color'
  | 'space'
  | 'radius'
  | 'opacity'
  | 'type'
  | 'size'
  | 'shadow'
  | 'auto'

export type TokenPreviewProps = {
  className?: string
  kind?: TokenPreviewKind
  /** Resolved CSS for display (color, length, shadow, opacity). */
  value?: string
  size?: 'sm' | 'md'
  title?: string
} & Omit<HTMLAttributes<HTMLSpanElement>, 'className' | 'children' | 'title'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function parseLengthPx(value?: string): number {
  if (!value) return 12
  if (value.endsWith('px')) return Number.parseFloat(value) || 12
  if (value.endsWith('rem')) return (Number.parseFloat(value) || 1) * 16
  if (value.endsWith('%')) return Number.parseFloat(value) || 12
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? n : 12
}

function resolveKind(kind: TokenPreviewKind | undefined, value?: string): TokenPreviewKind {
  if (kind && kind !== 'auto') return kind
  if (!value) return 'color'
  if (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')) return 'color'
  if (value.includes('shadow') || value.includes('px ') || value.startsWith('0 ')) return 'shadow'
  return 'space'
}

/** Kind-aware token preview chip (display-only). */
export function TokenPreview({
  className,
  kind = 'auto',
  value,
  size = 'sm',
  title,
  ...rest
}: TokenPreviewProps) {
  const resolved = resolveKind(kind, value)
  const base = cx('ds-token-preview', `ds-token-preview--${size}`, `ds-token-preview--${resolved}`, className)

  if (!value) {
    return <span className={cx(base, 'ds-token-preview--empty')} title={title} {...rest} />
  }

  if (resolved === 'color') {
    return (
      <span
        className={base}
        style={{ background: value }}
        title={title ?? value}
        aria-hidden
        {...rest}
      />
    )
  }

  if (resolved === 'space') {
    const max = size === 'md' ? 40 : 28
    const w = Math.min(max, Math.max(4, parseLengthPx(value) / 2))
    return (
      <span className={base} title={title ?? value} aria-hidden {...rest}>
        <span className="ds-token-preview__bar" style={{ width: w }} />
      </span>
    )
  }

  if (resolved === 'size') {
    const px = Math.min(size === 'md' ? 22 : 16, Math.max(6, parseLengthPx(value) / 6))
    return (
      <span className={base} title={title ?? value} aria-hidden {...rest}>
        <span className="ds-token-preview__size" style={{ width: px, height: px }} />
      </span>
    )
  }

  if (resolved === 'radius') {
    const r = Math.min(12, Math.max(2, parseLengthPx(value) / 2))
    return (
      <span
        className={base}
        title={title ?? value}
        style={{ borderRadius: r } as CSSProperties}
        aria-hidden
        {...rest}
      />
    )
  }

  if (resolved === 'opacity') {
    const o = Math.min(1, Math.max(0, Number.parseFloat(value) || 0))
    return (
      <span className={base} title={title ?? value} aria-hidden {...rest}>
        <span className="ds-token-preview__opacity" style={{ opacity: o }} />
      </span>
    )
  }

  if (resolved === 'shadow') {
    return (
      <span
        className={base}
        title={title ?? value}
        style={{ boxShadow: value }}
        aria-hidden
        {...rest}
      />
    )
  }

  // type
  return (
    <span className={base} title={title ?? value} aria-hidden {...rest}>
      Ag
    </span>
  )
}
