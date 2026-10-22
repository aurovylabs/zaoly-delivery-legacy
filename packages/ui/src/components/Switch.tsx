import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type SwitchProps = {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  label?: ReactNode
  className?: string
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'className' | 'children' | 'onClick' | 'role' | 'aria-checked'
>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Boolean switch — specs/domain/zaoly-ui-extended.md */
export function Switch({
  checked = false,
  onCheckedChange,
  label,
  className,
  disabled,
  id,
  ...rest
}: SwitchProps) {
  const control = (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={cx('ds-switch', checked && 'ds-switch--on', className)}
      onClick={() => onCheckedChange?.(!checked)}
      {...rest}
    >
      <span className="ds-switch-thumb" aria-hidden />
    </button>
  )
  if (label == null) return control
  return (
    <label className="ds-switch-label" htmlFor={id}>
      {control}
      <span className="ds-switch-text">{label}</span>
    </label>
  )
}
