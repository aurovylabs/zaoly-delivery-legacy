import type { CSSProperties } from 'react'
import type { SceneNode } from '@zaoly/contracts'
import { resolveNodePaintStyle } from '../inspect/resolve-bindings'
import type { InspectTokenOption } from '../inspect/token-catalog'
import { cssLengthToPx } from '../scene/resize'
import type { Bounds } from '../scene/selection'
import { MEDIA_PAINT_SELECTOR, resolveMediaPaintElement } from './media-node-host-style'

export type BoxSidesPx = {
  top: number
  right: number
  bottom: number
  left: number
}

export type BoxModelBand = {
  id: string
  kind: 'padding' | 'margin'
  side: 'top' | 'right' | 'bottom' | 'left'
  left: number
  top: number
  width: number
  height: number
}

function lengthPx(value: unknown): number {
  if (value == null || value === '') return 0
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value
  const raw = String(value).trim()
  // Multi-value shorthands ("16px 0") must not be parseFloat'd as a single px length.
  if (!raw || raw === 'auto' || /\s/.test(raw)) return 0
  const n = cssLengthToPx(raw)
  if (n == null || !Number.isFinite(n) || n <= 0) return 0
  return n
}

function readComputedSide(cs: CSSStyleDeclaration, prefix: 'padding' | 'margin', side: string): number {
  const n = Number.parseFloat(cs.getPropertyValue(`${prefix}-${side}`))
  return Number.isFinite(n) && n > 0 ? n : 0
}

/**
 * Layout CSS px from the painted element (post-cascade). Prefer this over paint-props
 * for SiteImage/SiteSvg where spacing lives on the replaced child, not the selection host.
 */
export function readComputedSpacingSides(el: Element | null | undefined): {
  padding: BoxSidesPx
  margin: BoxSidesPx
} | null {
  if (!(el instanceof HTMLElement)) return null
  const cs = getComputedStyle(el)
  return {
    padding: {
      top: readComputedSide(cs, 'padding', 'top'),
      right: readComputedSide(cs, 'padding', 'right'),
      bottom: readComputedSide(cs, 'padding', 'bottom'),
      left: readComputedSide(cs, 'padding', 'left'),
    },
    margin: {
      top: readComputedSide(cs, 'margin', 'top'),
      right: readComputedSide(cs, 'margin', 'right'),
      bottom: readComputedSide(cs, 'margin', 'bottom'),
      left: readComputedSide(cs, 'margin', 'left'),
    },
  }
}

/**
 * Screen-px scale for a transformed node: getBoundingClientRect / offsetWidth.
 * Prefer this over the zoom prop so spacing bands track the live render scale.
 */
export function elementScreenScale(el: HTMLElement, fallbackZoom: number): number {
  const layoutW = el.offsetWidth
  if (!(layoutW > 0)) {
    return Number.isFinite(fallbackZoom) && fallbackZoom > 0 ? fallbackZoom : 1
  }
  const screenW = el.getBoundingClientRect().width
  if (!(screenW > 0)) {
    return Number.isFinite(fallbackZoom) && fallbackZoom > 0 ? fallbackZoom : 1
  }
  return screenW / layoutW
}

/**
 * Selection host, or the paint target inside it for paintOnSelf shells.
 * Site Kit puts pad/margin on the inner shell (`.site-text`, `.site-stack`, …);
 * the host is selection chrome only — measuring it yields zero sides.
 */
export function resolveSpacingPaintElement(
  root: ParentNode | null | undefined,
  nodeId: string,
): HTMLElement | null {
  if (!root) return null
  const host = root.querySelector(`[data-node-id="${CSS.escape(nodeId)}"]`)
  if (!(host instanceof HTMLElement)) return null
  const media = resolveMediaPaintElement(host) ?? host.querySelector(MEDIA_PAINT_SELECTOR)
  if (media instanceof HTMLElement) return media
  const child = host.firstElementChild
  if (child instanceof HTMLElement && !child.hasAttribute('data-node-id')) {
    return child
  }
  return host
}

export function resolveSpacingHostElement(
  root: ParentNode | null | undefined,
  nodeId: string,
): HTMLElement | null {
  if (!root) return null
  const host = root.querySelector(`[data-node-id="${CSS.escape(nodeId)}"]`)
  return host instanceof HTMLElement ? host : null
}

function layoutPx(cs: CSSStyleDeclaration, prop: string): number {
  const n = Number.parseFloat(cs.getPropertyValue(prop))
  return Number.isFinite(n) && n > 0 ? n : 0
}

export type OverlaySpacingMeasure = {
  padding: BoxSidesPx
  margin: BoxSidesPx
  /** Paint/host border box in viewport overlay coordinates — bands MUST use this. */
  borderBox: Bounds
}

/**
 * Live overlay spacing in viewport-relative screen px.
 *
 * Always anchors to the **paint border box** (not an inflated media host). Flex-item
 * hosts are BFCs, so child margin lives *inside* the host — measuring host→content
 * as "padding" double-counted margin (green inside + orange outside over the board).
 *
 * Padding / margin come from computed style on the paint element (DevTools-like).
 */
