import type { ReactNode } from 'react'
import { Chip } from './Chip'
import type { ChipSize } from './Chip'

export type ToggleOption = {
  value: string
  label: ReactNode
  /** When `variant="icon"`, shown instead of the label; `label` stays the accessible name. */
  icon?: ReactNode
  disabled?: boolean
}

export type ToggleGroupVariant = 'chip' | 'icon'

export type ToggleGroupProps = {
  options: ToggleOption[]
  value: string
  onChange: (value: string) => void
  size?: ChipSize
  /** `icon` = square chips; option `label` is `aria-label`. */
  variant?: ToggleGroupVariant
  className?: string
  'aria-label'?: string
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Exclusive chip toggle (locale/theme) — specs/domain/zaoly-ui-foundation.md
 * Uses `<Chip>`; not a native radio group chrome.
 */
export function ToggleGroup({
  options,
  value,
  onChange,
  size = 'sm',
  variant = 'chip',
  className,
  'aria-label': ariaLabel,
}: ToggleGroupProps) {
  const icon = variant === 'icon'
  return (
    <div
      className={cx(
        'ds-toggle-group',
        'locale-toggle',
        'ds-chip-row',
        icon && 'ds-toggle-group--icon',
        className,
      )}
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const name = typeof opt.label === 'string' ? opt.label : undefined
        return (
          <Chip
            key={opt.value}
            size={size}
            selected={value === opt.value}
            disabled={opt.disabled}
            className={icon ? 'ds-chip--icon' : undefined}
            aria-label={icon ? name : undefined}
            onClick={() => onChange(opt.value)}
          >
            {icon ? (opt.icon ?? opt.label) : opt.label}
          </Chip>
        )
      })}
    </div>
  )
}
