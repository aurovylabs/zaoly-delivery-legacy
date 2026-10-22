'use client'

import { useState, type ReactNode } from 'react'
import type { InspectFieldDef } from '../lib/inspect/field-catalog'
import { GridColumnGlyph, columnGlyphForPresetLabel } from './inspect-grid-glyphs'
import { CellParkGlyph, cellParkGlyphId, type CellParkGlyphId } from './inspect-mode-glyphs'
import { InspectGlyphChips } from './inspect-glyph-chips'
import {
  AutoFlowGlyph,
  autoFlowGlyphId,
  type AutoFlowGlyphId,
} from './inspect-mode-glyphs'

const AUTO_FLOW_CHIP_OPTIONS: Array<{ value: string; label: string; glyph: AutoFlowGlyphId }> = [
  { value: 'row', label: 'row', glyph: 'row' },
  { value: 'column', label: 'column', glyph: 'column' },
  { value: 'row dense', label: 'dense', glyph: 'dense' },
]

export interface GridPreset {
  label: string
  template: string
  columns?: string
  description?: string
  group: 'equal' | 'responsive' | 'splits'
}

export const GRID_PRESETS: GridPreset[] = [
  { label: '1 Col', template: 'repeat(1, minmax(0, 1fr))', columns: '1', group: 'equal' },
  { label: '2 Col', template: 'repeat(2, minmax(0, 1fr))', columns: '2', group: 'equal' },
  { label: '3 Col', template: 'repeat(3, minmax(0, 1fr))', columns: '3', group: 'equal' },
  { label: '4 Col', template: 'repeat(4, minmax(0, 1fr))', columns: '4', group: 'equal' },
  { label: '6 Col', template: 'repeat(6, minmax(0, 1fr))', columns: '6', group: 'equal' },
  { label: '12 Col', template: 'repeat(12, minmax(0, 1fr))', columns: '12', group: 'equal' },
  {
    label: 'Auto-Fit',
    template: 'repeat(auto-fit, minmax(280px, 1fr))',
    description: 'Responsive Cards',
    group: 'responsive',
  },
  {
    label: 'Auto-Fill',
    template: 'repeat(auto-fill, minmax(200px, 1fr))',
    description: 'Dense Fill',
    group: 'responsive',
  },
  { label: '1 : 2', template: '1fr 2fr', description: 'Split', group: 'splits' },
  { label: '2 : 1', template: '2fr 1fr', description: 'Split', group: 'splits' },
  { label: 'Sidebar', template: '280px 1fr', description: 'Fixed Nav', group: 'splits' },
  { label: '3-Pane', template: '240px 1fr 240px', description: 'Holy Grail', group: 'splits' },
]

export const GRID_PRESET_GROUPS: Array<{
  id: GridPreset['group']
  labelKey: 'equal' | 'responsive' | 'splits'
}> = [
  { id: 'equal', labelKey: 'equal' },
  { id: 'responsive', labelKey: 'responsive' },
  { id: 'splits', labelKey: 'splits' },
]

const CELL_PARK_VALUES: CellParkGlyphId[] = ['start', 'center', 'end', 'stretch']

type InspectGridGroupProps = {
  columnsField?: InspectFieldDef | null
  gridTemplateColumnsField?: InspectFieldDef | null
  gridTemplateRowsField?: InspectFieldDef | null
  gridAutoFlowField?: InspectFieldDef | null
  gridAutoRowsField?: InspectFieldDef | null
  gridAutoColumnsField?: InspectFieldDef | null
  justifyItemsField?: InspectFieldDef | null
  alignItemsField?: InspectFieldDef | null
  currentTemplate?: string
  currentColumns?: string | number
  currentJustifyItems?: string
  currentAlignItems?: string
  currentAutoFlow?: string
  onApplyPreset: (preset: GridPreset) => void
  onSetCellAlign?: (prop: string, value: string) => void
  onSetAutoFlow?: (value: string) => void
  renderField: (field: InspectFieldDef) => ReactNode
  groupLabel?: string
  columnsLabel?: string
  advancedLabel?: string
  equalGroupLabel?: string
  responsiveGroupLabel?: string
  splitsGroupLabel?: string
  justifyItemsLabel?: string
  alignItemsLabel?: string
}

