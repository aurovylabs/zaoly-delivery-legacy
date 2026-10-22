'use client'

import type { ReactNode } from 'react'

export type InspectGlyphChipOption = {
  value: string
  label: string
}

type InspectGlyphChipsProps = {
  options: InspectGlyphChipOption[]
  value: string
  onChange: (value: string) => void
  renderGlyph: (value: string) => ReactNode
  label?: string
  testId?: string
  ariaLabel?: string
}

/** Shared inspect chip row for DS layout glyphs (grid-preset visual language). */
export function InspectGlyphChips({
  options,
  value,
  onChange,
  renderGlyph,
  label,
  testId,
  ariaLabel,
}: InspectGlyphChipsProps) {
  return (
    <div className="creation-inspect-glyph-chips" data-testid={testId}>
      {label ? <div className="creation-inspect-glyph-chips__label">{label}</div> : null}
      <div
        className="creation-inspect-glyph-chips__row"
        role="group"
        aria-label={ariaLabel ?? label}
      >
        {options.map((opt) => {
          const isActive = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              className={`creation-inspect-grid-preset-btn${isActive ? ' is-active' : ''}`}
              aria-pressed={isActive}
              title={opt.label}
              aria-label={opt.label}
              onClick={() => onChange(opt.value)}
            >
              {renderGlyph(opt.value)}
              <span className="creation-inspect-grid-preset-btn__label">{opt.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
