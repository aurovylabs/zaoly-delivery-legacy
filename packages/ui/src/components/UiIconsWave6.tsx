/**
 * Wave 6 — chrome aliases + chat variants.
 * Spec: specs/domain/zaoly-ui-icon-language.md
 */

import type { ReactNode } from 'react'
import { UiIconTrack, type IconProps } from './ui-icon-track'
import { IconMenu } from './UiIconsCore'
import { IconMessage } from './UiIconsWave5'

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
const FS = 'ds-ui-icon__fill--solid'

/** Alias — hamburger ≡ IconMenu. */
export function IconHamburger(props: IconProps) {
  return <IconMenu {...props} />
}

/** Alias — chat bubble ≡ IconMessage. */
export function IconChat(props: IconProps) {
  return <IconMessage {...props} />
}

/** Round chat bubble. */
export function IconMessageCircle(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M8 2.75a5.25 5.25 0 00-1.85 10.15L3.75 13.5l1.1-2.1A5.25 5.25 0 108 2.75z" className={S} />
    </>,
  )
}

/** Chat bubble with plus (new thread). */
export function IconMessagePlus(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.25 3.75h7.25v6.25H7L4.25 12.5V10H3.25z" className={S} />
      <path d="M11.25 8.5v4M9.25 10.5h4" className={S} />
    </>,
  )
}

/** Simple bot / assistant head. */
export function IconBot(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="3.5" y="5.25" width="9" height="7.5" rx="2" className={S} />
      <path d="M8 3.25v2" className={S} />
      <circle cx="8" cy="2.85" r="0.7" className={FS} />
      <circle cx="6" cy="8.5" r="0.85" className={FS} />
      <circle cx="10" cy="8.5" r="0.85" className={FS} />
      <path d="M6.5 11h3" className={S} />
    </>,
  )
}

/** Close / dismiss inside a circle. */
export function IconXCircle(props: IconProps) {
  return icon(
    props,
    <>
      <circle cx="8" cy="8" r="5.25" className={S} />
      <path d="M5.75 5.75l4.5 4.5M10.25 5.75l-4.5 4.5" className={S} />
    </>,
  )
}

export type { IconProps }
