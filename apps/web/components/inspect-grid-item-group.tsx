'use client'

import type { ReactNode } from 'react'
import type { InspectFieldDef } from '../lib/inspect/field-catalog'
import { GridSpanGlyph, spanGlyphForPresetLabel } from './inspect-grid-glyphs'

type InspectGridItemGroupProps = {
  colSpanField?: InspectFieldDef | null
  colStartField?: InspectFieldDef | null
  colEndField?: InspectFieldDef | null
  rowSpanField?: InspectFieldDef | null
  rowStartField?: InspectFieldDef | null
  rowEndField?: InspectFieldDef | null
  justifySelfField?: InspectFieldDef | null
  alignSelfField?: InspectFieldDef | null
  orderField?: InspectFieldDef | null
  currentColSpan?: string
  currentRowSpan?: string
  onSetSpan: (axis: 'col' | 'row', span: string) => void
  renderField: (field: InspectFieldDef) => ReactNode
  groupLabel?: string
}

const COL_SPAN_PRESETS = [
  { label: 'Auto', value: 'auto' },
  { label: '1', value: 'span 1' },
  { label: '2', value: 'span 2' },
  { label: '3', value: 'span 3' },
  { label: '4', value: 'span 4' },
  { label: '6', value: 'span 6' },
  { label: '12', value: 'span 12' },
  { label: 'Full', value: '1 / -1' },
]

const ROW_SPAN_PRESETS = [
  { label: 'Auto', value: 'auto' },
  { label: '1', value: 'span 1' },
  { label: '2', value: 'span 2' },
  { label: '3', value: 'span 3' },
  { label: '4', value: 'span 4' },
  { label: 'Full', value: '1 / -1' },
]

export function InspectGridItemGroup({
  colSpanField,
  colStartField,
  colEndField,
  rowSpanField,
  rowStartField,
  rowEndField,
  justifySelfField,
  alignSelfField,
  orderField,
  currentColSpan = 'auto',
  currentRowSpan = 'auto',
  onSetSpan,
  renderField,
  groupLabel = 'Grid Item Placement',
}: InspectGridItemGroupProps) {
  if (
    !colSpanField &&
    !colStartField &&
    !colEndField &&
    !rowSpanField &&
    !rowStartField &&
    !rowEndField &&
    !justifySelfField &&
    !orderField
  ) {
    return null
  }

  return (
    <div className="creation-inspect-grid-item-group" data-testid="inspect-grid-item-group">
      <div className="creation-inspect-grid-item-group__header">
        <span className="creation-inspect-grid-item-group__label">{groupLabel}</span>
      </div>

      <div className="creation-inspect-grid-item-group__body">
        <div className="creation-inspect-span-axis">
          <div className="creation-inspect-span-axis__label">Column Span</div>
          <div className="creation-inspect-span-axis__chips">
            {COL_SPAN_PRESETS.map((p) => {
              const isActive =
                currentColSpan === p.value || (!currentColSpan && p.value === 'auto')
              return (
                <button
                  key={p.label}
                  type="button"
                  className={`creation-inspect-span-btn${isActive ? ' is-active' : ''}`}
                  aria-pressed={isActive}
                  title={`Column span: ${p.label}`}
                  onClick={() => onSetSpan('col', p.value)}
                >
                  <GridSpanGlyph id={spanGlyphForPresetLabel(p.label)} axis="col" />
                  <span className="creation-inspect-span-btn__label">{p.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="creation-inspect-span-axis">
          <div className="creation-inspect-span-axis__label">Row Span</div>
          <div className="creation-inspect-span-axis__chips">
            {ROW_SPAN_PRESETS.map((p) => {
              const isActive =
                currentRowSpan === p.value || (!currentRowSpan && p.value === 'auto')
              return (
                <button
                  key={p.label}
                  type="button"
                  className={`creation-inspect-span-btn${isActive ? ' is-active' : ''}`}
                  aria-pressed={isActive}
                  title={`Row span: ${p.label}`}
                  onClick={() => onSetSpan('row', p.value)}
                >
                  <GridSpanGlyph id={spanGlyphForPresetLabel(p.label)} axis="row" />
                  <span className="creation-inspect-span-btn__label">{p.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {(colStartField || colEndField) ? (
          <div className="creation-inspect-pair creation-inspect-grid-item-pair">
            {colStartField ? (
              <div className="creation-inspect-grid-item-pair__field">{renderField(colStartField)}</div>
            ) : null}
            {colEndField ? (
              <div className="creation-inspect-grid-item-pair__field">{renderField(colEndField)}</div>
            ) : null}
          </div>
        ) : null}

        {(rowStartField || rowEndField) ? (
          <div className="creation-inspect-pair creation-inspect-grid-item-pair">
            {rowStartField ? (
              <div className="creation-inspect-grid-item-pair__field">{renderField(rowStartField)}</div>
            ) : null}
            {rowEndField ? (
              <div className="creation-inspect-grid-item-pair__field">{renderField(rowEndField)}</div>
            ) : null}
          </div>
        ) : null}

        {(justifySelfField || alignSelfField) ? (
          <div className="creation-inspect-pair creation-inspect-grid-item-pair">
            {justifySelfField ? (
              <div className="creation-inspect-grid-item-pair__field">{renderField(justifySelfField)}</div>
            ) : null}
            {alignSelfField ? (
              <div className="creation-inspect-grid-item-pair__field">{renderField(alignSelfField)}</div>
            ) : null}
          </div>
        ) : null}

        {orderField ? (
          <div className="creation-inspect-order creation-inspect-grid-item-order">
            {renderField(orderField)}
          </div>
        ) : null}
      </div>
    </div>
  )
}
