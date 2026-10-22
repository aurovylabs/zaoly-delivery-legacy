'use client'

import type { ReactNode } from 'react'
import type { InspectFieldDef } from '../lib/inspect/field-catalog'
import { InspectGlyphChips } from './inspect-glyph-chips'
import {
  OverflowGlyph,
  overflowGlyphId,
  type OverflowGlyphId,
} from './inspect-mode-glyphs'

const OVERFLOW_OPTIONS: Array<{ value: OverflowGlyphId; label: string }> = [
  { value: 'visible', label: 'visible' },
  { value: 'hidden', label: 'hidden' },
  { value: 'scroll', label: 'scroll' },
  { value: 'auto', label: 'auto' },
]

type InspectAppearanceEffectsProps = {
  fields: InspectFieldDef[]
  renderTokenField: (field: InspectFieldDef) => ReactNode
  /** Legacy fallback when glyph chips are not wired. */
  renderOverflowControl?: (field: InspectFieldDef) => ReactNode
  currentOverflow?: string
  onSetOverflow?: (value: string) => void
  groupLabel: string
  overflowLabel: string
}

function fieldByName(fields: InspectFieldDef[], name: string): InspectFieldDef | undefined {
  return fields.find((field) => field.name === name)
}

export function InspectAppearanceEffects({
  fields,
  renderTokenField,
  renderOverflowControl,
  currentOverflow = 'visible',
  onSetOverflow,
  groupLabel,
  overflowLabel,
}: InspectAppearanceEffectsProps) {
  if (!fields.length) return null

  const shadowField = fieldByName(fields, 'shadow')
  const blurField = fieldByName(fields, 'blur')
  const overflowField = fieldByName(fields, 'overflow')
  const chromeNames = new Set(['shadow', 'blur', 'overflow'])
  const extraFields = fields.filter((field) => !chromeNames.has(field.name))

  return (
    <div className="creation-inspect-effects" data-testid="inspect-appearance-effects">
      <div className="creation-inspect-effects__header">
        <span className="creation-inspect-effects__label">{groupLabel}</span>
      </div>
      <div className="creation-inspect-effects__body">
        {shadowField ? (
          <div className="creation-inspect-effects__shadow">{renderTokenField(shadowField)}</div>
        ) : null}
        {(blurField || overflowField) && (
          <div className="creation-inspect-effects__row">
            {blurField ? (
              <div className="creation-inspect-effects__blur">{renderTokenField(blurField)}</div>
            ) : null}
            {overflowField ? (
              <div className="creation-inspect-effects__overflow">
                <span className="creation-inspect-effects__overflow-label">{overflowLabel}</span>
                {onSetOverflow ? (
                  <InspectGlyphChips
                    testId="inspect-overflow"
                    value={overflowGlyphId(currentOverflow)}
                    options={OVERFLOW_OPTIONS}
                    onChange={onSetOverflow}
                    ariaLabel={overflowLabel}
                    renderGlyph={(id) => <OverflowGlyph id={id as OverflowGlyphId} />}
                  />
                ) : renderOverflowControl ? (
                  renderOverflowControl(overflowField)
                ) : null}
              </div>
            ) : null}
          </div>
        )}
        {extraFields.length ? (
          <div className="creation-inspect-effects__extras" data-testid="inspect-appearance-effects-extras">
            {extraFields.map((field) => (
              <div key={field.name} className="creation-inspect-effects__extra">
                {renderTokenField(field)}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
