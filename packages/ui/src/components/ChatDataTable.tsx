import type { HTMLAttributes } from 'react'
import { Text } from './Text'

export type ChatDataTableProps = {
  columns: string[]
  rows: Array<Array<string | number | null>>
  className?: string
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function cellText(value: string | number | null): string {
  if (value == null) return '—'
  return String(value)
}

/**
 * Compact chat table — specs/domain/zaoly-ui-chat-data-table.md
 */
export function ChatDataTable({ columns, rows, className, ...rest }: ChatDataTableProps) {
  return (
    <div className={cx('ds-chat-table-wrap', className)} {...rest}>
      <table className="ds-chat-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col} scope="col">
                <Text role="meta" as="span">
                  {col}
                </Text>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={`row-${ri}`}>
              {columns.map((_, ci) => (
                <td key={`${ri}-${ci}`}>
                  <Text role="body" as="span">
                    {cellText(row[ci] ?? null)}
                  </Text>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
