import type { HTMLAttributes, ReactNode } from 'react'

export type InspectSectionProps = {
  title: ReactNode
  titleId?: string
  children?: ReactNode
  className?: string
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'title' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Dense titled block inside PropertyInspector (Penpot-like section chrome). */
export function InspectSection({
  title,
  titleId,
  children,
  className,
  ...rest
}: InspectSectionProps) {
  const headingId = titleId ?? undefined
  return (
    <section
      className={cx('ds-inspect-section', className)}
      aria-labelledby={headingId}
      data-testid="inspect-section"
      {...rest}
    >
      <h3 className="ds-inspect-section__title" id={headingId}>
        {title}
      </h3>
      <div className="ds-inspect-section__body">{children}</div>
    </section>
  )
}
