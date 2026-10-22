import type { CSSProperties } from 'react'
import type { TokenChannel } from './digital-css'
import { previewForBinding, tokenByPath, type InspectTokenOption } from './token-catalog'
import {
  clipPathFromPolygonPoints,
  parseClipPolygonPoints,
} from './clip-polygon'
import { clipPathFromPathD } from './clip-path-d'

/**
 * Local mirror of zaoly-ui `clipPathFromCornerInsets` so Coolify builds work
 * against the pinned ZAOLY_UI_SOURCE that may predate the DS helper export.
 * Keep in sync with `packages/ui/src/lib/clip-path-from-corner-insets.ts`.
 */

export type CornerInsetAxes = {
  x?: string
  y?: string
}

export type CornerInsets = {
  topLeft?: CornerInsetAxes
  topRight?: CornerInsetAxes
  bottomRight?: CornerInsetAxes
  bottomLeft?: CornerInsetAxes
}

const ZERO = /^(0|0px|0rem|0em|0%)$/i

function axisValue(raw: string | undefined): string | null {
  if (raw == null) return null
  const v = raw.trim()
  if (!v || ZERO.test(v)) return null
  return v
}

function isActive(insets: CornerInsets | undefined | null): boolean {
  if (!insets) return false
  for (const corner of [
    insets.topLeft,
    insets.topRight,
    insets.bottomRight,
    insets.bottomLeft,
  ]) {
    if (!corner) continue
    if (axisValue(corner.x) || axisValue(corner.y)) return true
  }
  return false
}

export function clipPathFromCornerInsets(
  insets: CornerInsets | undefined | null,
): string | undefined {
  if (!isActive(insets)) return undefined

  const tlX = axisValue(insets!.topLeft?.x) ?? '0'
  const tlY = axisValue(insets!.topLeft?.y) ?? '0'
  const trX = axisValue(insets!.topRight?.x) ?? '0'
  const trY = axisValue(insets!.topRight?.y) ?? '0'
  const brX = axisValue(insets!.bottomRight?.x) ?? '0'
  const brY = axisValue(insets!.bottomRight?.y) ?? '0'
  const blX = axisValue(insets!.bottomLeft?.x) ?? '0'
  const blY = axisValue(insets!.bottomLeft?.y) ?? '0'

  const tl = `${tlX === '0' ? '0' : tlX} ${tlY === '0' ? '0' : tlY}`
  const tr =
    trX === '0' && trY === '0'
      ? '100% 0'
      : `${trX === '0' ? '100%' : `calc(100% - ${trX})`} ${trY === '0' ? '0' : trY}`
  const br =
    brX === '0' && brY === '0'
      ? '100% 100%'
      : `${brX === '0' ? '100%' : `calc(100% - ${brX})`} ${brY === '0' ? '100%' : `calc(100% - ${brY})`}`
  const bl =
    blX === '0' && blY === '0'
      ? '0 100%'
      : `${blX === '0' ? '0' : blX} ${blY === '0' ? '100%' : `calc(100% - ${blY})`}`

  return `polygon(${tl}, ${tr}, ${br}, ${bl})`
}

/** Flat scene props for Phase A corner-inset clip (surface-clip-slant.md). */
export const CLIP_INSET_PROP_KEYS = [
  'clipInsetTopLeftX',
  'clipInsetTopLeftY',
  'clipInsetTopRightX',
  'clipInsetTopRightY',
  'clipInsetBottomRightX',
  'clipInsetBottomRightY',
  'clipInsetBottomLeftX',
  'clipInsetBottomLeftY',
] as const

export type ClipInsetPropKey = (typeof CLIP_INSET_PROP_KEYS)[number]

function cssFromUnknown(value: unknown): string | undefined {
  if (value == null || value === '') return undefined
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'boolean') return undefined
  const text = String(value).trim()
  return text || undefined
}

function resolveInsetAxis(
  key: ClipInsetPropKey,
  props?: Record<string, unknown> | null,
  tokenBindings?: Record<string, string> | null,
  catalog?: InspectTokenOption[],
  channel: TokenChannel = 'digital',
): string | undefined {
  const path = tokenBindings?.[key]
  if (typeof path === 'string' && path) {
    const token = tokenByPath(path, catalog)
    if (token) {
      const preview = previewForBinding(token, key, channel)
      if (preview != null && preview !== '') return preview
    }
  }
  return cssFromUnknown(props?.[key])
}

/** Build CornerInsets from scene props + bindings (literals win over empty binding). */
export function cornerInsetsFromSceneProps(
  props?: Record<string, unknown> | null,
  tokenBindings?: Record<string, string> | null,
  catalog?: InspectTokenOption[],
  channel: TokenChannel = 'digital',
): CornerInsets {
  const axis = (key: ClipInsetPropKey) =>
    resolveInsetAxis(key, props, tokenBindings, catalog, channel)

  return {
    topLeft: { x: axis('clipInsetTopLeftX'), y: axis('clipInsetTopLeftY') },
    topRight: { x: axis('clipInsetTopRightX'), y: axis('clipInsetTopRightY') },
    bottomRight: { x: axis('clipInsetBottomRightX'), y: axis('clipInsetBottomRightY') },
    bottomLeft: { x: axis('clipInsetBottomLeftX'), y: axis('clipInsetBottomLeftY') },
  }
}

/** CSS `clip-path` path / polygon / insets or undefined when inactive (CL2–CL3, CL19, CL28). */
export function resolveClipPathFromSceneProps(
  props?: Record<string, unknown> | null,
  tokenBindings?: Record<string, string> | null,
  catalog?: InspectTokenOption[],
  channel: TokenChannel = 'digital',
): string | undefined {
  const fromPath = clipPathFromPathD(props?.clipPathD)
  if (fromPath) return fromPath
  const fromPolygon = clipPathFromPolygonPoints(
    parseClipPolygonPoints(props?.clipPolygon),
  )
  if (fromPolygon) return fromPolygon
  return clipPathFromCornerInsets(
    cornerInsetsFromSceneProps(props, tokenBindings, catalog, channel),
  )
}

/** Empty string clears every clipInset* axis (CL19 when writing clipPolygon). */
export function clearedClipInsetPropMap(): Record<string, string> {
  return Object.fromEntries(CLIP_INSET_PROP_KEYS.map((key) => [key, ''])) as Record<
    string,
    string
  >
}

/** Merge clip-path onto a paint style object when insets are active. */
export function applyClipPathToStyle(
  style: CSSProperties,
  props?: Record<string, unknown> | null,
  tokenBindings?: Record<string, string> | null,
  catalog?: InspectTokenOption[],
  channel: TokenChannel = 'digital',
): CSSProperties {
  const clipPath = resolveClipPathFromSceneProps(props, tokenBindings, catalog, channel)
  if (!clipPath) return style
  return { ...style, clipPath }
}
