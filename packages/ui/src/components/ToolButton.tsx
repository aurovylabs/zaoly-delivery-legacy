import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ToolButtonSize = 'sm' | 'md'

export type ToolButtonProps = {
  /** Accessible name (also used as title). */
  label: string
  active?: boolean
  size?: ToolButtonSize
  children?: ReactNode
  className?: string
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children' | 'aria-label' | 'title'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Compact icon tool control — specs/domain/zaoly-ui-tool-button.md */
export function ToolButton({
  label,
  active = false,
  size = 'md',
  children,
  className,
  type = 'button',
  ...rest
}: ToolButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      aria-pressed={active || undefined}
      data-active={active ? 'true' : undefined}
      className={cx(
        'ds-tool-button',
        `ds-tool-button--${size}`,
        active && 'is-active',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
