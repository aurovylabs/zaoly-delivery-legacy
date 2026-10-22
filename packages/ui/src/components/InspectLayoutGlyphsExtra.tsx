/**
 * Extended inspect layout glyphs (distribute, park, flow, chrome, clip).
 * Shares optical language with InspectLayoutGlyphs.tsx.
 */

import type { ReactNode } from 'react'
import { useId } from 'react'

const VIEW = 16

function Track({
  children,
  className,
  size = VIEW,
}: {
  children: ReactNode
  className?: string
  size?: number
}) {
  return (
    <svg
      className={['ui-icon', 'ds-inspect-glyph', className].filter(Boolean).join(' ')}
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

function OuterFrame({ dashed = false }: { dashed?: boolean } = {}) {
  return (
    <rect
      x="1.25"
      y="1.25"
      width="13.5"
      height="13.5"
      rx="2"
      className={
        dashed
          ? 'ds-inspect-glyph__frame ds-inspect-glyph__frame--dashed'
          : 'ds-inspect-glyph__frame'
      }
    />
  )
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

export type DistributeGlyphId = 'packed' | 'even'

export function DistributeGlyph({
  id,
  size,
}: {
  id: DistributeGlyphId
  size?: number
}) {
  if (id === 'even') {
    return (
      <Track size={size}>
        <OuterFrame />
        <Pillar x={3} y={4.5} w={2.2} h={7} />
        <Pillar x={6.9} y={4.5} w={2.2} h={7} />
        <Pillar x={10.8} y={4.5} w={2.2} h={7} />
      </Track>
    )
  }
  return (
    <Track size={size}>
      <OuterFrame />
      <Pillar x={3} y={4.5} w={2.2} h={7} />
      <Pillar x={5.6} y={4.5} w={2.2} h={7} />
      <Pillar x={8.2} y={4.5} w={2.2} h={7} />
    </Track>
  )
}

export type CellParkGlyphId = 'start' | 'center' | 'end' | 'stretch'

export function CellParkGlyph({
  id,
  axis = 'h',
  size,
}: {
  id: CellParkGlyphId
  axis?: 'h' | 'v'
  size?: number
}) {
  const horizontal = axis === 'h'
  let block: { x: number; y: number; w: number; h: number }
  if (id === 'stretch') {
    block = horizontal
      ? { x: 3.25, y: 5.5, w: 9.5, h: 5 }
      : { x: 5.5, y: 3.25, w: 5, h: 9.5 }
  } else if (id === 'center') {
    block = horizontal
      ? { x: 5.5, y: 5.5, w: 5, h: 5 }
      : { x: 5.5, y: 5.5, w: 5, h: 5 }
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
      <Pillar {...block} tone={id === 'stretch' ? 'soft' : 'strong'} />
    </Track>
  )
}

export type FlowDirectionGlyphId = 'row' | 'column' | 'row-reverse' | 'column-reverse'

export function FlowDirectionGlyph({
  id,
  size,
}: {
  id: FlowDirectionGlyphId
  size?: number
}) {
  const reverse = id.includes('reverse')
  const row = id.startsWith('row')
  return (
    <Track size={size}>
      <OuterFrame />
      {row ? (
        <>
          <Pillar x={reverse ? 9.5 : 3.2} y={5.5} w={3.2} h={5} />
          <Pillar x={reverse ? 6 : 6.8} y={5.5} w={3.2} h={5} tone="soft" />
          <line
            x1={reverse ? 11.5 : 4.5}
            y1={8}
            x2={reverse ? 4.5 : 11.5}
            y2={8}
            className="ds-inspect-glyph__accent"
          />
        </>
      ) : (
        <>
          <Pillar x={5.5} y={reverse ? 9.5 : 3.2} w={5} h={3.2} />
          <Pillar x={5.5} y={reverse ? 6 : 6.8} w={5} h={3.2} tone="soft" />
          <line
            x1={8}
            y1={reverse ? 11.5 : 4.5}
            x2={8}
            y2={reverse ? 4.5 : 11.5}
            className="ds-inspect-glyph__accent"
          />
        </>
      )}
    </Track>
  )
}

export type WrapGlyphId = 'nowrap' | 'wrap'

export function WrapGlyph({ id, size }: { id: WrapGlyphId; size?: number }) {
  if (id === 'wrap') {
    return (
      <Track size={size}>
        <OuterFrame />
        <Pillar x={3} y={3.5} w={4} h={3.5} />
        <Pillar x={8} y={3.5} w={4} h={3.5} />
        <Pillar x={3} y={8.5} w={4} h={3.5} tone="soft" />
      </Track>
    )
  }
  return (
    <Track size={size}>
      <OuterFrame />
      <Pillar x={3} y={5.5} w={3} h={5} />
      <Pillar x={6.5} y={5.5} w={3} h={5} />
      <Pillar x={10} y={5.5} w={3} h={5} tone="soft" />
    </Track>
  )
}

export type AutoFlowGlyphId = 'row' | 'column' | 'dense'

export function AutoFlowGlyph({ id, size }: { id: AutoFlowGlyphId; size?: number }) {
  if (id === 'dense') {
    return (
      <Track size={size}>
        <OuterFrame />
        <Pillar x={3} y={3.5} w={4.5} h={4} />
        <Pillar x={8} y={3.5} w={4.5} h={2.5} tone="soft" />
        <Pillar x={8} y={6.5} w={4.5} h={2.5} />
        <Pillar x={3} y={8.5} w={9.5} h={3.5} tone="soft" />
      </Track>
    )
  }
  if (id === 'column') {
    return (
      <Track size={size}>
        <OuterFrame />
        <Pillar x={3.5} y={3.2} w={4} h={3} />
        <Pillar x={3.5} y={6.5} w={4} h={3} tone="soft" />
        <Pillar x={8.5} y={3.2} w={4} h={9.3} />
        <line x1="8" y1="4" x2="8" y2="12" className="ds-inspect-glyph__accent" />
      </Track>
    )
  }
  return (
    <Track size={size}>
      <OuterFrame />
      <Pillar x={3.2} y={3.5} w={3} h={4} />
      <Pillar x={6.5} y={3.5} w={3} h={4} tone="soft" />
      <Pillar x={9.8} y={3.5} w={3} h={4} />
      <Pillar x={3.2} y={8.5} w={9.6} h={3.5} tone="soft" />
      <line x1="4" y1="8" x2="12" y2="8" className="ds-inspect-glyph__accent" />
    </Track>
  )
}

export type PositionGlyphId = 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky'

export function PositionGlyph({ id, size }: { id: PositionGlyphId; size?: number }) {
  switch (id) {
    case 'relative':
      return (
        <Track size={size}>
          <OuterFrame dashed />
          <Pillar x={4} y={4} w={6} h={6} tone="soft" />
          <Pillar x={5.5} y={5.5} w={6} h={6} />
        </Track>
      )
    case 'absolute':
      return (
        <Track size={size}>
          <OuterFrame />
          <Pillar x={7.5} y={3.5} w={5} h={5} />
          <line x1="3.5" y1="12" x2="12.5" y2="12" className="ds-inspect-glyph__dash" />
        </Track>
      )
    case 'fixed':
      return (
        <Track size={size}>
          <OuterFrame />
          <Pillar x={4.5} y={4.5} w={7} h={7} />
          <line x1="3" y1="3" x2="5" y2="3" className="ds-inspect-glyph__accent" />
          <line x1="3" y1="3" x2="3" y2="5" className="ds-inspect-glyph__accent" />
        </Track>
      )
    case 'sticky':
      return (
        <Track size={size}>
          <OuterFrame />
          <Pillar x={4} y={3.2} w={8} h={3.5} />
          <Pillar x={4} y={8} w={8} h={4.5} tone="soft" />
          <line x1="4" y1="7" x2="12" y2="7" className="ds-inspect-glyph__accent" />
        </Track>
      )
    default:
      return (
        <Track size={size}>
          <OuterFrame />
          <Pillar x={4} y={4} w={8} h={8} tone="soft" />
        </Track>
      )
  }
}

export type OverflowGlyphId = 'visible' | 'hidden' | 'scroll' | 'auto'

export function OverflowGlyph({ id, size }: { id: OverflowGlyphId; size?: number }) {
  const clipId = useId().replace(/:/g, '')
  if (id === 'hidden') {
    return (
      <Track size={size}>
        <defs>
          <clipPath id={clipId}>
            <rect x="3" y="3" width="10" height="10" rx="1" />
          </clipPath>
        </defs>
        <OuterFrame />
        <g clipPath={`url(#${clipId})`}>
          <Pillar x={5} y={2} w={9} h={12} />
        </g>
      </Track>
    )
  }
  if (id === 'scroll') {
    return (
      <Track size={size}>
        <OuterFrame />
        <Pillar x={3.5} y={3.5} w={7} h={9} tone="soft" />
        <line x1="12.5" y1="4" x2="12.5" y2="12" className="ds-inspect-glyph__accent" />
        <line x1="11.75" y1="5" x2="13.25" y2="5" className="ds-inspect-glyph__accent" />
        <line x1="11.75" y1="11" x2="13.25" y2="11" className="ds-inspect-glyph__accent" />
      </Track>
    )
  }
  if (id === 'auto') {
    return (
      <Track size={size}>
        <OuterFrame dashed />
        <Pillar x={4} y={4} w={8} h={8} tone="soft" />
        <line x1="12.2" y1="5" x2="12.2" y2="11" className="ds-inspect-glyph__dash" />
      </Track>
    )
  }
  return (
    <Track size={size}>
      <OuterFrame />
      <Pillar x={5} y={2.5} w={8.5} h={11} />
    </Track>
  )
}

export type BorderStyleGlyphId = 'solid' | 'dashed' | 'dotted' | 'none'

export function BorderStyleGlyph({
  id,
  size,
}: {
  id: BorderStyleGlyphId
  size?: number
}) {
  if (id === 'none') {
    return (
      <Track size={size}>
        <OuterFrame dashed />
        <Pillar x={5} y={5} w={6} h={6} tone="soft" />
      </Track>
    )
  }
  const strokeClass =
    id === 'dashed'
      ? 'ds-inspect-glyph__frame ds-inspect-glyph__frame--dashed'
      : id === 'dotted'
        ? 'ds-inspect-glyph__frame ds-inspect-glyph__frame--dotted'
        : 'ds-inspect-glyph__frame'
  return (
    <Track size={size}>
      <rect x="3" y="3" width="10" height="10" rx="1.5" className={strokeClass} />
    </Track>
  )
}

export type BgPositionGlyphId = 'center' | 'top' | 'bottom' | 'left' | 'right'

export function BgPositionGlyph({
  id,
  size,
}: {
  id: BgPositionGlyphId
  size?: number
}) {
  const pip = { w: 3.2, h: 3.2 }
  let x = 6.4
  let y = 6.4
  if (id === 'top') y = 3.2
  if (id === 'bottom') y = 9.6
  if (id === 'left') x = 3.2
  if (id === 'right') x = 9.6
  return (
    <Track size={size}>
      <OuterFrame />
      <Pillar x={x} y={y} w={pip.w} h={pip.h} />
    </Track>
  )
}

export type ClipPresetGlyphId =
  | 'none'
  | 'slant-bottom'
  | 'slant-bottom-flip'
  | 'slant-top'
  | 'trapezoid'
  | 'parallelogram'

export function ClipPresetGlyph({
  id,
  size,
}: {
  id: ClipPresetGlyphId
  size?: number
}) {
  const paths: Record<ClipPresetGlyphId, string> = {
    none: 'M3.5 3.5 H12.5 V12.5 H3.5 Z',
    'slant-bottom': 'M3.5 3.5 H12.5 V12.5 L3.5 10.5 Z',
    'slant-bottom-flip': 'M3.5 3.5 H12.5 V10.5 L3.5 12.5 Z',
    'slant-top': 'M3.5 5.5 L12.5 3.5 V12.5 H3.5 Z',
    trapezoid: 'M5 3.5 H11 L12.5 12.5 H3.5 Z',
    parallelogram: 'M5.5 3.5 H13 L10.5 12.5 H3 Z',
  }
  return (
    <Track size={size} className="ds-inspect-glyph--clip">
      <path d={paths[id]} className="ds-inspect-glyph__silhouette" />
    </Track>
  )
}

export function distributeGlyphId(value: string): DistributeGlyphId {
  return value === 'even' || value === 'space-between' ? 'even' : 'packed'
}

export function cellParkGlyphId(value: string): CellParkGlyphId {
  const v = value.replace(/^flex-/, '')
  if (v === 'center') return 'center'
  if (v === 'end' || v === 'flex-end') return 'end'
  if (v === 'stretch') return 'stretch'
  return 'start'
}

export function flowDirectionGlyphId(value: string): FlowDirectionGlyphId {
  if (value === 'column') return 'column'
  if (value === 'row-reverse') return 'row-reverse'
  if (value === 'column-reverse') return 'column-reverse'
  return 'row'
}

export function wrapGlyphId(value: string): WrapGlyphId {
  return value === 'wrap' || value === 'wrap-reverse' ? 'wrap' : 'nowrap'
}

export function autoFlowGlyphId(value: string): AutoFlowGlyphId {
  if (value.includes('column')) return 'column'
  if (value.includes('dense')) return 'dense'
  return 'row'
}

export function positionGlyphId(value: string): PositionGlyphId {
  if (value === 'relative') return 'relative'
  if (value === 'absolute') return 'absolute'
  if (value === 'fixed') return 'fixed'
  if (value === 'sticky') return 'sticky'
  return 'static'
}

export function overflowGlyphId(value: string): OverflowGlyphId {
  if (value === 'hidden' || value === 'clip') return 'hidden'
  if (value === 'scroll') return 'scroll'
  if (value === 'auto') return 'auto'
  return 'visible'
}

export function borderStyleGlyphId(value: string): BorderStyleGlyphId {
  if (value === 'dashed') return 'dashed'
  if (value === 'dotted') return 'dotted'
  if (value === 'none') return 'none'
  return 'solid'
}

export function bgPositionGlyphId(value: string): BgPositionGlyphId {
  if (value === 'top') return 'top'
  if (value === 'bottom') return 'bottom'
  if (value === 'left') return 'left'
  if (value === 'right') return 'right'
  return 'center'
}

export function clipPresetGlyphId(value: string): ClipPresetGlyphId {
  switch (value) {
    case 'slant-bottom':
    case 'slant-bottom-flip':
    case 'slant-top':
    case 'trapezoid':
    case 'parallelogram':
      return value
    default:
      return 'none'
  }
}
