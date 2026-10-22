import type { CSSProperties, HTMLAttributes } from 'react'

export const SITE_SHAPE_DEFAULT_D =
  'M24 4 L44 24 L24 44 L4 24 Z'
export const SITE_SHAPE_DEFAULT_VIEWBOX = '0 0 48 48'

export type ShapeProps = {
  /** SVG path `d` attribute. */
  d?: string
  viewBox?: string
  alt?: string
  title?: string
  className?: string
  style?: CSSProperties
} & Omit<HTMLAttributes<HTMLSpanElement>, 'children'>

export function Shape({
  d = SITE_SHAPE_DEFAULT_D,
  viewBox = SITE_SHAPE_DEFAULT_VIEWBOX,
  alt = 'Shape',
  title,
  className,
  style,
  ...rest
}: ShapeProps) {
  const pathD = String(d ?? '').trim() || SITE_SHAPE_DEFAULT_D
  const vb = String(viewBox ?? '').trim() || SITE_SHAPE_DEFAULT_VIEWBOX
  const label = title?.trim() || alt?.trim() || 'Shape'

  return (
    <span
      className={['site-shape', className].filter(Boolean).join(' ')}
      style={style}
      role="img"
      aria-label={label}
      {...rest}
    >
      <svg
        viewBox={vb}
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <path d={pathD} fill="currentColor" />
      </svg>
    </span>
  )
}