function CellParkTiles({
  axis,
  propName,
  current,
  label,
  onSet,
}: {
  axis: 'h' | 'v'
  propName: string
  current: string
  label: string
  onSet: (prop: string, value: string) => void
}) {
  const active = cellParkGlyphId(current || 'stretch')
  return (
    <div
      className="creation-inspect-grid-cell-align__axis"
      data-testid={`inspect-grid-cell-park-${propName}`}
    >
      <div className="creation-inspect-grid-cell-align__axis-label">{label}</div>
      <div className="creation-inspect-grid-cell-align__chips" role="group" aria-label={label}>
        {CELL_PARK_VALUES.map((id) => {
          const isActive = active === id
          return (
            <button
              key={id}
              type="button"
              className={`creation-inspect-grid-preset-btn${isActive ? ' is-active' : ''}`}
              aria-pressed={isActive}
              title={id}
              onClick={() => onSet(propName, id)}
            >
              <CellParkGlyph id={id} axis={axis} />
              <span className="creation-inspect-grid-preset-btn__label">{id}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function InspectGridGroup({
  columnsField,
  gridTemplateColumnsField,
  gridTemplateRowsField,
  gridAutoFlowField,
  gridAutoRowsField,
  gridAutoColumnsField,
  justifyItemsField,
  alignItemsField,
  currentTemplate = '',
  currentColumns = 2,
  currentJustifyItems = 'stretch',
  currentAlignItems = 'stretch',
  currentAutoFlow = 'row',
  onApplyPreset,
  onSetCellAlign,
  onSetAutoFlow,
  renderField,
  groupLabel = 'Columns',
  advancedLabel = 'Advanced',
  equalGroupLabel = 'Equal',
  responsiveGroupLabel = 'Responsive',
  splitsGroupLabel = 'Splits',
  justifyItemsLabel = 'Justify items',
  alignItemsLabel = 'Align items',
}: InspectGridGroupProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const groupLabels: Record<GridPreset['group'], string> = {
    equal: equalGroupLabel,
    responsive: responsiveGroupLabel,
    splits: splitsGroupLabel,
  }

  const showColumnsEnum = Boolean(columnsField) && !gridTemplateColumnsField
  const hasAdvanced =
    Boolean(gridTemplateColumnsField) ||
    Boolean(gridTemplateRowsField) ||
    Boolean(gridAutoFlowField) ||
    Boolean(gridAutoRowsField) ||
    Boolean(gridAutoColumnsField)

  const useCellParkTiles =
    Boolean(onSetCellAlign) && Boolean(justifyItemsField || alignItemsField)

  return (
    <div className="creation-inspect-grid-group" data-testid="inspect-grid-group">
      <div className="creation-inspect-grid-group__header">
        <span className="creation-inspect-grid-group__label">{groupLabel}</span>
      </div>

      <div className="creation-inspect-grid-presets">
        {GRID_PRESET_GROUPS.map((group) => {
          const presets = GRID_PRESETS.filter((p) => p.group === group.id)
          return (
            <div
              key={group.id}
              className="creation-inspect-grid-preset-group"
              data-testid={`inspect-grid-preset-group-${group.id}`}
            >
              <div className="creation-inspect-grid-preset-group__label">
                {groupLabels[group.id]}
              </div>
              <div className="creation-inspect-grid-preset-group__chips">
                {presets.map((p) => {
                  const isActive =
                    currentTemplate === p.template ||
                    (!currentTemplate && String(currentColumns) === p.columns)
                  return (
                    <button
                      key={p.label}
                      type="button"
                      className={`creation-inspect-grid-preset-btn${isActive ? ' is-active' : ''}`}
                      onClick={() => onApplyPreset(p)}
                      title={p.description ? `${p.description}: ${p.template}` : p.template}
                      aria-pressed={isActive}
                    >
                      <GridColumnGlyph id={columnGlyphForPresetLabel(p.label)} />
                      <span className="creation-inspect-grid-preset-btn__label">{p.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {useCellParkTiles ? (
        <div
          className="creation-inspect-grid-cell-align creation-inspect-grid-cell-align--tiles"
          data-testid="inspect-grid-cell-align"
        >
          {justifyItemsField ? (
            <CellParkTiles
              axis="h"
              propName={justifyItemsField.name}
              current={currentJustifyItems}
              label={justifyItemsField.label || justifyItemsLabel}
              onSet={onSetCellAlign!}
            />
          ) : null}
          {alignItemsField ? (
            <CellParkTiles
              axis="v"
              propName={alignItemsField.name}
              current={currentAlignItems}
              label={alignItemsField.label || alignItemsLabel}
              onSet={onSetCellAlign!}
            />
          ) : null}
        </div>
      ) : justifyItemsField || alignItemsField ? (
        <div className="creation-inspect-pair creation-inspect-grid-cell-align">
          {justifyItemsField ? (
            <div className="creation-inspect-grid-cell-align__field">
              {renderField(justifyItemsField)}
            </div>
          ) : null}
          {alignItemsField ? (
            <div className="creation-inspect-grid-cell-align__field">
              {renderField(alignItemsField)}
            </div>
          ) : null}
        </div>
      ) : null}

      {showColumnsEnum ? (
        <div className="creation-inspect-grid-columns">{renderField(columnsField!)}</div>
      ) : null}

      {hasAdvanced ? (
        <div className="creation-inspect-grid-advanced" data-testid="inspect-grid-advanced">
          <button
            type="button"
            className="creation-inspect-grid-advanced__toggle"
            aria-expanded={advancedOpen}
            data-testid="inspect-grid-advanced-toggle"
            onClick={() => setAdvancedOpen((v) => !v)}
          >
            {advancedLabel}
          </button>
          {advancedOpen ? (
            <div className="creation-inspect-grid-advanced__body">
              {gridTemplateColumnsField ? (
                <div className="creation-inspect-grid-template-cols">
                  {renderField(gridTemplateColumnsField)}
                </div>
              ) : null}
              {gridTemplateRowsField ? (
                <div className="creation-inspect-grid-template-rows">
                  {renderField(gridTemplateRowsField)}
                </div>
              ) : null}
              {(gridAutoFlowField || gridAutoRowsField) ? (
                <div className="creation-inspect-pair">
                  {gridAutoFlowField ? (
                    <div className="creation-inspect-grid-advanced__half">
                      {onSetAutoFlow ? (
                        <InspectGlyphChips
                          testId="inspect-grid-auto-flow"
                          label={gridAutoFlowField.label}
                          value={
                            String(currentAutoFlow).includes('dense')
                              ? 'row dense'
                              : autoFlowGlyphId(String(currentAutoFlow)) === 'column'
                                ? 'column'
                                : 'row'
                          }
                          options={AUTO_FLOW_CHIP_OPTIONS.map(({ value, label }) => ({
                            value,
                            label,
                          }))}
                          onChange={onSetAutoFlow}
                          renderGlyph={(id) => (
                            <AutoFlowGlyph
                              id={
                                AUTO_FLOW_CHIP_OPTIONS.find((o) => o.value === id)?.glyph ??
                                autoFlowGlyphId(id)
                              }
                            />
                          )}
                        />
                      ) : (
                        renderField(gridAutoFlowField)
                      )}
                    </div>
                  ) : null}
                  {gridAutoRowsField ? (
                    <div className="creation-inspect-grid-advanced__half">
                      {renderField(gridAutoRowsField)}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {gridAutoColumnsField ? (
                <div className="creation-inspect-grid-advanced__full">
                  {renderField(gridAutoColumnsField)}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
