/**
 * Theme-aware inspect layout glyphs — optical kin to Foundation Lucide icons
 * (16px, ~1.5–1.75 stroke, hairline frames). Spec: zaoly-ui-inspect-layout-glyphs.md
 */

import type { ReactNode } from 'react'
import { useId } from 'react'

export type SizeModeGlyphId = 'hug' | 'fill' | 'fixed'
export type MediaFitGlyphId =
  | 'cover'
  | 'contain'
  | 'auto'
  | 'fill'
  | 'none'
  | 'scale-down'

export type GridColumnGlyphId =
  | 'cols-1'
  | 'cols-2'
  | 'cols-3'
  | 'cols-4'
  | 'cols-6'
  | 'cols-12'
  | 'auto-fit'
  | 'auto-fill'
  | 'split-1-2'
  | 'split-2-1'
  | 'sidebar'
  | 'three-pane'

export type GridSpanGlyphId =
  | 'span-auto'
  | 'span-1'
  | 'span-2'
  | 'span-3'
  | 'span-4'
  | 'span-6'
  | 'span-12'
  | 'span-full'

/** Match Foundation `Icon*` default size (viewBox + chrome default). */
const VIEW = 16

/** Recommended rendered sizes — geometry stays 16×16 viewBox; `size` scales the SVG. */
export const INSPECT_GLYPH_SIZE = {
  /** Inspect chrome / Lucide parity */
  sm: 16,
  /** Compact toolbars / denser chips */
  md: 24,
  /** Storybook review / segmented controls */
  lg: 32,
  /** Docs / picker tiles / large chrome */
  xl: 48,
} as const

export type InspectGlyphSizeToken = keyof typeof INSPECT_GLYPH_SIZE
export const INSPECT_GLYPH_SIZE_DEFAULT = INSPECT_GLYPH_SIZE.sm

type TrackProps = {
  children: ReactNode
  className?: string
  size?: number
}

