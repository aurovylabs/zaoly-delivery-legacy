/**
 * Wave 2 custom UI icons — typography toolbar, editor chrome, status.
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
const FS = 'ds-ui-icon__fill--solid'

export function IconType(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.25 12.75 8 3.5l4.75 9.25" className={S} />
      <path d="M5.05 9.35h5.9" className={S} />
    </>,
  )
}

/** Font family — single A (same metaphor as IconType). */
export function IconText(props: IconProps) {
  return <IconType {...props} />
}

/**
 * Font size — small A + large A on one baseline.
 * Scale contrast must read at 14px HUD chips.
 */
export function IconFontSize(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M1.4 13.35h13.2" className={`${S} ds-ui-icon__stroke--soft`} />
      <path d="M2.15 13.2 3.9 8.45 5.65 13.2" className={S} />
      <path d="M2.85 11.4h2.1" className={S} />
      <path d="M6.85 13.2 10.85 2.55 14.85 13.2" className={S} />
      <path d="M8.35 9.15h5" className={S} />
    </>,
  )
}

export function IconBold(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M4.5 3.5h4.2a2.6 2.6 0 010 5.2H4.5z" className={S} />
      <path d="M4.5 8.7h4.8a2.7 2.7 0 010 5.4H4.5z" className={S} />
    </>,
  )
}

/**
 * Font weight — same-size A stack: solid thick A half-hidden behind,
 * hairline A in front (thick A peeks clearly to the right).
 */
export function IconFontWeight(props: IconProps) {
  return icon(
    props,
    <>
      {/* behind: thick A — pushed right so the peek reads clearly */}
      <path
        d="M6.55 12.55 10.85 3.2 15.15 12.55h-1.7l-.52-1.8H11.8l-.52 1.8zm2.4-3.25h1.8L10.85 6.2z"
        className={FS}
      />
      {/* front: thin A */}
      <path d="M1.55 12.85 5.85 3.45l4.3 9.4" className={S} />
      <path d="M3.25 9.4h5.2" className={S} />
    </>,
  )
}

export function IconItalic(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M7 3.5h5.5M3.5 12.5h5.5" className={S} />
      <path d="M9.5 3.5 6.5 12.5" className={S} />
    </>,
  )
}

export function IconUnderline(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M4.5 3.5v5.25a3.5 3.5 0 007 0V3.5" className={S} />
      <path d="M3.5 13h9" className={S} />
    </>,
  )
}

export function IconStrikethrough(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M4 8h8" className={S} />
      <path d="M5.25 11.75c.7 1.1 1.85 1.75 3.25 1.75 2.1 0 3.5-1.2 3.5-2.85 0-.85-.4-1.55-1.15-2" className={S} />
      <path d="M10.75 4.4C10.1 3.55 9.05 3 7.75 3 5.85 3 4.5 4.1 4.5 5.55c0 .7.3 1.3.9 1.75" className={S} />
    </>,
  )
}

export function IconCaseUpper(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.5 12.5 6.25 4.5h.5L9.5 12.5" className={S} />
      <path d="M4.5 10h4" className={S} />
      <path d="M10.5 12.5V7.25h3.25" className={S} />
      <path d="M10.5 9.75h2.5" className={S} />
    </>,
  )
}

export function IconCaseLower(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M4 12.5V8.25a2 2 0 014 0V12.5" className={S} />
      <path d="M8 8.25V12.5" className={S} />
      <path d="M10.25 12.5V8.5h.35c1.35 0 2.4.9 2.4 2.15S11.95 12.5 10.6 12.5z" className={S} />
    </>,
  )
}

export function IconCaseTitle(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.5 12.5 5.75 5h.5L8.5 12.5" className={S} />
      <path d="M4.35 10.25h3.3" className={S} />
      <path d="M10 12.5V8.35a1.85 1.85 0 013.5.35" className={S} />
      <path d="M13.5 12.5V8.35" className={S} />
    </>,
  )
}

export function IconBaseline(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.25 11.5h9.5" className={S} />
      <path d="M5 11.5 7.25 4.75h.5L10 11.5" className={S} />
      <path d="M5.85 9.25h3.3" className={S} />
    </>,
  )
}

