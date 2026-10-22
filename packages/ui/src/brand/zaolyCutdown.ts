/**
 * Zaoly CornerBox cutdown geometry — ported from ECHON V3 / zaoly-design-system.
 */

export type CornerStyle = 'rounded' | 'square' | 'cutdown-a' | 'cutdown-b'
export type CutdownVariant = 'a' | 'b'
export type CornerKey = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'

/** Default cutdown radius for BrandCorner + ShellCorners (AppFrame). */
export const ZAOLY_SHELL_CORNER_RADIUS = 24

export interface CornerPatchDef {
  position: (size: number) => {
    top?: number
    right?: number
    bottom?: number
    left?: number
  }
  maskCircle: string
}

export const CUTDOWN_DEFS: Record<
  CornerKey,
  { a: CornerPatchDef; b: CornerPatchDef }
> = {
  topLeft: {
    a: { position: (s) => ({ top: 0, left: -s }), maskCircle: '0% 100%' },
    b: { position: (s) => ({ top: -s, left: 0 }), maskCircle: '100% 0%' },
  },
  topRight: {
    a: { position: (s) => ({ top: 0, right: -s }), maskCircle: '100% 100%' },
    b: { position: (s) => ({ top: -s, right: 0 }), maskCircle: '0% 0%' },
  },
  bottomLeft: {
    a: { position: (s) => ({ bottom: 0, left: -s }), maskCircle: '0% 0%' },
    b: { position: (s) => ({ bottom: -s, left: 0 }), maskCircle: '100% 100%' },
  },
  bottomRight: {
    a: { position: (s) => ({ bottom: 0, right: -s }), maskCircle: '100% 0%' },
    b: { position: (s) => ({ bottom: -s, right: 0 }), maskCircle: '0% 100%' },
  },
}

export function isCutdown(style: CornerStyle): style is 'cutdown-a' | 'cutdown-b' {
  return style === 'cutdown-a' || style === 'cutdown-b'
}

export function getCutdownVariant(style: 'cutdown-a' | 'cutdown-b'): CutdownVariant {
  return style === 'cutdown-a' ? 'a' : 'b'
}

export function getRadius(style: CornerStyle, borderRadius: number): number {
  return style === 'rounded' ? borderRadius : 0
}

export function cutdownMaskImage(maskCircle: string, sizePx: number): string {
  return `radial-gradient(circle at ${maskCircle}, transparent 0, transparent ${sizePx}px, white ${sizePx}px)`
}

export const TOP_RIGHT_BRAND_CORNERS = {
  topLeft: 'cutdown-a',
  topRight: 'square',
  bottomLeft: 'rounded',
  bottomRight: 'cutdown-b',
} as const satisfies Record<CornerKey, CornerStyle>

/** Flush top-left back plaque — mirror of BrandCorner (scoop into the page). */
export const TOP_LEFT_BACK_CORNERS = {
  topLeft: 'square',
  topRight: 'cutdown-a',
  bottomLeft: 'cutdown-b',
  bottomRight: 'rounded',
} as const satisfies Record<CornerKey, CornerStyle>

/** Flush top-left — scoop along the top edge into the page. */
export const TOP_LEFT_SHELL_CORNERS = {
  topLeft: 'square',
  topRight: 'cutdown-a',
  bottomLeft: 'square',
  bottomRight: 'square',
} as const satisfies Record<CornerKey, CornerStyle>

/** Flush bottom-left — scoop along the bottom edge into the page. */
export const BOTTOM_LEFT_SHELL_CORNERS = {
  topLeft: 'square',
  topRight: 'square',
  bottomLeft: 'square',
  bottomRight: 'cutdown-a',
} as const satisfies Record<CornerKey, CornerStyle>

/** Flush bottom-right — scoop along the bottom edge into the page (TR is BrandCorner). */
export const BOTTOM_RIGHT_SHELL_CORNERS = {
  topLeft: 'square',
  topRight: 'square',
  bottomLeft: 'cutdown-a',
  bottomRight: 'square',
} as const satisfies Record<CornerKey, CornerStyle>