export function measureOverlaySpacing(
  viewport: HTMLElement,
  nodeId: string,
  _selectionBounds: Bounds,
  fallbackZoom: number,
): OverlaySpacingMeasure | null {
  const paint = resolveSpacingPaintElement(viewport, nodeId)
  if (!paint) return null

  const vr = viewport.getBoundingClientRect()
  const paintBr = paint.getBoundingClientRect()
  const scale = elementScreenScale(paint, fallbackZoom)
  const cs = getComputedStyle(paint)

  const borderBox: Bounds = {
    left: paintBr.left - vr.left,
    top: paintBr.top - vr.top,
    width: Math.max(0, paintBr.width),
    height: Math.max(0, paintBr.height),
  }

  const padding: BoxSidesPx = {
    top: layoutPx(cs, 'padding-top') * scale,
    right: layoutPx(cs, 'padding-right') * scale,
    bottom: layoutPx(cs, 'padding-bottom') * scale,
    left: layoutPx(cs, 'padding-left') * scale,
  }

  const margin: BoxSidesPx = {
    top: layoutPx(cs, 'margin-top') * scale,
    right: layoutPx(cs, 'margin-right') * scale,
    bottom: layoutPx(cs, 'margin-bottom') * scale,
    left: layoutPx(cs, 'margin-left') * scale,
  }

  return { padding, margin, borderBox }
}

/**
 * Expand resolved paint style into physical padding/margin sides (layout CSS px).
 * Longhands win over axes; axes win over uniform.
 */
export function expandSpacingSides(
  style: CSSProperties,
  kind: 'padding' | 'margin',
): BoxSidesPx {
  const uniform = lengthPx(style[kind])
  const block = lengthPx(
    style[`${kind}Block` as keyof CSSProperties] as string | number | undefined,
  )
  const inline = lengthPx(
    style[`${kind}Inline` as keyof CSSProperties] as string | number | undefined,
  )
  const top = lengthPx(style[`${kind}Top` as keyof CSSProperties] as string | number | undefined)
  const right = lengthPx(
    style[`${kind}Right` as keyof CSSProperties] as string | number | undefined,
  )
  const bottom = lengthPx(
    style[`${kind}Bottom` as keyof CSSProperties] as string | number | undefined,
  )
  const left = lengthPx(style[`${kind}Left` as keyof CSSProperties] as string | number | undefined)

  return {
    top: top || block || uniform,
    right: right || inline || uniform,
    bottom: bottom || block || uniform,
    left: left || inline || uniform,
  }
}

export function hasPositiveSides(sides: BoxSidesPx): boolean {
  return sides.top > 0 || sides.right > 0 || sides.bottom > 0 || sides.left > 0
}

export function scaleSides(sides: BoxSidesPx, zoom: number): BoxSidesPx {
  const z = Number.isFinite(zoom) && zoom > 0 ? zoom : 1
  return {
    top: sides.top * z,
    right: sides.right * z,
    bottom: sides.bottom * z,
    left: sides.left * z,
  }
}

export function resolveNodeSpacingSides(
  node: SceneNode,
  catalog?: InspectTokenOption[],
): { padding: BoxSidesPx; margin: BoxSidesPx } {
  const style = resolveNodePaintStyle(
    node.props,
    node.tokenBindings,
    (node.style ?? {}) as CSSProperties,
    catalog,
  )
  return {
    padding: expandSpacingSides(style, 'padding'),
    margin: expandSpacingSides(style, 'margin'),
  }
}

/**
 * Build overlay band rects in selectionBounds / SelectionHandles coordinate space.
 * Padding is clamped to the border box. Margin is never clamped to the box — it sits outside.
 */
export function buildBoxModelBands(
  bounds: Bounds,
  padding: BoxSidesPx,
  margin: BoxSidesPx,
): BoxModelBand[] {
  const bands: BoxModelBand[] = []
  const { left, top, width, height } = bounds

  // Padding must fit inside the border box (geometry-derived values already should).
  const padTop = Math.min(Math.max(0, padding.top), Math.max(0, height))
  const padBottom = Math.min(Math.max(0, padding.bottom), Math.max(0, height - padTop))
  const padLeft = Math.min(Math.max(0, padding.left), Math.max(0, width))
  const padRight = Math.min(Math.max(0, padding.right), Math.max(0, width - padLeft))

  if (padTop > 0) {
    bands.push({
      id: 'padding-top',
      kind: 'padding',
      side: 'top',
      left,
      top,
      width,
      height: padTop,
    })
  }
  if (padBottom > 0) {
    bands.push({
      id: 'padding-bottom',
      kind: 'padding',
      side: 'bottom',
      left,
      top: top + height - padBottom,
      width,
      height: padBottom,
    })
  }
  if (padLeft > 0) {
    bands.push({
      id: 'padding-left',
      kind: 'padding',
      side: 'left',
      left,
      top: top + padTop,
      width: padLeft,
      height: Math.max(0, height - padTop - padBottom),
    })
  }
  if (padRight > 0) {
    bands.push({
      id: 'padding-right',
      kind: 'padding',
      side: 'right',
      left: left + width - padRight,
      top: top + padTop,
      width: padRight,
      height: Math.max(0, height - padTop - padBottom),
    })
  }

  if (margin.top > 0) {
    bands.push({
      id: 'margin-top',
      kind: 'margin',
      side: 'top',
      left: left - margin.left,
      top: top - margin.top,
      width: width + margin.left + margin.right,
      height: margin.top,
    })
  }
  if (margin.bottom > 0) {
    bands.push({
      id: 'margin-bottom',
      kind: 'margin',
      side: 'bottom',
      left: left - margin.left,
      top: top + height,
      width: width + margin.left + margin.right,
      height: margin.bottom,
    })
  }
  if (margin.left > 0) {
    bands.push({
      id: 'margin-left',
      kind: 'margin',
      side: 'left',
      left: left - margin.left,
      top,
      width: margin.left,
      height,
    })
  }
  if (margin.right > 0) {
    bands.push({
      id: 'margin-right',
      kind: 'margin',
      side: 'right',
      left: left + width,
      top,
      width: margin.right,
      height,
    })
  }

  return bands.filter((b) => b.width > 0 && b.height > 0)
}
