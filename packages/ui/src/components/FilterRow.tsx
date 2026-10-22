import type { HTMLAttributes, ReactNode } from 'react'

export type FilterRowVariant = 'magazine' | 'toolbar'

export type FilterRowProps = {
  children: ReactNode
  className?: string
  /** Optional uppercase eyebrow above the chip row */
  label?: ReactNode
  /**
   * `magazine` = hairline band + generous gap (AUDION/CHECKION filters).
   * `toolbar` = compact wrap for dense ops chrome.
   */
  variant?: FilterRowVariant
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Magazine filter / chip band — prefer Chip children with selected underline language.
 * Spec: specs/domain/zaoly-ui-filter-row.md
 */
export function FilterRow({
  children,
  className,
  label,
  variant = 'magazine',
  ...rest
}: FilterRowProps) {
  return (
    <div
      className={cx(
        'ds-filter-row',
        'filter-row',
        variant === 'magazine' && 'ds-filter-row--magazine',
        variant === 'toolbar' && 'ds-filter-row--toolbar',
        className,
      )}
      data-variant={variant}
      {...rest}
    >
      {label != null ? <span className="ds-filter-row-label">{label}</span> : null}
      <div className="ds-filter-row-chips ds-chip-row">{children}</div>
    </div>
  )
}
