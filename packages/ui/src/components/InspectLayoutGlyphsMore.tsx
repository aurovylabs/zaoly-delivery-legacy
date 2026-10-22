/**
 * Additional inspect layout glyphs (self-park, 9-pip, text align, display, gap, aspect).
 * Shares optical language with InspectLayoutGlyphs / Extra.
 */

import type { ReactNode } from 'react'

const VIEW = 16

function Track({ children, size = VIEW }: { children: ReactNode; size?: number }) {
  return (
    <svg
      className="ui-icon ds-inspect-glyph"
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

function OuterFrame() {
  return <rect x="1.25" y="1.25" width="13.5" height="13.5" rx="2" className="ds-inspect-glyph__frame" />
}

function Pillar({
  x,
  y,
  w,
  h,
  tone = 'strong',
}: {
  x: number
  y: number
  w: number
  h: number
  tone?: 'strong' | 'soft' | 'empty'
}) {
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx="0.75"
      className={`ds-inspect-glyph__cell ds-inspect-glyph__cell--${tone}`}
    />
  )
}

function Pip({ x, y }: { x: number; y: number }) {
  return <circle cx={x} cy={y} r="1.35" className="ds-inspect-glyph__pip" />
}

/** Item parked inside a parent track (alignSelf / justifySelf). */
export type SelfParkGlyphId = 'auto' | 'start' | 'center' | 'end' | 'stretch'

export function SelfParkGlyph({
  id,
  axis = 'v',
  size,
}: {
  id: SelfParkGlyphId
  axis?: 'h' | 'v'
  size?: number
}) {
  const horizontal = axis === 'h'
  if (id === 'auto') {
    return (
      <Track size={size}>
        <OuterFrame />
        <Pillar x={5.5} y={5.5} w={5} h={5} tone="empty" />
      </Track>
    )
  }
  if (id === 'stretch') {
    return (
      <Track size={size}>
        <OuterFrame />
        <Pillar
          x={horizontal ? 3.25 : 5}
          y={horizontal ? 5 : 3.25}
          w={horizontal ? 9.5 : 6}
          h={horizontal ? 6 : 9.5}
          tone="soft"
        />
      </Track>
    )
  }
  let block: { x: number; y: number; w: number; h: number }
  if (id === 'center') {
    block = { x: 5.5, y: 5.5, w: 5, h: 5 }
  } else if (id === 'end') {
    block = horizontal
      ? { x: 8.5, y: 5.5, w: 4.25, h: 5 }
      : { x: 5.5, y: 8.5, w: 5, h: 4.25 }
  } else {
    block = horizontal
      ? { x: 3.25, y: 5.5, w: 4.25, h: 5 }
      : { x: 5.5, y: 3.25, w: 5, h: 4.25 }
  }
  return (
    <Track size={size}>
      <OuterFrame />
      <Pillar {...block} />
    </Track>
  )
}

export type NinePointGlyphId =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'left'
  | 'center'
  | 'right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right'

const NINE_POINT_COORDS: Record<NinePointGlyphId, { x: number; y: number }> = {
  'top-left': { x: 4, y: 4 },
  top: { x: 8, y: 4 },
  'top-right': { x: 12, y: 4 },
  left: { x: 4, y: 8 },
  center: { x: 8, y: 8 },
  right: { x: 12, y: 8 },
  'bottom-left': { x: 4, y: 12 },
  bottom: { x: 8, y: 12 },
  'bottom-right': { x: 12, y: 12 },
}

/** Shared 9-pip anchor (object-position / transform-origin). */
export function NinePointGlyph({
  id,
  size,
}: {
  id: NinePointGlyphId
  size?: number
}) {
  const { x, y } = NINE_POINT_COORDS[id]
  return (
    <Track size={size}>
      <OuterFrame />
      <Pip x={x} y={y} />
    </Track>
  )
}

export type ObjectPositionGlyphId = NinePointGlyphId
export const ObjectPositionGlyph = NinePointGlyph

export type TransformOriginGlyphId = NinePointGlyphId
export const TransformOriginGlyph = NinePointGlyph

export type TextAlignGlyphId = 'start' | 'center' | 'end' | 'justify'

export function TextAlignGlyph({ id, size }: { id: TextAlignGlyphId; size?: number }) {
  const lines =
    id === 'center'
      ? [
          { x: 4.5, w: 7 },
          { x: 5.5, w: 5 },
          { x: 4.5, w: 7 },
        ]
      : id === 'end'
        ? [
            { x: 5.5, w: 7 },
            { x: 7.5, w: 5 },
            { x: 5.5, w: 7 },
          ]
        : id === 'justify'
          ? [
              { x: 3.5, w: 9 },
              { x: 3.5, w: 9 },
              { x: 3.5, w: 9 },
            ]
          : [
              { x: 3.5, w: 7 },
              { x: 3.5, w: 5 },
              { x: 3.5, w: 7 },
            ]
  return (
    <Track size={size}>
      <OuterFrame />
      {lines.map((line, i) => (
        <rect
          key={i}
          x={line.x}
          y={4 + i * 3}
          width={line.w}
          height="1.4"
          rx="0.5"
          className="ds-inspect-glyph__cell ds-inspect-glyph__cell--strong"
        />
      ))}
    </Track>
  )
}

export type AspectRatioGlyphId = 'free' | '1-1' | '16-9' | '4-3' | '3-2' | '9-16' | '21-9'

export function AspectRatioGlyph({ id, size }: { id: AspectRatioGlyphId; size?: number }) {
  let box = { x: 3.5, y: 3.5, w: 9, h: 9 }
  if (id === '16-9') box = { x: 2.5, y: 5, w: 11, h: 6 }
  else if (id === '21-9') box = { x: 2, y: 5.5, w: 12, h: 5 }
  else if (id === '4-3') box = { x: 3, y: 4.5, w: 10, h: 7.5 }
  else if (id === '3-2') box = { x: 2.75, y: 4.75, w: 10.5, h: 6.5 }
  else if (id === '9-16') box = { x: 5, y: 2.5, w: 6, h: 11 }
  else if (id === 'free') {
    return (
      <Track size={size}>
        <OuterFrame />
        <Pillar x={4} y={4.5} w={8} h={7} tone="empty" />
        <line x1="4" y1="12" x2="12" y2="4" className="ds-inspect-glyph__dash" />
      </Track>
    )
  }
  return (
    <Track size={size}>
      <OuterFrame />
      <Pillar {...box} />
    </Track>
  )
}

export type GapAxisGlyphId = 'both' | 'row' | 'column'

export function GapAxisGlyph({ id, size }: { id: GapAxisGlyphId; size?: number }) {
  return (
    <Track size={size}>
      <OuterFrame />
      {(id === 'both' || id === 'row') && (
        <>
          <Pillar x={3} y={4} w={4} h={3.5} />
          <Pillar x={9} y={4} w={4} h={3.5} />
          <line x1="7.5" y1="5.75" x2="8.5" y2="5.75" className="ds-inspect-glyph__accent" />
        </>
      )}
      {(id === 'both' || id === 'column') && (
        <>
          <Pillar x={3} y={id === 'both' ? 9 : 4} w={10} h={3} tone={id === 'both' ? 'soft' : 'strong'} />
          {id === 'column' ? (
            <>
              <Pillar x={3} y={9} w={10} h={3} tone="soft" />
              <line x1="8" y1="7.5" x2="8" y2="8.5" className="ds-inspect-glyph__accent" />
            </>
          ) : null}
        </>
      )}
    </Track>
  )
}

export type DisplayModeGlyphId =
  | 'block'
  | 'inline-block'
  | 'flex'
  | 'inline-flex'
  | 'grid'
  | 'inline-grid'
  | 'inline'
  | 'contents'
  | 'table'
  | 'list-item'
  | 'none'

export function DisplayModeGlyph({ id, size }: { id: DisplayModeGlyphId; size?: number }) {
  if (id === 'none') {
    return (
      <Track size={size}>
        <OuterFrame />
        <line x1="4" y1="4" x2="12" y2="12" className="ds-inspect-glyph__accent" />
        <line x1="12" y1="4" x2="4" y2="12" className="ds-inspect-glyph__accent" />
      </Track>
    )
  }
  if (id === 'contents') {
    return (
      <Track size={size}>
        <OuterFrame />
        <Pillar x={3.5} y={4} w={4} h={8} tone="soft" />
        <Pillar x={8.5} y={4} w={4} h={8} tone="soft" />
        <line x1="1.25" y1="1.25" x2="14.75" y2="14.75" className="ds-inspect-glyph__dash" />
      </Track>
    )
  }
  if (id === 'grid' || id === 'inline-grid') {
    return (
      <Track size={size}>
        <OuterFrame />
        <Pillar x={3} y={3} w={4.5} h={4.5} />
        <Pillar x={8.5} y={3} w={4.5} h={4.5} tone="soft" />
        <Pillar x={3} y={8.5} w={4.5} h={4.5} tone="soft" />
        <Pillar x={8.5} y={8.5} w={4.5} h={4.5} />
        {id === 'inline-grid' ? (
          <line x1="2.5" y1="13.5" x2="13.5" y2="13.5" className="ds-inspect-glyph__dash" />
        ) : null}
      </Track>
    )
  }
  if (id === 'flex' || id === 'inline-flex') {
    return (
      <Track size={size}>
        <OuterFrame />
        <Pillar x={3} y={5} w={3} h={6} />
        <Pillar x={6.5} y={5} w={3} h={6} />
        <Pillar x={10} y={5} w={3} h={6} tone="soft" />
        {id === 'inline-flex' ? (
          <line x1="2.5" y1="13.5" x2="13.5" y2="13.5" className="ds-inspect-glyph__dash" />
        ) : null}
      </Track>
    )
  }
  if (id === 'table') {
    return (
      <Track size={size}>
        <OuterFrame />
        <Pillar x={3} y={3.5} w={10} h={2.5} />
        <Pillar x={3} y={6.75} w={4.5} h={2.5} tone="soft" />
        <Pillar x={8.5} y={6.75} w={4.5} h={2.5} tone="soft" />
        <Pillar x={3} y={10} w={4.5} h={2.5} tone="soft" />
        <Pillar x={8.5} y={10} w={4.5} h={2.5} tone="soft" />
      </Track>
    )
  }
  if (id === 'list-item') {
    return (
      <Track size={size}>
        <OuterFrame />
        <circle cx="4.5" cy="5" r="1.1" className="ds-inspect-glyph__pip" />
        <Pillar x={7} y={4} w={6} h={2} />
        <circle cx="4.5" cy="8.5" r="1.1" className="ds-inspect-glyph__pip" />
        <Pillar x={7} y={7.5} w={5} h={2} tone="soft" />
        <circle cx="4.5" cy="12" r="1.1" className="ds-inspect-glyph__pip" />
        <Pillar x={7} y={11} w={6} h={2} tone="soft" />
      </Track>
    )
  }
  if (id === 'inline' || id === 'inline-block') {
    return (
      <Track size={size}>
        <OuterFrame />
        <Pillar
          x={id === 'inline-block' ? 3.5 : 4}
          y={id === 'inline-block' ? 4 : 6}
          w={id === 'inline-block' ? 9 : 8}
          h={id === 'inline-block' ? 8 : 4}
          tone="soft"
        />
        <line x1="2.5" y1="13.5" x2="13.5" y2="13.5" className="ds-inspect-glyph__dash" />
      </Track>
    )
  }
  return (
    <Track size={size}>
      <OuterFrame />
      <Pillar x={3.5} y={3.5} w={9} h={9} />
    </Track>
  )
}

export function selfParkGlyphId(value: string): SelfParkGlyphId {
  const v = value.replace(/^flex-/, '')
  if (v === 'center') return 'center'
  if (v === 'end' || v === 'flex-end') return 'end'
  if (v === 'stretch') return 'stretch'
  if (v === 'auto' || v === '') return 'auto'
  return 'start'
}

export function ninePointGlyphId(value: string): NinePointGlyphId {
  const v = value.trim().toLowerCase().replace(/\s+/g, '-')
  if (v in NINE_POINT_COORDS) return v as NinePointGlyphId
  const spaced = value.trim().toLowerCase()
  const map: Record<string, NinePointGlyphId> = {
    'top left': 'top-left',
    'top center': 'top',
    top: 'top',
    'top right': 'top-right',
    'center left': 'left',
    left: 'left',
    center: 'center',
    'center right': 'right',
    right: 'right',
    'bottom left': 'bottom-left',
    'bottom center': 'bottom',
    bottom: 'bottom',
    'bottom right': 'bottom-right',
  }
  return map[spaced] ?? 'center'
}

export const objectPositionGlyphId = ninePointGlyphId
export const transformOriginGlyphId = ninePointGlyphId

export function textAlignGlyphId(value: string): TextAlignGlyphId {
  if (value === 'center') return 'center'
  if (value === 'right' || value === 'end') return 'end'
  if (value === 'justify') return 'justify'
  return 'start'
}

export function aspectRatioGlyphId(value: string): AspectRatioGlyphId {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, '').replace(/[:/]/g, '-')
  if (normalized === '1-1') return '1-1'
  if (normalized === '9-16') return '9-16'
  if (normalized === '16-9') return '16-9'
  if (normalized === '21-9') return '21-9'
  if (normalized === '4-3') return '4-3'
  if (normalized === '3-2') return '3-2'
  if (!normalized || normalized === 'auto' || normalized === 'custom') return 'free'
  return 'free'
}

