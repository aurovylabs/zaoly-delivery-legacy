import type { InputHTMLAttributes } from 'react'
import type { FieldSize } from './Field'

export type InputProps = {
  size?: FieldSize
  /** Full width in flex/grid parents */
  block?: boolean
  className?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'className'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Text input — specs/domain/zaoly-ui-field.md
 * `block` = full width (`ds-input--block`). Legacy toolbar chrome: pass `className="search-input"`.
 */
export function Input({
  size = 'sm',
  block = false,
  className,
  type = 'text',
  ...rest
}: InputProps) {
  return (
    <input
      type={type}
      className={cx('ds-input', `ds-input--${size}`, block && 'ds-input--block', className)}
      {...rest}
    />
  )
}
