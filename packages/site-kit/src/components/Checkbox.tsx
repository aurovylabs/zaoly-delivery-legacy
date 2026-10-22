import type { InputHTMLAttributes, ReactNode } from 'react'

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'children' | 'type'> & {
  children?: ReactNode
}

/**
 * Paint (`style` / `className`) lands on the label shell so color, gap, and
 * typography affect the control + caption — not only the native input.
 */
export function Checkbox({
  className,
  children = 'Remember me',
  style,
  ...rest
}: CheckboxProps) {
  return (
    <label className={['site-checkbox', className].filter(Boolean).join(' ')} style={style}>
      <input type="checkbox" {...rest} />
      <span>{children}</span>
    </label>
  )
}
