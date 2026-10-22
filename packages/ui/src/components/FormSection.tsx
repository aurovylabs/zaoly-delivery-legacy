import type { HTMLAttributes, ReactNode } from 'react'

export type FormSectionProps = {
  title: ReactNode
  titleId?: string
  children?: ReactNode
  /** Body grid columns (default 1). */
  columns?: number
  tone?: 'default' | 'advanced'
  className?: string
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'title' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Titled field block for Dialogs / editors — Brandion token editor chrome. */
export function FormSection({
  title,
  titleId,
  children,
  columns = 1,
  tone = 'default',
  className,
  ...rest
}: FormSectionProps) {
  const headingId = titleId ?? undefined
  return (
    <section
      className={cx(
        'ds-form-section',
        tone === 'advanced' && 'ds-form-section--advanced',
        className
      )}
      aria-labelledby={headingId}
      style={{ ['--ds-form-section-columns' as string]: String(Math.max(1, columns)) }}
      {...rest}
    >
      <h3 className="ds-form-section__title" id={headingId}>
        {title}
      </h3>
      <div className="ds-form-section__body">{children}</div>
    </section>
  )
}
