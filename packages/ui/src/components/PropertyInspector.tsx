import type { HTMLAttributes, ReactNode } from 'react'

export type PropertyInspectorProps = {
  children?: ReactNode
  className?: string
  title?: string
  emptyLabel?: string
  'aria-label'?: string
} & Omit<HTMLAttributes<HTMLElement>, 'className' | 'children' | 'title'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** Prop grid shell — app supplies field controls as children. */
export function PropertyInspector({
  children,
  className,
  title = 'Inspector',
  emptyLabel = 'Select a node',
  'aria-label': ariaLabel = 'Property inspector',
  ...rest
}: PropertyInspectorProps) {
  const empty = children == null || (Array.isArray(children) && children.length === 0)
  return (
    <aside
      className={cx('ds-property-inspector', 'ds-inspect-density', className)}
      aria-label={ariaLabel}
      {...rest}
    >
      <header className="ds-property-inspector__head">
        <strong>{title}</strong>
      </header>
      <div className="ds-property-inspector__body">
        {empty ? (
          <p className="ds-property-inspector__empty">{emptyLabel}</p>
        ) : (
          children
        )}
      </div>
    </aside>
  )
}
