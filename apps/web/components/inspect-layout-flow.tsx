'use client'

import type { InspectFieldDef } from '../lib/inspect/field-catalog'
import { InspectGlyphChips } from './inspect-glyph-chips'
import {
  FlowDirectionGlyph,
  WrapGlyph,
  flowDirectionGlyphId,
  wrapGlyphId,
  type FlowDirectionGlyphId,
  type WrapGlyphId,
} from './inspect-mode-glyphs'

const FLOW_OPTIONS: Array<{ value: FlowDirectionGlyphId; label: string }> = [
  { value: 'row', label: 'row' },
  { value: 'column', label: 'column' },
  { value: 'row-reverse', label: 'row-rev' },
  { value: 'column-reverse', label: 'col-rev' },
]

const WRAP_OPTIONS: Array<{ value: WrapGlyphId; label: string }> = [
  { value: 'nowrap', label: 'nowrap' },
  { value: 'wrap', label: 'wrap' },
]

type InspectLayoutFlowProps = {
  fields: InspectFieldDef[]
  currentDirection?: string
  currentWrap?: boolean | string
  onSetProp: (prop: string, value: unknown) => void
}

export function InspectLayoutFlow({
  fields,
  currentDirection = 'column',
  currentWrap = false,
  onSetProp,
}: InspectLayoutFlowProps) {
  if (!fields.length) return null
  const direction = fields.find((f) => f.name === 'direction')
  const wrap = fields.find((f) => f.name === 'wrap')
  if (!direction && !wrap) return null

  const wrapActive =
    currentWrap === true || currentWrap === 'true' || currentWrap === 'wrap' ? 'wrap' : 'nowrap'

  return (
    <div className="creation-inspect-layout-flow" data-testid="inspect-layout-flow">
      {direction ? (
        <InspectGlyphChips
          testId="inspect-flow-direction"
          label={direction.label}
          value={flowDirectionGlyphId(String(currentDirection))}
          options={FLOW_OPTIONS}
          onChange={(next) => onSetProp('direction', next)}
          renderGlyph={(id) => <FlowDirectionGlyph id={id as FlowDirectionGlyphId} />}
        />
      ) : null}
      {wrap ? (
        <InspectGlyphChips
          testId="inspect-flow-wrap"
          label={wrap.label}
          value={wrapGlyphId(wrapActive)}
          options={WRAP_OPTIONS}
          onChange={(next) => onSetProp('wrap', next === 'wrap')}
          renderGlyph={(id) => <WrapGlyph id={id as WrapGlyphId} />}
        />
      ) : null}
    </div>
  )
}