function Track({ children, className, size = VIEW }: TrackProps) {
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

/** Outer chrome — Lucide-like rounded square. */
function OuterFrame({ dashed = false }: { dashed?: boolean }) {
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

function ColBars({ widths, gap = 1.1 }: { widths: number[]; gap?: number }) {
  const pad = 3
  const inner = VIEW - pad * 2
  const totalGap = gap * Math.max(0, widths.length - 1)
  const unit = (inner - totalGap) / widths.reduce((a, b) => a + b, 0)
  let x = pad
  return (
    <>
      {widths.map((w, i) => {
        const width = Math.max(1.1, w * unit)
        const el = <Pillar key={i} x={x} y={pad} w={width} h={inner} />
        x += width + gap
        return el
      })}
    </>
  )
}

function equalCols(n: number): number[] {
  if (n <= 4) return Array.from({ length: n }, () => 1)
  return [1, 1, 1, 1, 1, 1]
}

export function SizeModeGlyph({
  id,
  axis = 'both',
  size,
}: {
  id: SizeModeGlyphId
  axis?: 'width' | 'height' | 'both'
  size?: number
}) {
  switch (id) {
    case 'hug':
      return (
        <Track className="ds-inspect-glyph--size" size={size}>
          <OuterFrame dashed />
          <Pillar
            x={axis === 'height' ? 4.5 : 5.5}
            y={axis === 'width' ? 4.5 : 6}
            w={axis === 'height' ? 7 : 5}
            h={axis === 'width' ? 7 : 4}
          />
        </Track>
      )
    case 'fill':
      return (
        <Track className="ds-inspect-glyph--size" size={size}>
          <OuterFrame />
          <Pillar x={3.25} y={3.25} w={9.5} h={9.5} tone="soft" />
          {axis !== 'height' ? (
            <>
              <line x1="4.5" y1="8" x2="11.5" y2="8" className="ds-inspect-glyph__accent" />
              <polyline
                points="6,6.5 4.5,8 6,9.5"
                className="ds-inspect-glyph__accent"
                fill="none"
              />
              <polyline
                points="10,6.5 11.5,8 10,9.5"
                className="ds-inspect-glyph__accent"
                fill="none"
              />
            </>
          ) : (
            <>
              <line x1="8" y1="4.5" x2="8" y2="11.5" className="ds-inspect-glyph__accent" />
              <polyline
                points="6.5,6 8,4.5 9.5,6"
                className="ds-inspect-glyph__accent"
                fill="none"
              />
              <polyline
                points="6.5,10 8,11.5 9.5,10"
                className="ds-inspect-glyph__accent"
                fill="none"
              />
            </>
          )}
        </Track>
      )
    case 'fixed':
      return (
        <Track className="ds-inspect-glyph--size" size={size}>
          <OuterFrame />
          <Pillar x={4.5} y={4.5} w={7} h={7} />
          {axis !== 'height' ? (
            <>
              <line x1="4.5" y1="13.5" x2="11.5" y2="13.5" className="ds-inspect-glyph__accent" />
              <line x1="4.5" y1="12.75" x2="4.5" y2="14.25" className="ds-inspect-glyph__accent" />
              <line x1="11.5" y1="12.75" x2="11.5" y2="14.25" className="ds-inspect-glyph__accent" />
            </>
          ) : (
            <>
              <line x1="13.5" y1="4.5" x2="13.5" y2="11.5" className="ds-inspect-glyph__accent" />
              <line x1="12.75" y1="4.5" x2="14.25" y2="4.5" className="ds-inspect-glyph__accent" />
              <line x1="12.75" y1="11.5" x2="14.25" y2="11.5" className="ds-inspect-glyph__accent" />
            </>
          )}
        </Track>
      )
    default:
      return (
        <Track className="ds-inspect-glyph--size" size={size}>
          <OuterFrame />
        </Track>
      )
  }
}

export function MediaFitGlyph({ id, size }: { id: MediaFitGlyphId; size?: number }) {
  const clipId = useId().replace(/:/g, '')

  if (id === 'cover') {
    return (
      <Track size={size}>
        <defs>
          <clipPath id={clipId}>
            <rect x="3" y="3.5" width="10" height="9" rx="1" />
          </clipPath>
        </defs>
        <OuterFrame />
        <g clipPath={`url(#${clipId})`}>
          <Pillar x={0.5} y={2} w={15} h={12} />
        </g>
        <rect
          x="3"
          y="3.5"
          width="10"
          height="9"
          rx="1"
          className="ds-inspect-glyph__frame ds-inspect-glyph__frame--inset"
        />
      </Track>
    )
  }

  switch (id) {
    case 'contain':
      return (
        <Track size={size}>
          <OuterFrame />
          <Pillar x={4.5} y={5} w={7} h={6} />
        </Track>
      )
    case 'auto':
    case 'none':
      return (
        <Track size={size}>
          <OuterFrame dashed />
          <Pillar x={3.5} y={4.5} w={6.5} h={5} />
        </Track>
      )
    case 'fill':
      return (
        <Track size={size}>
          <OuterFrame />
          <Pillar x={3.25} y={3.25} w={9.5} h={9.5} tone="soft" />
          <line x1="4.5" y1="5.5" x2="11.5" y2="10.5" className="ds-inspect-glyph__dash" />
        </Track>
      )
    case 'scale-down':
      return (
        <Track size={size}>
          <OuterFrame />
          <Pillar x={5.5} y={6} w={5} h={4} tone="soft" />
        </Track>
      )
    default:
      return (
        <Track size={size}>
          <OuterFrame />
        </Track>
      )
  }
}

export function GridColumnGlyph({
  id,
  size,
}: {
  id: GridColumnGlyphId
  size?: number
}) {
  switch (id) {
    case 'cols-1':
      return (
        <Track size={size}>
          <OuterFrame />
          <ColBars widths={[1]} />
        </Track>
      )
    case 'cols-2':
      return (
        <Track size={size}>
          <OuterFrame />
          <ColBars widths={equalCols(2)} />
        </Track>
      )
    case 'cols-3':
      return (
        <Track size={size}>
          <OuterFrame />
          <ColBars widths={equalCols(3)} gap={1} />
        </Track>
      )
    case 'cols-4':
      return (
        <Track size={size}>
          <OuterFrame />
          <ColBars widths={equalCols(4)} gap={0.9} />
        </Track>
      )
    case 'cols-6':
      return (
        <Track size={size}>
          <OuterFrame />
          <ColBars widths={equalCols(6)} gap={0.7} />
        </Track>
      )
    case 'cols-12':
      return (
        <Track size={size}>
          <OuterFrame />
          <ColBars widths={equalCols(12)} gap={0.55} />
        </Track>
      )
    case 'auto-fit':
      return (
        <Track size={size}>
          <OuterFrame />
          <ColBars widths={[1, 1, 1]} gap={1} />
          <line
            x1="3"
            y1="13.75"
            x2="13"
            y2="13.75"
            className="ds-inspect-glyph__dash"
            strokeDasharray="1.2 1.2"
          />
        </Track>
      )
    case 'auto-fill':
      return (
        <Track size={size}>
          <OuterFrame />
          <ColBars widths={[1, 1, 1, 1]} gap={0.85} />
          <line
            x1="3"
            y1="13.75"
            x2="13"
            y2="13.75"
            className="ds-inspect-glyph__dash"
            strokeDasharray="1.2 1.2"
          />
        </Track>
      )
    case 'split-1-2':
      return (
        <Track size={size}>
          <OuterFrame />
          <ColBars widths={[1, 2]} />
        </Track>
      )
    case 'split-2-1':
      return (
        <Track size={size}>
          <OuterFrame />
          <ColBars widths={[2, 1]} />
        </Track>
      )
    case 'sidebar':
      return (
        <Track size={size}>
          <OuterFrame />
          <ColBars widths={[1, 3.2]} />
        </Track>
      )
    case 'three-pane':
      return (
        <Track size={size}>
          <OuterFrame />
          <ColBars widths={[1, 2.2, 1]} gap={1} />
        </Track>
      )
    default:
      return (
        <Track size={size}>
          <OuterFrame />
          <ColBars widths={[1, 1]} />
        </Track>
      )
  }
}

export function GridSpanGlyph({
  id,
  axis,
  size,
}: {
  id: GridSpanGlyphId
  axis: 'col' | 'row'
  size?: number
}) {
  const pad = 3
  const inner = VIEW - pad * 2
  const slots = 4
  const gap = 1
  const slot = (inner - gap * (slots - 1)) / slots

  let fillCount = 0
  let mutedAll = false
  let full = false
  switch (id) {
    case 'span-auto':
      mutedAll = true
      fillCount = 1
      break
    case 'span-1':
      fillCount = 1
      break
    case 'span-2':
      fillCount = 2
      break
    case 'span-3':
      fillCount = 3
      break
    case 'span-4':
      fillCount = 4
      break
    case 'span-6':
    case 'span-12':
    case 'span-full':
      full = true
      fillCount = 4
      break
  }

  return (
    <Track size={size}>
      <OuterFrame />
      {Array.from({ length: slots }, (_, i) => {
        const active = full || i < fillCount
        const tone: 'strong' | 'soft' | 'empty' =
          mutedAll && active ? 'soft' : active ? 'strong' : 'empty'
        if (axis === 'col') {
          return (
            <Pillar
              key={i}
              x={pad + i * (slot + gap)}
              y={pad}
              w={slot}
              h={inner}
              tone={tone}
            />
          )
        }
        return (
          <Pillar
            key={i}
            x={pad}
            y={pad + i * (slot + gap)}
            w={inner}
            h={slot}
            tone={tone}
          />
        )
      })}
    </Track>
  )
}

export function sizeModeGlyphId(mode: string): SizeModeGlyphId {
  if (mode === 'fill') return 'fill'
  if (mode === 'fixed') return 'fixed'
  return 'hug'
}

export function mediaFitGlyphId(value: string): MediaFitGlyphId {
  switch (value) {
    case 'cover':
      return 'cover'
    case 'contain':
      return 'contain'
    case 'auto':
      return 'auto'
    case 'fill':
      return 'fill'
    case 'none':
      return 'none'
    case 'scale-down':
      return 'scale-down'
    default:
      return 'cover'
  }
}

export function mediaFitLabel(value: string): string {
  switch (value) {
    case 'cover':
      return 'Cover'
    case 'contain':
      return 'Contain'
    case 'auto':
      return 'Auto'
    case 'fill':
      return 'Fill'
    case 'none':
      return 'None'
    case 'scale-down':
      return 'Scale'
    default:
      return value
  }
}

export function columnGlyphForPresetLabel(label: string): GridColumnGlyphId {
  switch (label) {
    case '1 Col':
      return 'cols-1'
    case '2 Col':
      return 'cols-2'
    case '3 Col':
      return 'cols-3'
    case '4 Col':
      return 'cols-4'
    case '6 Col':
      return 'cols-6'
    case '12 Col':
      return 'cols-12'
    case 'Auto-Fit':
      return 'auto-fit'
    case 'Auto-Fill':
      return 'auto-fill'
    case '1 : 2':
      return 'split-1-2'
    case '2 : 1':
      return 'split-2-1'
    case 'Sidebar':
      return 'sidebar'
    case '3-Pane':
      return 'three-pane'
    default:
      return 'cols-2'
  }
}

export function spanGlyphForPresetLabel(label: string): GridSpanGlyphId {
  switch (label) {
    case 'Auto':
      return 'span-auto'
    case '1':
      return 'span-1'
    case '2':
      return 'span-2'
    case '3':
      return 'span-3'
    case '4':
      return 'span-4'
    case '6':
      return 'span-6'
    case '12':
      return 'span-12'
    case 'Full':
      return 'span-full'
    default:
      return 'span-1'
  }
}
