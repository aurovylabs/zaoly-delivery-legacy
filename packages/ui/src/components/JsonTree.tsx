'use client'

import type { HTMLAttributes } from 'react'

export type JsonTreeItem = {
  path: string
  value: string
}

export type JsonTreeProps = {
  items: JsonTreeItem[]
  onSelectPath?: (path: string) => void
  emptyLabel?: string
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/**
 * Flat JSON path browser — click a leaf to insert into an ExpressionField.
 * Spec: specs/domain/zaoly-ui-json-tree.md
 */
export function JsonTree({
  items,
  onSelectPath,
  emptyLabel = 'No fields',
  className,
  ...rest
}: JsonTreeProps) {
  if (items.length === 0) {
    return (
      <div className={cx('ds-json-tree', 'ds-json-tree--empty', className)} {...rest}>
        <p className="ds-json-tree-empty">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <div className={cx('ds-json-tree', className)} {...rest}>
      <ul className="ds-json-tree-list" role="list">
        {items.map((item) => {
          const interactive = typeof onSelectPath === 'function'
          return (
            <li key={item.path} className="ds-json-tree-item">
              {interactive ? (
                <button
                  type="button"
                  className="ds-json-tree-row"
                  onClick={() => onSelectPath(item.path)}
                >
                  <span className="ds-json-tree-path">{item.path}</span>
                  <span className="ds-json-tree-value">{item.value}</span>
                </button>
              ) : (
                <div className="ds-json-tree-row ds-json-tree-row--static">
                  <span className="ds-json-tree-path">{item.path}</span>
                  <span className="ds-json-tree-value">{item.value}</span>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
