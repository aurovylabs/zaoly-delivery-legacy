'use client'

import type { ReactNode } from 'react'
import type { InspectFieldDef } from '../lib/inspect/field-catalog'
import { InspectGlyphChips } from './inspect-glyph-chips'
import {
  PositionGlyph,
  TransformOriginGlyph,
  ninePointGlyphId,
  ninePointWriteValue,
  positionGlyphId,
  type NinePointGlyphId,
  type PositionGlyphId,
} from './inspect-mode-glyphs'

const POSITION_OPTIONS: Array<{ value: PositionGlyphId; label: string }> = [
  { value: 'static', label: 'static' },
  { value: 'relative', label: 'relative' },
  { value: 'absolute', label: 'absolute' },
  { value: 'sticky', label: 'sticky' },
  { value: 'fixed', label: 'fixed' },
]

const ORIGIN_POINTS: Array<{ id: NinePointGlyphId; title: string }> = [
  { id: 'top-left', title: 'Top Left' },
  { id: 'top', title: 'Top Center' },
  { id: 'top-right', title: 'Top Right' },
  { id: 'left', title: 'Center Left' },
  { id: 'center', title: 'Center' },
  { id: 'right', title: 'Center Right' },
  { id: 'bottom-left', title: 'Bottom Left' },
  { id: 'bottom', title: 'Bottom Center' },
  { id: 'bottom-right', title: 'Bottom Right' },
]

type InspectPositionGroupProps = {
  positionField: InspectFieldDef | null
  aspectRatioField: InspectFieldDef | null
  zIndexField: InspectFieldDef | null
  coordinateFields: InspectFieldDef[]
  scaleField?: InspectFieldDef | null
  transformOriginField?: InspectFieldDef | null
  skewFields?: InspectFieldDef[]
  currentPosition: string
  currentOrigin?: string
  onSetPosition?: (value: string) => void
  onSetOrigin?: (value: string) => void
  renderField: (field: InspectFieldDef) => ReactNode
  renderBareControl?: (field: InspectFieldDef) => ReactNode
  groupLabel: string
}

function fieldByName(fields: InspectFieldDef[], name: string): InspectFieldDef | undefined {
  return fields.find((f) => f.name === name)
}

export function InspectPositionGroup({
  positionField,
  aspectRatioField,
  zIndexField,
  coordinateFields,
  scaleField,
  transformOriginField,
  skewFields = [],
  currentPosition,
  currentOrigin = 'center',
  onSetPosition,
  onSetOrigin,
  renderField,
  groupLabel,
}: InspectPositionGroupProps) {
  if (
    !positionField &&
    !aspectRatioField &&
    !zIndexField &&
    !coordinateFields.length &&
    !scaleField &&
    !transformOriginField &&
    !skewFields.length
  ) {
    return null
  }

  const isPositioned =
    currentPosition === 'relative' ||
    currentPosition === 'absolute' ||
    currentPosition === 'fixed' ||
    currentPosition === 'sticky'

  const topField = fieldByName(coordinateFields, 'top')
  const rightField = fieldByName(coordinateFields, 'right')
  const bottomField = fieldByName(coordinateFields, 'bottom')
  const leftField = fieldByName(coordinateFields, 'left')
  const activeOrigin = ninePointGlyphId(currentOrigin)

  return (
    <div className="creation-inspect-position-group" data-testid="inspect-position-group">
      <div className="creation-inspect-size-box__header">
        <span className="creation-inspect-size-box__label">{groupLabel}</span>
      </div>

      <div
        className="creation-inspect-position-group__body"
        style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.35rem' }}
      >
        {positionField ? (
          <div className="creation-inspect-position-group__pos">
            {onSetPosition ? (
              <InspectGlyphChips
                testId="inspect-position-mode"
                label={positionField.label}
                value={positionGlyphId(currentPosition)}
                options={POSITION_OPTIONS}
                onChange={onSetPosition}
                renderGlyph={(id) => <PositionGlyph id={id as PositionGlyphId} />}
              />
            ) : (
              renderField(positionField)
            )}
          </div>
        ) : null}

        {isPositioned ? (
          <div
            className="creation-inspect-position-group__coords"
            data-testid="inspect-position-coords"
            style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}
          >
            <div className="creation-inspect-pair">
              {topField ? renderField(topField) : null}
              {rightField ? renderField(rightField) : null}
            </div>
            <div className="creation-inspect-pair">
              {bottomField ? renderField(bottomField) : null}
              {leftField ? renderField(leftField) : null}
            </div>
            {zIndexField ? (
              <div className="creation-inspect-position-group__z-index">
                {renderField(zIndexField)}
              </div>
            ) : null}
          </div>
        ) : null}

        {aspectRatioField ? (
          <div className="creation-inspect-position-group__aspect" style={{ marginTop: '0.2rem' }}>
            {renderField(aspectRatioField)}
          </div>
        ) : null}

        {scaleField || transformOriginField || skewFields.length > 0 ? (
          <div
            className="creation-inspect-transform-group"
            data-testid="inspect-transform-group"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.3rem',
              marginTop: '0.2rem',
              paddingTop: '0.35rem',
              borderTop: '1px solid var(--line-subtle, var(--line))',
            }}
          >
            {scaleField ? <div className="creation-inspect-pair">{renderField(scaleField)}</div> : null}
            {transformOriginField && onSetOrigin ? (
              <div data-testid="inspect-transform-origin">
                <div className="creation-inspect-span-axis__label">{transformOriginField.label}</div>
                <div className="creation-inspect-media-pos">
                  <div
                    className="creation-inspect-media-pos__grid"
                    role="group"
                    aria-label={transformOriginField.label}
                  >
                    {ORIGIN_POINTS.map((p) => {
                      const isActive = activeOrigin === p.id
                      return (
                        <button
                          key={p.id}
                          type="button"
                          title={p.title}
                          aria-label={p.title}
                          aria-pressed={isActive}
                          data-testid={`inspect-transform-origin-${p.id}`}
                          className={`creation-inspect-media-pos__btn${isActive ? ' is-active' : ''}`}
                          onClick={() => onSetOrigin(ninePointWriteValue(p.id))}
                        >
                          <TransformOriginGlyph id={p.id} />
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : transformOriginField ? (
              renderField(transformOriginField)
            ) : null}
            {skewFields.length > 0 ? (
              <div className="creation-inspect-pair">{skewFields.map((f) => renderField(f))}</div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
