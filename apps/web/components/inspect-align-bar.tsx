'use client'

import type { InspectFieldDef } from '../lib/inspect/field-catalog'
import { pickAlignField, pickJustifyField } from '../lib/inspect/layout-flow-groups'
import { DistributeGlyph } from './inspect-mode-glyphs'

export type InspectAlignDistributeMode = 'packed' | 'even' | 'around'

export type InspectAlignBarProps = {
  fields: InspectFieldDef[]
  direction?: string
  currentJc?: string
  currentAi?: string
  onCommitAlign?: (jc: string, ai: string) => void
  distributePackedLabel?: string
  distributeEvenLabel?: string
  distributeAroundLabel?: string
  stretchLabel?: string
  matrixLabel?: string
}

function normalizeAxis(value: string): string {
  if (value === 'start') return 'flex-start'
  if (value === 'end') return 'flex-end'
  return value
}

export function inspectAlignDistributeMode(jc: string): InspectAlignDistributeMode {
  const norm = normalizeAxis(jc)
  if (norm === 'space-around') return 'around'
  if (norm === 'space-between') return 'even'
  return 'packed'
}

export function nextInspectAlignDistributeJc(mode: InspectAlignDistributeMode): string {
  if (mode === 'packed') return 'space-between'
  if (mode === 'even') return 'space-around'
  return 'flex-start'
}

export function InspectAlignBar({
  fields,
  direction = 'column',
  currentJc = 'flex-start',
  currentAi = 'flex-start',
  onCommitAlign,
  distributePackedLabel = 'Distribute: Packed',
  distributeEvenLabel = 'Distribute: Even',
  distributeAroundLabel = 'Distribute: Around',
  stretchLabel = 'Stretch',
  matrixLabel = 'Alignment matrix',
}: InspectAlignBarProps) {
  const justify = pickJustifyField(fields)
  const align = pickAlignField(fields)
  if (!justify && !align) return null
  if (!onCommitAlign) return null

  const normJc = normalizeAxis(currentJc)
  const normAi = normalizeAxis(currentAi)
  const isRow = direction === 'row' || direction === 'row-reverse'
  const distributeMode = inspectAlignDistributeMode(normJc)
  const isDistributed = distributeMode !== 'packed'
  const isStretch = normAi === 'stretch'

  let activeCol = 0
  let activeRow = 0
  if (isRow) {
    activeCol = normJc === 'center' ? 1 : normJc === 'flex-end' ? 2 : 0
    activeRow = isStretch ? -1 : normAi === 'center' ? 1 : normAi === 'flex-end' ? 2 : 0
  } else {
    activeRow = normJc === 'center' ? 1 : normJc === 'flex-end' ? 2 : 0
    activeCol = isStretch ? -1 : normAi === 'center' ? 1 : normAi === 'flex-end' ? 2 : 0
  }

  const rowLabels = ['Top', 'Center', 'Bottom']
  const colLabels = ['Left', 'Center', 'Right']
  const distributeLabel =
    distributeMode === 'around'
      ? distributeAroundLabel
      : distributeMode === 'even'
        ? distributeEvenLabel
        : distributePackedLabel

  const spatialLabel = isStretch
    ? stretchLabel
    : isDistributed
      ? distributeLabel
      : activeRow === 1 && activeCol === 1
        ? 'Center'
        : activeRow >= 0 && activeCol >= 0
          ? `${rowLabels[activeRow]} ${colLabels[activeCol]}`
          : stretchLabel

  function handleCellClick(col: number, row: number) {
    if (!onCommitAlign) return
    let nextJc: string
    let nextAi: string

    if (isRow) {
      nextJc = col === 1 ? 'center' : col === 2 ? 'flex-end' : 'flex-start'
      nextAi = row === 1 ? 'center' : row === 2 ? 'flex-end' : 'flex-start'
    } else {
      nextJc = row === 1 ? 'center' : row === 2 ? 'flex-end' : 'flex-start'
      nextAi = col === 1 ? 'center' : col === 2 ? 'flex-end' : 'flex-start'
    }
    onCommitAlign(nextJc, nextAi)
  }

  function handleCycleDistribute() {
    if (!onCommitAlign) return
    onCommitAlign(nextInspectAlignDistributeJc(distributeMode), normAi)
  }

  function handleToggleStretch() {
    if (!onCommitAlign) return
    const nextAi = isStretch ? 'flex-start' : 'stretch'
    const nextJc = isDistributed ? normJc : normJc === 'center' || normJc === 'flex-end' ? normJc : 'flex-start'
    onCommitAlign(nextJc, nextAi)
  }

  return (
    <div className="creation-inspect-align-bar" data-testid="inspect-align-bar">
      <div className="creation-inspect-align-matrix-card" data-testid="inspect-align-matrix">
        <div className="creation-inspect-align-matrix-grid" role="grid" aria-label={matrixLabel}>
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => {
              const isActive =
                !isDistributed && !isStretch && activeCol === c && activeRow === r
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  role="gridcell"
                  aria-selected={isActive}
                  className={`creation-inspect-align-matrix-dot ${
                    isActive ? 'creation-inspect-align-matrix-dot--active' : ''
                  }`}
                  title={`${rowLabels[r]} ${colLabels[c]}`}
                  onClick={() => handleCellClick(c, r)}
                >
                  <span className="creation-inspect-align-matrix-pip" />
                </button>
              )
            }),
          )}
        </div>
        <div className="creation-inspect-align-matrix-info">
          <span className="creation-inspect-align-matrix-title">{spatialLabel}</span>
          <button
            type="button"
            className={`creation-inspect-align-space-between-btn ${
              isDistributed ? 'creation-inspect-align-space-between-btn--active' : ''
            }`}
            data-testid="inspect-align-distribute"
            data-distribute-mode={distributeMode}
            title={distributeLabel}
            onClick={handleCycleDistribute}
          >
            <DistributeGlyph id={distributeMode === 'packed' ? 'packed' : 'even'} />
            <span>{distributeLabel}</span>
          </button>
          <button
            type="button"
            className={`creation-inspect-align-space-between-btn ${
              isStretch ? 'creation-inspect-align-space-between-btn--active' : ''
            }`}
            data-testid="inspect-align-stretch"
            title={stretchLabel}
            onClick={handleToggleStretch}
          >
            <span>{stretchLabel}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
