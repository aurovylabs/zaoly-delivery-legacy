export type PrintTableCell = string | number | null

export function printTableFromProps(props: Record<string, unknown>): {
  columns: string[]
  rows: PrintTableCell[][]
} {
  const columns = Array.isArray(props.columns)
    ? props.columns.filter((c): c is string => typeof c === 'string' && c.trim() !== '')
    : []
  const rows = Array.isArray(props.rows)
    ? props.rows
        .filter((row): row is unknown[] => Array.isArray(row))
        .map((row) => row.map(printTableCell))
    : []
  if (!columns.length) {
    return {
      columns: ['Metric', 'Now'],
      rows: [
        ['GEO', 72],
        ['Pages', 8],
      ],
    }
  }
  return { columns, rows }
}

export function printTableCell(cell: unknown): PrintTableCell {
  if (typeof cell === 'number' || typeof cell === 'string') return cell
  if (cell == null) return null
  return String(cell)
}
