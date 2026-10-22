import type { CSSProperties, HTMLAttributes } from 'react'
import {
  sanitizeSiteSvgMarkup,
  SITE_SVG_PLACEHOLDER_MARKUP,
} from '../sanitize-svg'

export type SvgProps = {
  /** Sanitized outer <svg>…</svg> markup. */
  markup?: string
  viewBox?: string
  alt?: string
  title?: string
  className?: string
  style?: CSSProperties
} & Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'dangerouslySetInnerHTML'>

export function Svg({
  markup = SITE_SVG_PLACEHOLDER_MARKUP,
  viewBox,
  alt = 'Graphic',
  title,
  className,
  style,
  ...rest
}: SvgProps) {
  const sanitized = sanitizeSiteSvgMarkup(markup)
  const safeMarkup =
    sanitized.ok ? sanitized.markup : SITE_SVG_PLACEHOLDER_MARKUP
  const resolvedViewBox = viewBox || (sanitized.ok ? sanitized.viewBox : undefined)

  let html = safeMarkup
  if (resolvedViewBox && !/\bviewBox\s*=/i.test(html)) {
    html = html.replace(
      /<\s*svg\b/i,
      (open) => `${open} viewBox="${resolvedViewBox}"`,
    )
  }

  const label = title?.trim() || alt?.trim() || 'Graphic'

  return (
    <span
      className={['site-svg', className].filter(Boolean).join(' ')}
      style={style}
      role="img"
      aria-label={label}
      dangerouslySetInnerHTML={{ __html: html }}
      {...rest}
    />
  )
}

export { SITE_SVG_PLACEHOLDER_MARKUP } from '../sanitize-svg'
