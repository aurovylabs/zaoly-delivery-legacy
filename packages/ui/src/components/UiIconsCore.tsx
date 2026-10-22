/**
 * Wave 1 custom UI icons — Lucide-free geometry in shared glyph stroke language.
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

export function IconPlus(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M8 3.25v9.5M3.25 8h9.5" className={S} />
    </>,
  )
}

export function IconMoreHorizontal(props: IconProps) {
  return icon(
    props,
    <>
      <circle cx="4" cy="8" r="1.15" className={FS} />
      <circle cx="8" cy="8" r="1.15" className={FS} />
      <circle cx="12" cy="8" r="1.15" className={FS} />
    </>,
  )
}

export function IconMoreVertical(props: IconProps) {
  return icon(
    props,
    <>
      <circle cx="8" cy="4" r="1.15" className={FS} />
      <circle cx="8" cy="8" r="1.15" className={FS} />
      <circle cx="8" cy="12" r="1.15" className={FS} />
    </>,
  )
}

export function IconSettings(props: IconProps) {
  return icon(
    props,
    <>
      <circle cx="8" cy="8" r="2.1" className={S} />
      <path
        d="M8 2.4l.55 1.55.35.1 1.45-.7 1.1 1.1-.7 1.45.1.35L12.4 8l-1.55.55-.1.35.7 1.45-1.1 1.1-1.45-.7-.35.1L8 13.6l-.55-1.55-.35-.1-1.45.7-1.1-1.1.7-1.45-.1-.35L3.6 8l1.55-.55.1-.35-.7-1.45 1.1-1.1 1.45.7.35-.1z"
        className={S}
      />
    </>,
  )
}

export function IconSliders(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.5 5h9" className={S} />
      <path d="M3.5 8h9" className={S} />
      <path d="M3.5 11h9" className={S} />
      <circle cx="6" cy="5" r="1.35" className={FS} />
      <circle cx="10.5" cy="8" r="1.35" className={FS} />
      <circle cx="7.5" cy="11" r="1.35" className={FS} />
    </>,
  )
}

export function IconCopy(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="5.5" y="5.5" width="7.5" height="7.5" rx="1.25" className={S} />
      <path d="M4.25 10.5V4.25A1 1 0 015.25 3.25H10.5" className={S} />
    </>,
  )
}

export function IconClipboard(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="3.75" y="4.5" width="8.5" height="9.25" rx="1.25" className={S} />
      <rect x="5.5" y="2.5" width="5" height="2.5" rx="0.75" className={S} />
    </>,
  )
}

export function IconDownload(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M8 3.25v7.25M5.25 8.25 8 11l2.75-2.75" className={S} />
      <path d="M3.5 12.75h9" className={S} />
    </>,
  )
}

export function IconUpload(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M8 12.75V5.5M5.25 7.75 8 5l2.75 2.75" className={S} />
      <path d="M3.5 12.75h9" className={S} />
    </>,
  )
}

export function IconExternalLink(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M9.5 3.25H12.75V6.5" className={S} />
      <path d="M7.5 8.5 12.75 3.25" className={S} />
      <path d="M11 9.25v3.5A.75.75 0 0110.25 13.5H3.75A.75.75 0 013 12.75V6.25A.75.75 0 013.75 5.5H7.25" className={S} />
    </>,
  )
}

export function IconLayers(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M8 2.75 13.25 5.5 8 8.25 2.75 5.5z" className={S} />
      <path d="M2.75 8.25 8 11l5.25-2.75" className={S} />
      <path d="M2.75 10.75 8 13.5l5.25-2.75" className={S} />
    </>,
  )
}

export function IconRefresh(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M12.5 8a4.5 4.5 0 11-1.2-3" className={S} />
      <path d="M12.5 3.25V6.5H9.25" className={S} />
    </>,
  )
}

export function IconFilter(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3 4.25h10l-3.5 4.1v4.4L6.5 14.5V8.35z" className={S} />
    </>,
  )
}

export function IconHome(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M2.75 7.5 8 3.25l5.25 4.25" className={S} />
      <path d="M4.25 6.75V13.25h7.5V6.75" className={S} />
      <path d="M6.75 13.25V9.5h2.5v3.75" className={S} />
    </>,
  )
}

export function IconMenu(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.25 4.75h9.5M3.25 8h9.5M3.25 11.25h9.5" className={S} />
    </>,
  )
}

export function IconPanelLeft(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="2.75" y="3.25" width="10.5" height="9.5" rx="1.25" className={S} />
      <path d="M6.25 3.25v9.5" className={S} />
      <rect x="3.5" y="4.5" width="2" height="7" rx="0.4" className={F} />
    </>,
  )
}

export function IconResearch(props: IconProps) {
  return icon(
    props,
    <>
      <circle cx="7" cy="7" r="3.75" className={S} />
      <path d="M10 10.25 13.25 13.5" className={S} />
    </>,
  )
}

/** Alias — same geometry as IconResearch. */
export function IconSearch(props: IconProps) {
  return <IconResearch {...props} />
}

export function IconCheck(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.5 8.25 6.5 11.25 12.5 4.75" className={S} />
    </>,
  )
}

export function IconClose(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M4 4l8 8M12 4l-8 8" className={S} />
    </>,
  )
}

export function IconChevronUp(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M4.25 10 8 6.25 11.75 10" className={S} />
    </>,
  )
}

export function IconChevronDown(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M4.25 6 8 9.75 11.75 6" className={S} />
    </>,
  )
}

export function IconChevronRight(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M6 4.25 9.75 8 6 11.75" className={S} />
    </>,
  )
}

export function IconEdit(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M9.25 3.75 12.25 6.75" className={S} />
      <path d="M3.5 12.5l.75-3.25L10.5 3l3 3-6.25 6.25z" className={S} />
      <path d="M3.5 12.5h3" className={S} />
    </>,
  )
}

export function IconTrash(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M3.5 5h9" className={S} />
      <path d="M6 5V3.75h4V5" className={S} />
      <path d="M4.75 5l.5 8.25h5.5L11.25 5" className={S} />
      <path d="M7 7.25v4M9 7.25v4" className={S} />
    </>,
  )
}

export function IconEye(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M2.5 8s2.25-4.25 5.5-4.25S13.5 8 13.5 8s-2.25 4.25-5.5 4.25S2.5 8 2.5 8z" className={S} />
      <circle cx="8" cy="8" r="1.75" className={S} />
    </>,
  )
}

export function IconEyeOff(props: IconProps) {
  return icon(
    props,
    <>
      <path d="M2.5 8s2.25-4.25 5.5-4.25c1.1 0 2.1.4 2.95 1" className={S} />
      <path d="M13.5 8s-2.25 4.25-5.5 4.25c-1.1 0-2.1-.4-2.95-1" className={S} />
      <path d="M6.5 9.5a1.75 1.75 0 012.4-2.4" className={S} />
      <path d="M3 3l10 10" className={S} />
    </>,
  )
}

export function IconLock(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="3.75" y="7.25" width="8.5" height="6" rx="1.25" className={S} />
      <path d="M5.75 7.25V5.5a2.25 2.25 0 014.5 0v1.75" className={S} />
    </>,
  )
}

export function IconUnlock(props: IconProps) {
  return icon(
    props,
    <>
      <rect x="3.75" y="7.25" width="8.5" height="6" rx="1.25" className={S} />
      <path d="M5.75 7.25V5.25a2.25 2.25 0 014.35-.85" className={S} />
    </>,
  )
}

export type { IconProps }
