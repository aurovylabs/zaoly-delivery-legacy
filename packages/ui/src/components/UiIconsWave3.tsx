/**
 * Wave 3 custom UI icons — media, nav/org, layout props, effects (Align matrix → Wave 4).
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
const F = 'ds-ui-icon__fill'
const FS = 'ds-ui-icon__fill--solid'

export function IconOverview(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="2.75" y="2.75" width="4.5" height="4.5" rx="0.75" className={S} />
      <rect x="8.75" y="2.75" width="4.5" height="4.5" rx="0.75" className={S} />
      <rect x="2.75" y="8.75" width="4.5" height="4.5" rx="0.75" className={S} />
      <rect x="8.75" y="8.75" width="4.5" height="4.5" rx="0.75" className={S} />
    </>,
  )
}

export function IconUser(props: IconProps) {
  return icon(
    props,
    <>
      <circle cx="8" cy="5.5" r="2.25" className={S} />
      <path d="M3.5 13.25c.75-2.5 2.4-3.75 4.5-3.75s3.75 1.25 4.5 3.75" className={S} />
    </>,
  )
}

export function IconPersonas(props: IconProps) {
  return icon(
    props,
    <>
      <circle cx="6" cy="5.5" r="2" className={S} />
      <path d="M2.5 12.75c.55-1.9 1.85-2.85 3.5-2.85" className={S} />
      <circle cx="10.5" cy="5.75" r="1.85" className={S} />
      <path d="M7.75 12.75c.55-1.85 1.85-2.75 3.4-2.75s2.85.9 3.35 2.75" className={S} />
    </>,
  )
}

export function IconProjects(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3 5.25h10v8H3z" className={S} />
      <path d="M3 5.25 5.5 2.75h5L13 5.25" className={S} />
      <path d="M6.5 8.25h3M6.5 10.5h3" className={S} />
    </>,
  )
}

export function IconJourneys(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.5 11.5c1.5-3.5 3-5 5-5s3.5 1.5 4 3.5" className={S} />
      <circle cx="4.25" cy="11.75" r="1.35" className={S} />
      <path d="M10.5 4.25l1.75 1.1L13.5 3.5" className={S} />
      <circle cx="11.5" cy="10.25" r="1.1" className={S} />
    </>,
  )
}

export function IconSend(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.25 3.5 13.5 8 3.25 12.5l1.75-4.5z" className={S} />
      <path d="M5 8h8.5" className={S} />
    </>,
  )
}

export function IconShare(props: IconProps) {
  return icon(
    props,
    <>
      <circle cx="12" cy="4.25" r="1.6" className={S} />
      <circle cx="4" cy="8" r="1.6" className={S} />
      <circle cx="12" cy="11.75" r="1.6" className={S} />
      <path d="M5.5 7.25 10.5 5M5.5 8.75 10.5 11" className={S} />
    </>,
  )
}

export function IconHistory(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.5 8a4.5 4.5 0 108.9-1.1" className={S} />
      <path d="M3.5 4.5V8H7" className={S} />
      <path d="M8 5.75V8.5l2 1.25" className={S} />
    </>,
  )
}

export function IconMoodboard(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="2.75" y="2.75" width="4.25" height="4.25" rx="0.75" className={S} />
      <rect x="8.99" y="2.75" width="4.25" height="4.25" rx="0.75" className={S} />
      <rect x="2.75" y="8.99" width="4.25" height="4.25" rx="0.75" className={S} />
      <rect x="8.99" y="8.99" width="4.25" height="4.25" rx="0.75" className={S} />
    </>,
  )
}

export function IconGrid(props: IconProps) {
  return <IconMoodboard {...props} />
}

export function IconMic(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="6.25" y="2.75" width="3.5" height="6.5" rx="1.75" className={S} />
      <path d="M4.25 8.25a3.75 3.75 0 007.5 0" className={S} />
      <path d="M8 12v1.75M5.5 13.75h5" className={S} />
    </>,
  )
}

export function IconVideo(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="2.5" y="4.5" width="8" height="7" rx="1.25" className={S} />
      <path d="M10.5 7.25 13.5 5.5v5L10.5 8.75z" className={S} />
    </>,
  )
}

export function IconCamera(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3 5.75h2.1l1.15-1.75h3.5L10.9 5.75H13v6.5H3z" className={S} />
      <circle cx="8" cy="8.75" r="2.1" className={S} />
    </>,
  )
}

export function IconClock(props: IconProps) {
  return icon(
    props,
    <>
      <circle cx="8" cy="8" r="5.25" className={S} />
      <path d="M8 5v3.25l2.25 1.5" className={S} />
    </>,
  )
}

export function IconImage(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="2.75" y="3.5" width="10.5" height="9" rx="1.25" className={S} />
      <circle cx="5.75" cy="6.5" r="1.1" className={S} />
      <path d="M3.5 11.5 6.5 8.5l2.25 2.25L11 8.25l2.25 3.25" className={S} />
    </>,
  )
}

export function IconWidth(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.25 4.25v7.5" className={`${S} ds-ui-icon__stroke--soft`} />
      <path d="M12.75 4.25v7.5" className={`${S} ds-ui-icon__stroke--soft`} />
      <path d="M3.25 8h9.5" className={S} />
      <path d="M5.5 5.75 3.25 8 5.5 10.25" className={S} />
      <path d="M10.5 5.75 12.75 8 10.5 10.25" className={S} />
    </>,
  )
}

export function IconHeight(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M4.25 3.25h7.5" className={`${S} ds-ui-icon__stroke--soft`} />
      <path d="M4.25 12.75h7.5" className={`${S} ds-ui-icon__stroke--soft`} />
      <path d="M8 3.25v9.5" className={S} />
      <path d="M5.75 5.5 8 3.25 10.25 5.5" className={S} />
      <path d="M5.75 10.5 8 12.75 10.25 10.5" className={S} />
    </>,
  )
}

export function IconGap(props: IconProps) {
  return icon(
    props,
    <>
      {/* Two columns + mid spacing marks — gap craft at HUD size */}
      <path d="M2.75 3.5v9" className={S} />
      <path d="M5.25 3.5v9" className={S} />
      <path d="M10.75 3.5v9" className={S} />
      <path d="M13.25 3.5v9" className={S} />
      <path d="M6.5 8h3" className={S} />
      <path d="M7.15 6.85 8 8l-.85 1.15" className={`${S} ds-ui-icon__stroke--soft`} />
      <path d="M8.85 6.85 8 8l.85 1.15" className={`${S} ds-ui-icon__stroke--soft`} />
    </>,
  )
}

