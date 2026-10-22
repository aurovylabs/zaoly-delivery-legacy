'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { EmptyState } from './LoadingText'
import { Text } from './Text'

export type DataTableColumn<T> = {
  id: string
  header: ReactNode
  /** Cell renderer */
  cell: (row: T) => ReactNode
  /** Optional sort key extractor */
  sortValue?: (row: T) => string | number | null | undefined
  align?: 'start' | 'end'
}

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[]
  rows: T[]
  /** Stable row id */
  getRowId: (row: T) => string
  caption?: string
  empty?: ReactNode
  className?: string
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

type SortState = { id: string; dir: 'asc' | 'desc' } | null

/**
 * Accessible data table — semantic table + optional column sort.
 * Spec: specs/domain/zaoly-ui-feedback-data.md
 */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  caption,
  empty,
  className,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>(null)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.id === sort.id)
    if (!col?.sortValue) return rows
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a)
      const bv = col.sortValue!(b)
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir
    })
  }, [columns, rows, sort])

  function toggleSort(col: DataTableColumn<T>) {
    if (!col.sortValue) return
    setSort((prev) => {
      if (!prev || prev.id !== col.id) return { id: col.id, dir: 'asc' }
      if (prev.dir === 'asc') return { id: col.id, dir: 'desc' }
      return null
    })
  }

  return (
    <div className={cx('ds-table-wrap', className)}>
      <table className="ds-table">
        {caption ? <caption className="ds-table-caption">{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((col) => {
              const sortable = !!col.sortValue
              const active = sort?.id === col.id
              const ariaSort = !sortable
                ? undefined
                : active
                  ? sort.dir === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              return (
                <th
                  key={col.id}
                  scope="col"
                  className={cx(
                    'ds-table-th',
                    col.align === 'end' && 'ds-table-th--end',
                    sortable && 'ds-table-th--sortable',
                  )}
                  aria-sort={ariaSort}
                >
                  {sortable ? (
                    <button
                      type="button"
                      className="ds-table-sort"
                      onClick={() => toggleSort(col)}
                    >
                      <Text role="label" as="span">
                        {col.header}
                      </Text>
                      <span className="ds-table-sort-ind" aria-hidden>
                        {active ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    </button>
                  ) : (
                    <Text role="label" as="span">
                      {col.header}
                    </Text>
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td className="ds-table-empty" colSpan={columns.length}>
                {empty ?? <EmptyState>No rows</EmptyState>}
              </td>
            </tr>
          ) : (
            sorted.map((row) => (
              <tr key={getRowId(row)} className="ds-table-tr">
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={cx(
                      'ds-table-td',
                      col.align === 'end' && 'ds-table-td--end',
                    )}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
