'use client'

import type { InspectFieldDef } from '../lib/inspect/field-catalog'
import {
  ALIGN_SELF_PIN_CELLS,
  alignSelfPinRow,
  nextAlignSelfValue,
  normalizeAlignSelfValue,
  type AlignSelfValue,
} from '../lib/inspect/align-self-grid'
import { SelfParkGlyph } from './inspect-mode-glyphs'

type InspectAlignSelfGridProps = {
  field: InspectFieldDef
  value: string
  onChange: (next: string) => void
  groupLabel: string
  stretchLabel: string
  autoLabel: string
  disabled?: boolean
}

export function InspectAlignSelfGrid({
  field,
  value,
  onChange,
  groupLabel,
  stretchLabel,
  autoLabel,
  disabled,
}: InspectAlignSelfGridProps) {
  const current = normalizeAlignSelfValue(value)
  const activeRow = alignSelfPinRow(current)

  function commit(next: AlignSelfValue) {
    if (disabled) return
    onChange(nextAlignSelfValue(current, next))
  }

  return (
    <div
      className="creation-inspect-align-self"
      data-testid="inspect-align-self-grid"
      data-align-self={current || 'unset'}
    >
      <span className="creation-inspect-align-self__label">{groupLabel}</span>
      <div className="creation-inspect-align-self__body">
        <div
          className="creation-inspect-align-self__grid"
          role="group"
          aria-label={field.label}
        >
          {ALIGN_SELF_PIN_CELLS.map((cell) => {
            const active = activeRow === cell.row
            return (
              <button
                key={cell.id}
                type="button"
                className={
                  active
                    ? 'creation-inspect-align-self__pin creation-inspect-align-self__pin--active'
                    : 'creation-inspect-align-self__pin'
                }
                aria-pressed={active}
                aria-label={`${field.label}: ${cell.value}`}
                data-testid={`inspect-align-self-pin-${cell.id}`}
                data-pin-row={cell.row}
                disabled={disabled}
                onClick={() => commit(cell.value)}
              />
            )
          })}
        </div>
        <div className="creation-inspect-align-self__modes">
          <button
            type="button"
            className={
              current === 'stretch'
                ? 'creation-inspect-align-self__mode creation-inspect-align-self__mode--active'
                : 'creation-inspect-align-self__mode'
            }
            aria-pressed={current === 'stretch'}
            aria-label={stretchLabel}
            data-testid="inspect-align-self-stretch"
            disabled={disabled}
            onClick={() => commit('stretch')}
          >
            <SelfParkGlyph id="stretch" axis="v" />
          </button>
          <button
            type="button"
            className={
              current === 'auto' || current === ''
                ? 'creation-inspect-align-self__mode creation-inspect-align-self__mode--active'
                : 'creation-inspect-align-self__mode'
            }
            aria-pressed={current === 'auto' || current === ''}
            aria-label={autoLabel}
            data-testid="inspect-align-self-auto"
            disabled={disabled}
            onClick={() => commit('auto')}
          >
            <SelfParkGlyph id="auto" axis="v" />
          </button>
        </div>
      </div>
    </div>
  )
}
