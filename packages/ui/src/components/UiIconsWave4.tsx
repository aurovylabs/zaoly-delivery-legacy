/**
 * Wave 4 custom UI icons — Align / Justify matrix (final Lucide residual).
 * Spec: specs/domain/zaoly-ui-icon-language.md
 */

import type { ReactNode } from 'react'
import { UiIconTrack, type IconProps } from './ui-icon-track'

function icon(props: IconProps, children: ReactNode) {
  const { size, className, strokeWidth: _sw, absoluteStrokeWidth: _asw, color, style, ...rest } =
    props
  return (
    <UiIconTrack
      size={size}
      className={className}
      style={color ? { ...style, color } : style}
      {...rest}
    >
      {children}
    </UiIconTrack>
  )
}

const S = 'ds-ui-icon__stroke'

/** Text align left. */
export function IconAlignLeft(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.25 4.25h9.5M3.25 7h6.5M3.25 9.75h9.5M3.25 12.5h5" className={S} />
    </>,
  )
}

export function IconAlignCenter(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.25 4.25h9.5M4.75 7h6.5M3.25 9.75h9.5M5.5 12.5h5" className={S} />
    </>,
  )
}

export function IconAlignRight(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.25 4.25h9.5M6.25 7h6.5M3.25 9.75h9.5M7.75 12.5h5" className={S} />
    </>,
  )
}

export function IconAlignJustify(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.25 4.25h9.5M3.25 7h9.5M3.25 9.75h9.5M3.25 12.5h9.5" className={S} />
    </>,
  )
}

/** Vertical pack — content at start / middle / end of cross axis. */
export function IconAlignStart(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.25 3.5h9.5" className={S} />
      <rect x="4.25" y="5" width="2.5" height="5.5" rx="0.4" className={S} />
      <rect x="7.25" y="5" width="2.5" height="3.5" rx="0.4" className={S} />
      <rect x="10.25" y="5" width="2" height="7" rx="0.4" className={S} />
    </>,
  )
}

export function IconAlignMiddle(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.25 8h9.5" className="ds-ui-icon__stroke ds-ui-icon__stroke--soft" />
      <rect x="4.25" y="5.25" width="2.5" height="5.5" rx="0.4" className={S} />
      <rect x="7.25" y="6.25" width="2.5" height="3.5" rx="0.4" className={S} />
      <rect x="10.25" y="4.5" width="2" height="7" rx="0.4" className={S} />
    </>,
  )
}

export function IconAlignEnd(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.25 12.5h9.5" className={S} />
      <rect x="4.25" y="5.5" width="2.5" height="5.5" rx="0.4" className={S} />
      <rect x="7.25" y="7.5" width="2.5" height="3.5" rx="0.4" className={S} />
      <rect x="10.25" y="4" width="2" height="7" rx="0.4" className={S} />
    </>,
  )
}

/** Main-axis justify — packed start / center / end. */
export function IconJustifyStart(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.25 3.25v9.5" className={S} />
      <rect x="4.75" y="4.25" width="3.5" height="2.25" rx="0.4" className={S} />
      <rect x="4.75" y="7" width="5.5" height="2.25" rx="0.4" className={S} />
      <rect x="4.75" y="9.75" width="2.75" height="2.25" rx="0.4" className={S} />
    </>,
  )
}

export function IconJustifyCenter(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M8 3.25v9.5" className="ds-ui-icon__stroke ds-ui-icon__stroke--soft" />
      <rect x="5" y="4.25" width="6" height="2.25" rx="0.4" className={S} />
      <rect x="4" y="7" width="8" height="2.25" rx="0.4" className={S} />
      <rect x="5.5" y="9.75" width="5" height="2.25" rx="0.4" className={S} />
    </>,
  )
}

export function IconJustifyEnd(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M12.75 3.25v9.5" className={S} />
      <rect x="7.75" y="4.25" width="3.5" height="2.25" rx="0.4" className={S} />
      <rect x="5.75" y="7" width="5.5" height="2.25" rx="0.4" className={S} />
      <rect x="8.5" y="9.75" width="2.75" height="2.25" rx="0.4" className={S} />
    </>,
  )
}

export function IconSpaceBetween(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="3" y="4.25" width="3" height="7.5" rx="0.5" className={S} />
      <rect x="6.5" y="4.25" width="3" height="7.5" rx="0.5" className={S} />
      <rect x="10" y="4.25" width="3" height="7.5" rx="0.5" className={S} />
    </>,
  )
}

export function IconSpaceAround(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.25 3.5v9" className="ds-ui-icon__stroke ds-ui-icon__stroke--soft" />
      <path d="M12.75 3.5v9" className="ds-ui-icon__stroke ds-ui-icon__stroke--soft" />
      <rect x="4.5" y="4.5" width="2.5" height="7" rx="0.45" className={S} />
      <rect x="9" y="4.5" width="2.5" height="7" rx="0.45" className={S} />
    </>,
  )
}

export type { IconProps }
