import type { HTMLAttributes } from 'react'
import {
  ACCENT_OPTIONS,
  type AccentOption,
  type AccentPreference,
} from '../accentPreference'

export type AccentSwatchGroupProps = {
  value: AccentPreference
  onChange: (next: AccentPreference) => void
  options?: AccentOption[]
  /** Accessible names per id; falls back to id */
  labels?: Partial<Record<AccentPreference, string>>
  className?: string
  'aria-label'?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'onChange' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Compact accent swatches for Settings Appearance — specs/domain/zaoly-ui-settings-shell.md
 */
export function AccentSwatchGroup({
  value,
  onChange,
  options = ACCENT_OPTIONS,
  labels,
  className,
  'aria-label': ariaLabel = 'Accent color',
  ...rest
}: AccentSwatchGroupProps) {
  return (
    <div
      className={cx('ds-accent-swatches', className)}
      role="group"
      aria-label={ariaLabel}
      data-testid="accent-swatch-group"
      {...rest}
    >
      {options.map((option) => {
        const selected = value === option.id
        const label = labels?.[option.id] ?? option.id
        return (
          <button
            key={option.id}
            type="button"
            className={cx('ds-accent-swatch', selected && 'ds-accent-swatch--selected')}
            aria-label={label}
            aria-pressed={selected}
            data-accent={option.id}
            data-selected={selected ? 'true' : undefined}
            onClick={() => onChange(option.id)}
            style={{ backgroundColor: option.preview }}
          />
        )
      })}
    </div>
  )
}
