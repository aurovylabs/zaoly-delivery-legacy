'use client'

/**
 * Smart HUD value control — Zaoly Field + Select (custom listbox, not OS `<select>`).
 * Dense mode: Wave icon from `inspectPropIcon` + value (no text label).
 * Spec: `specs/domain/canvas-smart-hud.md` · DS: `zaoly-ui-field.md` · `zaoly-ui-icon-language.md`
 */
import React, { useMemo, type ReactNode } from 'react'
import { Field, Select, type SelectOption } from '../lib/zaoly-ui'
import { inspectPropIcon } from '../lib/inspect/icons'

export type HudChipMenuOption = {
  value: string
  label: string
  /** Rich option label (swatch / font preview); falls back to `label` */
  optionLabel?: React.ReactNode
}

export function HudSlotValueChip({
  slotKey,
  label,
  displayValue,
  currentValue,
  disabled,
  options,
  onPick,
  leading,
  icon,
}: {
  slotKey: string
  label: string
  /** Pretty text when current value is not in the curated list */
  displayValue: string
  currentValue: string
  disabled?: boolean
  options: HudChipMenuOption[]
  onPick: (value: string) => void
  leading?: React.ReactNode
  /** Override leading Field icon (default: inspectPropIcon). */
  icon?: ReactNode
}) {
  const selectOptions: SelectOption[] = useMemo(() => {
    const mapped = options.map((opt) => ({
      value: opt.value,
      label: opt.optionLabel ?? (
        <span className="creation-canvas-floating-hud__select-option">
          {leading && opt.value === currentValue ? leading : null}
          {opt.label}
        </span>
      ),
    }))
    if (currentValue && !mapped.some((o) => o.value === currentValue)) {
      return [
        {
          value: currentValue,
          label: (
            <span className="creation-canvas-floating-hud__select-option">
              {leading}
              {displayValue}
            </span>
          ),
        },
        ...mapped,
      ]
    }
    return mapped
  }, [options, currentValue, displayValue, leading])

  const fieldIcon = icon ?? inspectPropIcon(slotKey)

  return (
    <div
      className="creation-canvas-floating-hud__chip creation-canvas-floating-hud__chip--dense"
      data-testid={`hud-slot-${slotKey}`}
      title={label}
    >
      <Field
        label={label}
        icon={fieldIcon}
        layout="inline"
        size="sm"
        className="creation-canvas-floating-hud__field creation-canvas-floating-hud__field--dense"
      >
        <Select
          size="sm"
          disabled={disabled}
          value={currentValue || undefined}
          placeholder={displayValue || '—'}
          aria-label={`${label}: ${displayValue}`}
          options={selectOptions}
          onChange={(next) => onPick(next)}
          className="creation-canvas-floating-hud__ds-select"
        />
      </Field>
    </div>
  )
}

export function hudPrettyOptionLabel(
  options: { value: string; label: string }[] | undefined,
  value: string,
): string {
  if (!value) return '—'
  const hit = options?.find((o) => o.value === value)
  if (hit) return hit.label
  if (value.includes('.')) {
    const leaf = value.split('.').filter(Boolean).slice(-1)[0]
    return leaf || value
  }
  return value.length > 16 ? `${value.slice(0, 15)}…` : value
}
