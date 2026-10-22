/**
 * Lucide-adjacent 16px kind metaphors for Token Studio filters / empty rows.
 * Value previews stay on `TokenPreview`; this is the type glyph without a resolved value.
 */

import type { ReactNode } from 'react'

const VIEW = 16

function Track({ children, size = VIEW }: { children: ReactNode; size?: number }) {
  return (
    <svg
      className="ui-icon ds-token-kind-glyph"
      width={size}
      height={size}
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export type TokenKindGlyphId =
  | 'color'
  | 'space'
  | 'radius'
  | 'opacity'
  | 'size'
  | 'type'
  | 'shadow'
  | 'glow'
  | 'effect'
  | 'motion'
  | 'asset'
  | 'all'

export function TokenKindGlyph({
  id,
  size,
}: {
  id: TokenKindGlyphId
  size?: number
}) {
  switch (id) {
    case 'color':
      return (
        <Track size={size}>
          <circle cx="8" cy="8" r="5.5" className="ds-token-kind-glyph__stroke" />
          <circle cx="8" cy="8" r="3.25" className="ds-token-kind-glyph__fill" />
        </Track>
      )
    case 'space':
      return (
        <Track size={size}>
          <rect x="2.5" y="6.5" width="3" height="3" rx="0.6" className="ds-token-kind-glyph__fill" />
          <rect x="10.5" y="6.5" width="3" height="3" rx="0.6" className="ds-token-kind-glyph__fill" />
          <line x1="6" y1="8" x2="10" y2="8" className="ds-token-kind-glyph__accent" />
        </Track>
      )
    case 'radius':
      return (
        <Track size={size}>
          <path
            d="M3.5 11.5 V6.5 Q3.5 3.5 6.5 3.5 H11.5"
            className="ds-token-kind-glyph__stroke"
            fill="none"
          />
          <circle cx="6.5" cy="6.5" r="1.1" className="ds-token-kind-glyph__fill" />
        </Track>
      )
    case 'opacity':
      return (
        <Track size={size}>
          <rect x="3" y="3" width="10" height="10" rx="2" className="ds-token-kind-glyph__stroke" fill="none" />
          <path d="M3 3 H13 V13 H3 Z" className="ds-token-kind-glyph__fill-soft" />
          <path d="M8 3 H13 V13 H8 Z" className="ds-token-kind-glyph__fill" />
        </Track>
      )
    case 'size':
      return (
        <Track size={size}>
          <rect x="4" y="4" width="8" height="8" rx="1.2" className="ds-token-kind-glyph__stroke" fill="none" />
          <rect x="6" y="6" width="4" height="4" rx="0.6" className="ds-token-kind-glyph__fill" />
        </Track>
      )
    case 'type':
      return (
        <Track size={size}>
          <path d="M4 12.5 L8 3.5 L12 12.5" className="ds-token-kind-glyph__stroke" fill="none" />
          <line x1="5.5" y1="9" x2="10.5" y2="9" className="ds-token-kind-glyph__accent" />
        </Track>
      )
    case 'shadow':
      return (
        <Track size={size}>
          <rect x="5" y="5" width="7" height="7" rx="1.2" className="ds-token-kind-glyph__fill-soft" />
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" className="ds-token-kind-glyph__fill" />
        </Track>
      )
    case 'glow':
      return (
        <Track size={size}>
          <circle cx="8" cy="8" r="5.5" className="ds-token-kind-glyph__stroke" />
          <circle cx="8" cy="8" r="2.4" className="ds-token-kind-glyph__fill" />
        </Track>
      )
    case 'effect':
      return (
        <Track size={size}>
          <path d="M8 2.5 L9.2 6.2 L13 6.5 L10.2 9 L11 12.8 L8 10.8 L5 12.8 L5.8 9 L3 6.5 L6.8 6.2 Z" className="ds-token-kind-glyph__fill" />
        </Track>
      )
    case 'motion':
      return (
        <Track size={size}>
          <path d="M2.5 10.5 C4.5 5.5 6.5 5.5 8 8 C9.5 10.5 11.5 10.5 13.5 5.5" className="ds-token-kind-glyph__stroke" fill="none" />
          <circle cx="13.5" cy="5.5" r="1.2" className="ds-token-kind-glyph__fill" />
        </Track>
      )
    case 'asset':
      return (
        <Track size={size}>
          <rect x="2.5" y="3.5" width="11" height="9" rx="1.5" className="ds-token-kind-glyph__stroke" fill="none" />
          <circle cx="6" cy="7" r="1.2" className="ds-token-kind-glyph__fill" />
          <path d="M4.5 11.5 L7.5 8.5 L9.5 10 L11.5 7.5 L13.5 11.5 Z" className="ds-token-kind-glyph__fill" />
        </Track>
      )
    default:
      return (
        <Track size={size}>
          <rect x="3" y="3" width="4" height="4" rx="0.8" className="ds-token-kind-glyph__fill" />
          <rect x="9" y="3" width="4" height="4" rx="0.8" className="ds-token-kind-glyph__fill-soft" />
          <rect x="3" y="9" width="4" height="4" rx="0.8" className="ds-token-kind-glyph__fill-soft" />
          <rect x="9" y="9" width="4" height="4" rx="0.8" className="ds-token-kind-glyph__fill" />
        </Track>
      )
  }
}

/** Map Brandion / studio type strings onto kind glyph ids. */
export function tokenKindGlyphId(type: string): TokenKindGlyphId {
  switch (type) {
    case 'all':
      return 'all'
    case 'color':
      return 'color'
    case 'spacing':
    case 'space':
    case 'clearspace':
      return 'space'
    case 'radius':
    case 'border':
      return 'radius'
    case 'opacity':
      return 'opacity'
    case 'size':
    case 'artboard':
    case 'media':
    case 'layout.grid':
    case 'layout.breakpoint':
    case 'layout.container':
      return 'size'
    case 'typography':
    case 'type':
    case 'font':
    case 'content':
      return 'type'
    case 'shadow':
      return 'shadow'
    case 'glow':
      return 'glow'
    case 'effect':
    case 'blur':
    case 'filter':
      return 'effect'
    case 'motion':
    case 'motion.duration':
    case 'motion.easing':
      return 'motion'
    case 'asset':
    case 'logo':
    case 'image':
      return 'asset'
    default:
      return 'all'
  }
}