export function IconHeading(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.5 3.5v9" className={S} />
      <path d="M9.5 3.5v9" className={S} />
      <path d="M3.5 8h6" className={S} />
      <path d="M11.5 12.5V8.75h.25c1.15 0 2 .7 2 1.7s-.85 1.7-2 1.7H11.5z" className={S} />
    </>,
  )
}

export function IconLink(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M7 9.25a2.75 2.75 0 010-3.9l1.55-1.55a2.75 2.75 0 013.9 3.9L11.2 9" className={S} />
      <path d="M9 6.75a2.75 2.75 0 010 3.9L7.45 12.2a2.75 2.75 0 01-3.9-3.9L4.8 7" className={S} />
    </>,
  )
}

export function IconUndo(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.5 7.25H10a3.25 3.25 0 010 6.5H8.25" className={S} />
      <path d="M6.25 4.25 3.5 7.25 6.25 10.25" className={S} />
    </>,
  )
}

export function IconRedo(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M12.5 7.25H6a3.25 3.25 0 000 6.5h1.75" className={S} />
      <path d="M9.75 4.25 12.5 7.25 9.75 10.25" className={S} />
    </>,
  )
}

export function IconZoomIn(props: IconProps) {
  return icon(
    props,
    <>
      <circle cx="7" cy="7" r="3.75" className={S} />
      <path d="M10 10.25 13.25 13.5" className={S} />
      <path d="M7 5.25v3.5M5.25 7h3.5" className={S} />
    </>,
  )
}

export function IconZoomOut(props: IconProps) {
  return icon(
    props,
    <>
      <circle cx="7" cy="7" r="3.75" className={S} />
      <path d="M10 10.25 13.25 13.5" className={S} />
      <path d="M5.25 7h3.5" className={S} />
    </>,
  )
}

export function IconSave(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.5 3.5h7.25L12.5 5.25V12.5H3.5z" className={S} />
      <path d="M5.25 3.5v3.25h4.5V3.5" className={S} />
      <path d="M5.25 12.5v-3.5h5.5v3.5" className={S} />
    </>,
  )
}

export function IconArrowLeft(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M12.5 8H3.5" className={S} />
      <path d="M7 4.5 3.5 8 7 11.5" className={S} />
    </>,
  )
}

export function IconArrowRight(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.5 8h9" className={S} />
      <path d="M9 4.5 12.5 8 9 11.5" className={S} />
    </>,
  )
}

export function IconArrowUp(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M8 12.5V3.5" className={S} />
      <path d="M4.5 7 8 3.5 11.5 7" className={S} />
    </>,
  )
}

export function IconArrowDown(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M8 3.5v9" className={S} />
      <path d="M4.5 9 8 12.5 11.5 9" className={S} />
    </>,
  )
}

export function IconMinus(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.5 8h9" className={S} />
    </>,
  )
}

export function IconSpacer(props: IconProps) {
  return <IconMinus {...props} />
}

export function IconCircle(props: IconProps) {
  return icon(
    props,
    <>
      <circle cx="8" cy="8" r="4.75" className={S} />
    </>,
  )
}

export function IconInfo(props: IconProps) {
  return icon(
    props,
    <>
      <circle cx="8" cy="8" r="5.25" className={S} />
      <path d="M8 7.25V11.5" className={S} />
      <circle cx="8" cy="5.15" r="0.85" className={FS} />
    </>,
  )
}

export function IconSuccess(props: IconProps) {
  return icon(
    props,
    <>
      <circle cx="8" cy="8" r="5.25" className={S} />
      <path d="M5.25 8.15 7.15 10.1 10.85 6.1" className={S} />
    </>,
  )
}

export function IconWarning(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M8 2.75 13.6 12.75H2.4z" className={S} />
      <path d="M8 6.5v3" className={S} />
      <circle cx="8" cy="11.1" r="0.7" className={FS} />
    </>,
  )
}

export function IconDanger(props: IconProps) {
  return icon(
    props,
    <>
      <circle cx="8" cy="8" r="5.25" className={S} />
      <path d="M8 4.85v4.1" className={S} />
      <circle cx="8" cy="11.15" r="0.7" className={FS} />
    </>,
  )
}

export function IconBan(props: IconProps) {
  return icon(
    props,
    <>
      <circle cx="8" cy="8" r="5.25" className={S} />
      <path d="M4.4 4.4 11.6 11.6" className={S} />
    </>,
  )
}

export type { IconProps }
