import type { HTMLAttributes, ReactNode } from 'react'

export type AlertTone = 'error' | 'ok' | 'info'

export type AlertProps = {
  tone?: AlertTone
  children: ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLParagraphElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Inline alert — specs/domain/zaoly-ui-foundation.md */
export function Alert({ tone = 'error', children, className, ...rest }: AlertProps) {
  const legacy =
    tone === 'error' ? 'error' : tone === 'ok' ? 'ok' : 'meta'
  return (
    <p
      className={cx('ds-alert', `ds-alert--${tone}`, legacy, className)}
      role={tone === 'error' ? 'alert' : 'status'}
      {...rest}
    >
      {children}
    </p>
  )
}
