import type { HTMLAttributes, ReactNode } from 'react'
import { Slider } from './Slider'

export type MeterProps = {
  label: ReactNode
  /** Optional muted hint beside or under the label */
  hint?: ReactNode
  /** End readout (e.g. `50%`) */
  valueLabel?: ReactNode
  value: number
  min?: number
  max?: number
  step?: number
  onChange?: (value: number) => void
  onCommit?: (value: number) => void
  disabled?: boolean
  id?: string
  className?: string
  /** Accessible name for the range when label is not a string */
  'aria-label'?: string
}

export type MeterListProps = {
  children: ReactNode
  className?: string
  'aria-label'?: string
} & Omit<HTMLAttributes<HTMLUListElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Labeled editable meter row — specs/domain/zaoly-ui-meter.md
 */
export function Meter({
  label,
  hint,
  valueLabel,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  onCommit,
  disabled,
  id,
  className,
  'aria-label': ariaLabel,
}: MeterProps) {
  const rangeLabel =
    ariaLabel ?? (typeof label === 'string' ? label : undefined)

  return (
    <li className={cx('ds-meter', className)}>
      <div className="ds-meter-head">
        <span className="ds-meter-label">
          {id ? (
            <label htmlFor={id}>{label}</label>
          ) : (
            label
          )}
          {hint != null ? <span className="ds-meter-hint">{hint}</span> : null}
        </span>
        {valueLabel != null ? (
          <span className="ds-meter-value" aria-hidden>
            {valueLabel}
          </span>
        ) : null}
      </div>
      <Slider
        id={id}
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={onChange}
        onCommit={onCommit}
        aria-label={rangeLabel}
      />
    </li>
  )
}

/** Vertical stack of `Meter` rows. */
export function MeterList({
  children,
  className,
  'aria-label': ariaLabel,
  ...rest
}: MeterListProps) {
  return (
    <ul className={cx('ds-meter-list', className)} aria-label={ariaLabel} {...rest}>
      {children}
    </ul>
  )
}
