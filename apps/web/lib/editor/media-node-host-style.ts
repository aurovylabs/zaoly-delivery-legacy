import type { CSSProperties } from 'react'

/** Site Kit media shells that paint size on the replaced element (`paintOnSelf`). */
const MEDIA_PAINT_TYPES = new Set(['SiteImage', 'SiteSvg'])

/** Replaced paint target inside a media selection host. */
export const MEDIA_PAINT_SELECTOR = 'img.site-img, .site-svg, svg.site-shape'

export function isMediaPaintNodeType(type: string | null | undefined): boolean {
  return Boolean(type && MEDIA_PAINT_TYPES.has(type))
}

/**
 * Paint border-box target for SiteImage/SiteSvg selection chrome.
 * Flex-item hosts are BFCs, so child margin inflates the host — measuring the host
 * would put margin *inside* the blue box and double-draw it outside as orange.
 */
export function resolveMediaPaintElement(host: HTMLElement): HTMLElement | null {
  if (!isMediaPaintNodeType(host.getAttribute('data-node-type'))) return null
  const media = host.querySelector(MEDIA_PAINT_SELECTOR)
  return media instanceof HTMLElement ? media : null
}

/** True when inspect size is Fill (stretch across the stack cross-axis). */
export function isFillSize(width: unknown): boolean {
  if (width == null || width === '') return false
  const v = String(width).trim().toLowerCase()
  return v === '100%' || v === 'fill'
}

/**
 * Selection-chrome host style for SiteImage/SiteSvg.
 * Unset / hug → max-content so flex stretch does not inflate the layout box to artboard width.
 * Explicit Fill (`100%`) → keep stretch/full width.
 */
export function mediaNodeHostStyle(
  nodeType: string,
  width: unknown,
): CSSProperties | undefined {
  if (!isMediaPaintNodeType(nodeType)) return undefined
  if (isFillSize(width)) {
    return { width: '100%', maxWidth: '100%', alignSelf: 'stretch' }
  }
  return {
    width: 'max-content',
    maxWidth: '100%',
    alignSelf: 'flex-start',
  }
}
