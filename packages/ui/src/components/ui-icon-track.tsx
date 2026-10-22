/**
 * Shared 16×16 track for custom UI icons (optical kin to inspect glyphs).
 * Spec: specs/domain/zaoly-ui-icon-language.md
 */

import type { ReactNode, SVGProps } from 'react'

export const UI_ICON_VIEW = 16

export type IconProps = {
  size?: number | string
  className?: string
  /** Ignored on custom icons (CSS stroke). Kept for Lucide-wrap API parity. */
  strokeWidth?: number | string
  absoluteStrokeWidth?: boolean
  color?: string
} & Omit<SVGProps<SVGSVGElement>, 'ref' | 'children' | 'width' | 'height' | 'color'>

export function resolveIconSize(size: IconProps['size']): number {
  if (typeof size === 'number' && Number.isFinite(size)) return size
  if (typeof size === 'string') {
    const n = Number.parseInt(size, 10)
    if (Number.isFinite(n)) return n
  }
  return UI_ICON_VIEW
}

type TrackProps = {
  children: ReactNode
  size?: IconProps['size']
  className?: string
} & Omit<SVGProps<SVGSVGElement>, 'ref' | 'children' | 'width' | 'height' | 'viewBox'>

export function UiIconTrack({
  children,
  size = UI_ICON_VIEW,
  className,
  'aria-hidden': ariaHidden = true,
  ...rest
}: TrackProps) {
  const px = resolveIconSize(size)
  return (
    <svg
      className={['ui-icon', 'ds-ui-icon', className].filter(Boolean).join(' ')}
      width={px}
      height={px}
      viewBox={`0 0 ${UI_ICON_VIEW} ${UI_ICON_VIEW}`}
      fill="none"
      aria-hidden={ariaHidden}
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}