/** Inner spacing — solid outer frame, filled inset, ticks point inward. */
export function IconPadding(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" className={S} />
      <rect x="5.5" y="5.5" width="5" height="5" rx="0.75" className={FS} />
      {/* Inward ticks from frame toward content */}
      <path d="M8 3.35v1.55" className={S} />
      <path d="M8 11.1v1.55" className={S} />
      <path d="M3.35 8h1.55" className={S} />
      <path d="M11.1 8h1.55" className={S} />
    </>,
  )
}

/** Outer spacing — dashed ring, hollow content, ticks point outward. */
export function IconMargin(props: IconProps) {
  return icon(
    props,
    <>
      <rect
        x="1.75"
        y="1.75"
        width="12.5"
        height="12.5"
        rx="1.25"
        className={`${S} ds-ui-icon__stroke--dashed`}
      />
      <rect x="5" y="5" width="6" height="6" rx="0.75" className={S} />
      {/* Outward ticks from content toward margin ring */}
      <path d="M8 3.15v1.35" className={S} />
      <path d="M8 11.5v1.35" className={S} />
      <path d="M3.15 8h1.35" className={S} />
      <path d="M11.5 8h1.35" className={S} />
    </>,
  )
}

export function IconBox(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="3.25" y="3.25" width="9.5" height="9.5" rx="1.25" className={S} />
      <path d="M3.25 6.5h9.5M6.5 3.25v9.5" className="ds-ui-icon__stroke ds-ui-icon__stroke--soft" />
    </>,
  )
}

export function IconRows(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="3" y="3" width="10" height="2.75" rx="0.6" className={F} />
      <rect x="3" y="6.625" width="10" height="2.75" rx="0.6" className={F} />
      <rect x="3" y="10.25" width="10" height="2.75" rx="0.6" className={F} />
    </>,
  )
}

export function IconColumns(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="3" y="3" width="2.75" height="10" rx="0.6" className={F} />
      <rect x="6.625" y="3" width="2.75" height="10" rx="0.6" className={F} />
      <rect x="10.25" y="3" width="2.75" height="10" rx="0.6" className={F} />
    </>,
  )
}

/** Append a table body row — grid + bottom highlight + plus. */
export function IconTableAddRow(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="2.5" y="2.75" width="11" height="7.5" rx="1.1" className={S} />
      <path
        d="M2.5 5.5h11M2.5 8h11M6.5 2.75v7.5M9.5 2.75v7.5"
        className={`${S} ds-ui-icon__stroke--soft`}
      />
      <path d="M8 11.15v2.6M6.7 12.45h2.6" className={S} />
    </>,
  )
}

