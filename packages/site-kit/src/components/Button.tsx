import type { ButtonHTMLAttributes, ReactNode } from 'react'

/**
 * Site Button — look comes from Master named variants + Inspect paint/tokens.
 * Seed prop enums secondary/ghost are retired (Storybook + Inspect).
 * Spec: site-kit.md · composition-masters.md
 */
export type ButtonProps = {
  /** @deprecated Ignored — use Master named variants / paint. Kept for old JSON. */
  variant?: string
  children?: ReactNode
  className?: string
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function Button({
  variant: _variant,
  children = 'Button',
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={cx('site-btn', 'site-btn--primary', className)} {...rest}>
      {children}
    </button>
  )
}

/** @deprecated Seed prop enums retired — use Master named variants. */
export type ButtonVariant = string
