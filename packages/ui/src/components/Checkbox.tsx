import type { InputHTMLAttributes, ReactNode } from 'react'

export type CheckboxProps = {
  label?: ReactNode
  className?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Native checkbox + label — specs/domain/zaoly-ui-extended.md */
export function Checkbox({ label, className, id, ...rest }: CheckboxProps) {
  const input = (
    <input
      type="checkbox"
      id={id}
      className={cx('ds-checkbox', className)}
      {...rest}
    />
  )
  if (label == null) return input
  return (
    <label className="ds-check-label" htmlFor={id}>
      {input}
      <span className="ds-check-text">{label}</span>
    </label>
  )
}