/** Append a table column — grid + right highlight + plus. */
export function IconTableAddColumn(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="2.5" y="2.75" width="7.5" height="10.5" rx="1.1" className={S} />
      <path
        d="M2.5 6.25h7.5M2.5 9.75h7.5M5.25 2.75v10.5"
        className={`${S} ds-ui-icon__stroke--soft`}
      />
      <path d="M12.15 8h2.6M13.45 6.7v2.6" className={S} />
    </>,
  )
}

/** Table density — compact row rhythm (tight bars). */
export function IconDensityCompact(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3 4.25h10" className={S} />
      <path d="M3 6.75h10" className={S} />
      <path d="M3 9.25h10" className={S} />
      <path d="M3 11.75h10" className={S} />
    </>,
  )
}

/** Table density — default row rhythm. */
export function IconDensityDefault(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3 4h10" className={S} />
      <path d="M3 8h10" className={S} />
      <path d="M3 12h10" className={S} />
    </>,
  )
}

/** Table density — comfortable row rhythm (wide bars). */
export function IconDensityComfortable(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="3" y="3.25" width="10" height="2.5" rx="0.6" className={F} />
      <rect x="3" y="6.75" width="10" height="2.5" rx="0.6" className={F} />
      <rect x="3" y="10.25" width="10" height="2.5" rx="0.6" className={F} />
    </>,
  )
}

/** Table borders — none (soft empty frame). */
export function IconBordersNone(props: IconProps) {
  return icon(
    props,
    <>
      <rect
        x="2.75"
        y="2.75"
        width="10.5"
        height="10.5"
        rx="1.1"
        className={`${S} ds-ui-icon__stroke--soft`}
      />
    </>,
  )
}

/** Table borders — row rules only. */
export function IconBordersRow(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="2.75" y="2.75" width="10.5" height="10.5" rx="1.1" className={S} />
      <path d="M2.75 8h10.5" className={S} />
    </>,
  )
}

/** Table borders — full cell grid. */
export function IconBordersAll(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="2.75" y="2.75" width="10.5" height="10.5" rx="1.1" className={S} />
      <path d="M2.75 8h10.5M8 2.75v10.5" className={S} />
    </>,
  )
}

export function IconWrap(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.25 4.5h9.5M3.25 8h6.5a2.25 2.25 0 010 4.5H7" className={S} />
      <path d="M8.5 10.75 7 12.5 8.5 13.5" className={S} />
    </>,
  )
}

export function IconStretch(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.25 5.5h9.5M3.25 10.5h9.5" className={S} />
      <path d="M5.5 3.75 3.25 5.5 5.5 7.25" className={S} />
      <path d="M10.5 3.75 12.75 5.5 10.5 7.25" className={S} />
      <path d="M5.5 8.75 3.25 10.5 5.5 12.25" className={S} />
      <path d="M10.5 8.75 12.75 10.5 10.5 12.25" className={S} />
    </>,
  )
}

export function IconPackage(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M8 2.75 13.25 5.5v5L8 13.25 2.75 10.5v-5z" className={S} />
      <path d="M2.75 5.5 8 8.25 13.25 5.5M8 8.25v5" className={S} />
    </>,
  )
}

export function IconCar(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.5 9.5h9l-.75-3.25L10.5 4.5H5.5L4.25 6.25z" className={S} />
      <path d="M3.5 9.5v2h1.75v-1H10.75v1H12.5v-2" className={S} />
      <circle cx="5.5" cy="11.75" r="0.85" className={FS} />
      <circle cx="10.5" cy="11.75" r="0.85" className={FS} />
    </>,
  )
}

export function IconPaw(props: IconProps) {
  return icon(
    props,
    <>
      <ellipse cx="8" cy="10.5" rx="2.6" ry="2.1" className={S} />
      <circle cx="4.5" cy="6.25" r="1.2" className={S} />
      <circle cx="7" cy="4.75" r="1.2" className={S} />
      <circle cx="9.75" cy="4.75" r="1.2" className={S} />
      <circle cx="11.5" cy="6.5" r="1.2" className={S} />
    </>,
  )
}

export function IconZap(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M9 2.75 4.5 9h3.5L7 13.25 12.5 7H9z" className={S} />
    </>,
  )
}

export function IconFill(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M8.5 2.75c1.6 1.75 3.75 4.4 3.75 6.5A4.25 4.25 0 118 5.1" className={S} />
      <path d="M8.5 2.75 11 5.25" className={S} />
    </>,
  )
}

export function IconGhost(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M4 7a4 4 0 018 0v5.5l-1.5-1-1.5 1-1.5-1-1.5 1-1.5-1L4 12.5z" className={S} />
      <circle cx="6.5" cy="7" r="0.7" className={FS} />
      <circle cx="9.5" cy="7" r="0.7" className={FS} />
    </>,
  )
}

