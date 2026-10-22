/**
 * 12-col board edge flags for joined hairlines (no outer borders).
 * Spec: specs/domain/zaoly-ui-widget-grid.md
 */
export type JoinedBoardEdge = {
  rowStart: boolean
  rowEnd: boolean
  lastRow: boolean
}

export function layoutJoinedBoardEdges(
  widgets: Array<{ colSpan?: number | null; rowSpan?: number | null }>,
  columns = 12,
): JoinedBoardEdge[] {
  const cols = Math.max(1, columns)
  let cursor = 0
  let row = 0
  const placed: Array<JoinedBoardEdge & { row: number }> = []

  for (const widget of widgets) {
    const span = Math.min(cols, Math.max(1, widget.colSpan ?? 4))
    if (cursor > 0 && cursor + span > cols) {
      cursor = 0
      row += 1
    }
    const start = cursor
    const end = cursor + span
    placed.push({
      row,
      rowStart: start === 0,
      rowEnd: end >= cols,
      lastRow: false,
    })
    cursor = end >= cols ? 0 : end
    if (end >= cols) row += 1
  }

  const maxRow = placed.reduce((m, p) => Math.max(m, p.row), 0)
  return placed.map(({ rowStart, rowEnd, row: r }) => ({
    rowStart,
    rowEnd,
    lastRow: r === maxRow,
  }))
}
