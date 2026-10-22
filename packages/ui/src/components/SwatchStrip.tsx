import type { HTMLAttributes, ReactNode } from 'react'

export type SwatchStripProps = {
  swatches: string[]
  label?: ReactNode
  max?: number
  className?: string
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Horizontal color swatch row — Brandion chapter teaser strip. */
export function SwatchStrip({
  swatches,
  label,
  max = 8,
  className,
  ...rest
}: SwatchStripProps) {
  const shown = swatches.filter(Boolean).slice(0, Math.max(0, max))
  if (shown.length === 0 && label == null) {
    return (
      <span className={cx('ds-swatch-strip', 'ds-swatch-strip--empty', className)} {...rest}>
        Empty
      </span>
    )
  }
  return (
    <span className={cx('ds-swatch-strip', className)} {...rest}>
      <span className="ds-swatch-strip__row" aria-hidden>
        {shown.map((hex, i) => (
          <span
            key={`${hex}-${i}`}
            className="ds-swatch-strip__swatch"
            style={{ background: hex }}
            title={hex}
          />
        ))}
      </span>
      {label != null ? <span className="ds-swatch-strip__label">{label}</span> : null}
    </span>
  )
}
