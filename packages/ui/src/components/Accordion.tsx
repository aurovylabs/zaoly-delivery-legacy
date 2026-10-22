import type { ReactNode } from 'react'

export type AccordionItem = {
  id: string
  title: ReactNode
  /** One-line hint shown only while collapsed */
  preview?: ReactNode
  panel: ReactNode
  disabled?: boolean
}

export type AccordionProps = {
  items: AccordionItem[]
  /** Open item id, or `null` when all collapsed (single-open). */
  value: string | null
  onChange: (id: string | null) => void
  className?: string
  footer?: ReactNode
  'aria-label'?: string
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Magazine hairline accordion — tokenized disclosure for long dossier/briefing text.
 * Spec: specs/domain/zaoly-ui-accordion.md
 */
export function Accordion({
  items,
  value,
  onChange,
  className,
  footer,
  'aria-label': ariaLabel,
}: AccordionProps) {
  return (
    <div className={cx('ds-accordion', className)}>
      <div className="ds-accordion-list" role="list" aria-label={ariaLabel}>
        {items.map((item) => {
          const open = value === item.id
          return (
            <div
              key={item.id}
              className={cx('ds-accordion-item', open && 'is-open')}
              role="listitem"
            >
              <button
                type="button"
                className="ds-accordion-summary"
                aria-expanded={open}
                aria-controls={`ds-accordion-panel-${item.id}`}
                disabled={item.disabled}
                onClick={() => onChange(open ? null : item.id)}
              >
                <span className="ds-accordion-chevron" aria-hidden />
                <span className="ds-accordion-summary-copy">
                  <span className="ds-accordion-title">{item.title}</span>
                  {!open && item.preview != null ? (
                    <span className="ds-accordion-preview">{item.preview}</span>
                  ) : null}
                </span>
              </button>
              {open ? (
                <div
                  id={`ds-accordion-panel-${item.id}`}
                  className="ds-accordion-panel"
                >
                  {item.panel}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
      {footer ? <div className="ds-accordion-footer">{footer}</div> : null}
    </div>
  )
}
