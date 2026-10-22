/**
 * Wave 5 custom UI icons — platform gaps + CREATION Lucide replacements.
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

export function IconChevronLeft(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M10 4.25 6.25 8 10 11.75" className={S} />
    </>,
  )
}

export function IconPanelRight(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="2.75" y="3.25" width="10.5" height="9.5" rx="1.25" className={S} />
      <path d="M9.75 3.25v9.5" className={S} />
      <rect x="10.5" y="4.5" width="2" height="7" rx="0.4" className={F} />
    </>,
  )
}

export function IconGripVertical(props: IconProps) {
  return icon(
    props,
    <>
      <circle cx="6" cy="4" r="1" className={FS} />
      <circle cx="10" cy="4" r="1" className={FS} />
      <circle cx="6" cy="8" r="1" className={FS} />
      <circle cx="10" cy="8" r="1" className={FS} />
      <circle cx="6" cy="12" r="1" className={FS} />
      <circle cx="10" cy="12" r="1" className={FS} />
    </>,
  )
}

export function IconPin(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M8 13.5V10.5" className={S} />
      <path d="M5.5 3.5h5l-.75 3.25H11.5l-1.25 3.75H5.75L4.5 6.75h1.75z" className={S} />
    </>,
  )
}

export function IconStar(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M8 2.75 9.4 6.1 13 6.55 10.4 9.05 11.1 12.6 8 10.85 4.9 12.6 5.6 9.05 3 6.55 6.6 6.1z" className={S} />
    </>,
  )
}

export function IconBookmark(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M4.5 3.25h7v10.5L8 11.5 4.5 13.75z" className={S} />
    </>,
  )
}

export function IconList(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M6.5 4.5h6.5M6.5 8h6.5M6.5 11.5h6.5" className={S} />
      <circle cx="4" cy="4.5" r="0.85" className={FS} />
      <circle cx="4" cy="8" r="0.85" className={FS} />
      <circle cx="4" cy="11.5" r="0.85" className={FS} />
    </>,
  )
}

export function IconTable(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="2.75" y="3.25" width="10.5" height="9.5" rx="1.1" className={S} />
      <path d="M2.75 6.5h10.5M2.75 9.75h10.5M8 6.5v6.25" className={S} />
    </>,
  )
}

export function IconCalendar(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="2.75" y="4" width="10.5" height="9.25" rx="1.25" className={S} />
      <path d="M2.75 7h10.5M5.5 2.75v2.5M10.5 2.75v2.5" className={S} />
    </>,
  )
}

export function IconBell(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M5 11.5V7.5a3 3 0 016 0v4l1.25 1.75H3.75z" className={S} />
      <path d="M6.75 13.25a1.25 1.25 0 002.5 0" className={S} />
    </>,
  )
}

export function IconFile(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M4.5 2.75h5L11.5 5v8.25H4.5z" className={S} />
      <path d="M9.5 2.75V5h2" className={S} />
    </>,
  )
}

export function IconFileText(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M4.5 2.75h5L11.5 5v8.25H4.5z" className={S} />
      <path d="M9.5 2.75V5h2M6 8h4M6 10.25h3" className={S} />
    </>,
  )
}

export function IconFolder(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M2.75 5.5h4l1.25 1.5h5.25v6.25H2.75z" className={S} />
      <path d="M2.75 5.5V4.25h3.5L7.5 5.5" className={S} />
    </>,
  )
}

export function IconFolderOpen(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M2.75 6h4l1 1.25H13v2.25" className={S} />
      <path d="M3 13.25 4.5 8.5h8.75l-1.4 4.75z" className={S} />
    </>,
  )
}

export function IconFolderPlus(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M2.75 5.5h4l1.25 1.5H10.5v2" className={S} />
      <path d="M2.75 5.5V4.25h3.5L7.5 5.5" className={S} />
      <path d="M2.75 7v6.25h5.5" className={S} />
      <path d="M11.5 9.5v4M9.5 11.5h4" className={S} />
    </>,
  )
}

export function IconPaperclip(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M9.5 5.5v5.25a2.75 2.75 0 11-5.5 0V4.75a1.75 1.75 0 113.5 0v5.5a.75.75 0 11-1.5 0V6" className={S} />
    </>,
  )
}

export function IconPlay(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M5 3.75v8.5L12.5 8z" className={S} />
    </>,
  )
}

export function IconPause(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="4.25" y="3.75" width="2.5" height="8.5" rx="0.5" className={S} />
      <rect x="9.25" y="3.75" width="2.5" height="8.5" rx="0.5" className={S} />
    </>,
  )
}

export function IconScissors(props: IconProps) {
  return icon(
    props,
    <>
      <circle cx="4.75" cy="4.75" r="1.75" className={S} />
      <circle cx="4.75" cy="11.25" r="1.75" className={S} />
      <path d="M6 5.75 13 12.5M6 10.25 13 3.5" className={S} />
    </>,
  )
}

export function IconCrop(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M5 2.75V11h8.25" className={S} />
      <path d="M11 13.25V5H2.75" className={S} />
      <path d="M5 11h6V5" className={S} />
    </>,
  )
}

export function IconHand(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M7 8.5V4.5a1 1 0 012 0V8" className={S} />
      <path d="M9 8V3.75a1 1 0 012 0V8" className={S} />
      <path d="M11 8.25V5a1 1 0 012 0v5.25a3.25 3.25 0 01-3.25 3.25H8.5A3.25 3.25 0 015.25 10V7.25a1 1 0 012 0V8.5" className={S} />
    </>,
  )
}

export function IconMessage(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.25 3.75h9.5v7.5H7.25L4 13.5V11.25H3.25z" className={S} />
    </>,
  )
}

export function IconCode(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M5.5 5.25 2.75 8 5.5 10.75" className={S} />
      <path d="M10.5 5.25 13.25 8 10.5 10.75" className={S} />
      <path d="M9 3.75 7 12.25" className={S} />
    </>,
  )
}

export function IconImport(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M8 3.25v6.5M5.5 7.25 8 9.75 10.5 7.25" className={S} />
      <path d="M3.5 11.5v1.25h9V11.5" className={S} />
    </>,
  )
}

export function IconScanSearch(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.25 5.5V3.25H5.5M10.5 3.25h2.25V5.5M3.25 10.5v2.25H5.5M12.75 10.5v2.25H10.5" className={S} />
      <circle cx="7.5" cy="7.5" r="2.25" className={S} />
      <path d="M9.25 9.25 11.5 11.5" className={S} />
    </>,
  )
}

export function IconGroup(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="3" y="3" width="5.5" height="5.5" rx="0.9" className={S} />
      <rect x="7.5" y="7.5" width="5.5" height="5.5" rx="0.9" className={S} />
    </>,
  )
}

export function IconUngroup(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="2.75" y="2.75" width="4.75" height="4.75" rx="0.8" className={S} />
      <rect x="8.5" y="8.5" width="4.75" height="4.75" rx="0.8" className={S} />
      <path d="M8 5.5h2.5M10.5 5.5V8" className="ds-ui-icon__stroke ds-ui-icon__stroke--soft" />
    </>,
  )
}

export function IconDiamond(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M8 2.75 13.25 8 8 13.25 2.75 8z" className={S} />
    </>,
  )
}

export function IconCornerDownRight(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M4 3.5v6.5h7.5" className={S} />
      <path d="M9 7.5 11.5 10 9 12.5" className={S} />
    </>,
  )
}

export function IconBringToFront(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M8 12.5V4.5M5.75 6.75 8 4.5 10.25 6.75" className={S} />
      <path d="M3.5 13h9" className={S} />
    </>,
  )
}

export function IconSendToBack(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M8 3.5v8M5.75 9.25 8 11.5 10.25 9.25" className={S} />
      <path d="M3.5 13h9" className={S} />
    </>,
  )
}

export function IconLogOut(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M7 3.5H4.25v9H7" className={S} />
      <path d="M9 8h5.25M11.75 5.5 14.25 8 11.75 10.5" className={S} />
    </>,
  )
}

export function IconKey(props: IconProps) {
  return icon(
    props,
    <>
      <circle cx="5.75" cy="10" r="2.5" className={S} />
      <path d="M7.75 8.5 13.25 3M11.25 3.5 13 5.25" className={S} />
    </>,
  )
}

export function IconShield(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M8 2.75 12.75 4.5v4.25c0 3.25-2.1 5.5-4.75 6.5-2.65-1-4.75-3.25-4.75-6.5V4.5z" className={S} />
    </>,
  )
}

export function IconBuilding(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.5 13.25V4.5h6.5v8.75" className={S} />
      <path d="M10 7h2.5v6.25" className={S} />
      <path d="M5.25 6.5h1.25M5.25 8.75h1.25M5.25 11h1.25" className={S} />
    </>,
  )
}

export function IconGlobe(props: IconProps) {
  return icon(
    props,
    <>
      <circle cx="8" cy="8" r="5.25" className={S} />
      <path d="M2.75 8h10.5M8 2.75c1.75 1.75 2.75 3.5 2.75 5.25S9.75 11.5 8 13.25C6.25 11.5 5.25 9.75 5.25 8S6.25 4.5 8 2.75z" className={S} />
    </>,
  )
}

export function IconLoader(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M8 2.75v2.75M8 10.5v2.75M2.75 8h2.75M10.5 8h2.75" className={S} />
      <path d="M4.15 4.15l1.95 1.95M9.9 9.9l1.95 1.95M9.9 6.1l1.95-1.95M4.15 11.85l1.95-1.95" className="ds-ui-icon__stroke ds-ui-icon__stroke--soft" />
    </>,
  )
}

export type { IconProps }