export function gapAxisGlyphId(value: string): GapAxisGlyphId {
  if (value === 'row' || value === 'rowGap') return 'row'
  if (value === 'column' || value === 'columnGap') return 'column'
  return 'both'
}

export function displayModeGlyphId(value: string): DisplayModeGlyphId {
  const v = value.trim().toLowerCase()
  if (v === 'flex') return 'flex'
  if (v === 'inline-flex') return 'inline-flex'
  if (v === 'grid') return 'grid'
  if (v === 'inline-grid') return 'inline-grid'
  if (v === 'inline') return 'inline'
  if (v === 'inline-block') return 'inline-block'
  if (v === 'contents') return 'contents'
  if (v === 'table' || v === 'table-cell' || v === 'table-row') return 'table'
  if (v === 'list-item') return 'list-item'
  if (v === 'none') return 'none'
  return 'block'
}

/** CSS object-position / keyword → nine-point write value used by CREATION. */
export function ninePointWriteValue(id: NinePointGlyphId): string {
  const map: Record<NinePointGlyphId, string> = {
    'top-left': 'top left',
    top: 'top',
    'top-right': 'top right',
    left: 'left',
    center: 'center',
    right: 'right',
    'bottom-left': 'bottom left',
    bottom: 'bottom',
    'bottom-right': 'bottom right',
  }
  return map[id]
}