export function IconMinimize(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.5 6.5H6.5V3.5" className={S} />
      <path d="M12.5 9.5H9.5V12.5" className={S} />
      <path d="M6.5 6.5 3.5 3.5M9.5 9.5 12.5 12.5" className={S} />
    </>,
  )
}

export function IconMaximize(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M9.5 3.5H12.5V6.5" className={S} />
      <path d="M6.5 12.5H3.5V9.5" className={S} />
      <path d="M12.5 3.5 9 7M3.5 12.5 7 9" className={S} />
    </>,
  )
}

export function IconScroll(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M5 3.5h6.5v9.5H5A1.75 1.75 0 013.25 11.25V5.25A1.75 1.75 0 015 3.5z" className={S} />
      <path d="M6.5 6.5h4M6.5 8.75h4M6.5 11h2.5" className={S} />
    </>,
  )
}

export function IconDotted(props: IconProps) {
  return icon(
    props,
    <>
      <circle cx="8" cy="8" r="4.75" className={S} />
      <circle cx="8" cy="8" r="1.35" className={FS} />
    </>,
  )
}

export function IconMove(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M8 3.25v9.5M3.25 8h9.5" className={S} />
      <path d="M8 3.25 6.5 4.75M8 3.25 9.5 4.75" className={S} />
      <path d="M8 12.75 6.5 11.25M8 12.75 9.5 11.25" className={S} />
      <path d="M3.25 8 4.75 6.5M3.25 8 4.75 9.5" className={S} />
      <path d="M12.75 8 11.25 6.5M12.75 8 11.25 9.5" className={S} />
    </>,
  )
}

export function IconSparkles(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M8 2.75 8.85 6.15 12.25 7 8.85 7.85 8 11.25 7.15 7.85 3.75 7 7.15 6.15z" className={S} />
      <path d="M12.25 10.25l.45 1.55 1.55.45-1.55.45-.45 1.55-.45-1.55-1.55-.45 1.55-.45z" className={S} />
    </>,
  )
}

export function IconRotate(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M12.5 8a4.5 4.5 0 11-1.2-3" className={S} />
      <path d="M12.5 3.25V6.5H9.25" className={S} />
    </>,
  )
}

export function IconRadius(props: IconProps) {
  return icon(
    props,
    <>
      {/* Sharp top-right + rounded bottom-left — radius craft */}
      <path d="M3.5 3.5h5.5M12.5 3.5v5.5" className={`${S} ds-ui-icon__stroke--soft`} />
      <path d="M3.5 3.5v6.5A2.5 2.5 0 006 12.5h6.5" className={S} />
    </>,
  )
}

export function IconOpacity(props: IconProps) {
  return icon(
    props,
    <>
      <circle cx="8" cy="8" r="5.25" className={S} />
      <path d="M8 2.75a5.25 5.25 0 010 10.5z" className={F} />
    </>,
  )
}

export function IconBlur(props: IconProps) {
  return icon(
    props,
    <>
      <circle cx="8" cy="8" r="2.5" className={S} />
      <path d="M8 2.75v1.75M8 11.5v1.75M2.75 8h1.75M11.5 8h1.75" className={S} />
      <path d="M4.15 4.15l1.25 1.25M10.6 10.6l1.25 1.25M10.6 5.4l1.25-1.25M4.15 11.85l1.25-1.25" className={S} />
    </>,
  )
}

export function IconShadow(props: IconProps) {
  return icon(
    props,
    <>
      <circle cx="6.75" cy="6.75" r="3.75" className={S} />
      <path d="M10.5 7.75a3.75 3.75 0 11-2.75 6" className="ds-ui-icon__stroke ds-ui-icon__stroke--soft" />
    </>,
  )
}

export function IconStack(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="4.5" y="3" width="8" height="8" rx="1" className={S} />
      <rect x="3" y="5" width="8" height="8" rx="1" className={S} />
    </>,
  )
}

export function IconButton(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="2.75" y="5" width="10.5" height="6" rx="1.5" className={S} />
      <path d="M8.5 9.5 11.5 13" className={S} />
      <circle cx="8.5" cy="9.5" r="0.85" className={FS} />
    </>,
  )
}

export function IconInput(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="2.75" y="5" width="10.5" height="6" rx="1.25" className={S} />
      <path d="M5.5 7v2" className={S} />
    </>,
  )
}

export function IconCard(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="3" y="3.5" width="10" height="9" rx="1.25" className={S} />
    </>,
  )
}

export function IconBadge(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M8 2.75 9.4 5.1 12.1 5.4 10.2 7.35 10.75 10 8 8.7 5.25 10 5.8 7.35 3.9 5.4 6.6 5.1z" className={S} />
      <path d="M5.75 11.25 8 13.25l2.25-2" className={S} />
    </>,
  )
}

export type { IconProps }
