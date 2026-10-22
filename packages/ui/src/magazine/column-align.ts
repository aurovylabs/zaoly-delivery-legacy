/**
 * Shared PrintTable / MagTable columnAlign enum (P92 Phase C).
 * Precedence when painting: cell textAlign > columnAlign[i] > left.
 */

export const PRINT_COLUMN_ALIGNS = ['left', 'center', 'right'] as const

export type PrintColumnAlign = (typeof PRINT_COLUMN_ALIGNS)[number]

export function normalizePrintColumnAlign(raw: unknown): PrintColumnAlign {
  if (typeof raw === 'string') {
    const v = raw.trim().toLowerCase()
    if ((PRINT_COLUMN_ALIGNS as readonly string[]).includes(v)) return v as PrintColumnAlign
    if (v === 'start' || v === 'flex-start') return 'left'
    if (v === 'end' || v === 'flex-end') return 'right'
  }
  return 'left'
}

/**
 * Accepts string[] | JSON string | comma-separated string.
 * Pads/truncates to `columnCount` (default: list length or 0).
 */
export function normalizePrintColumnAlignList(
  raw: unknown,
  columnCount?: number,
): PrintColumnAlign[] {
  let list: unknown[] = []
  if (Array.isArray(raw)) {
    list = raw
  } else if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) {
      list = []
    } else if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown
        list = Array.isArray(parsed) ? parsed : []
      } catch {
        list = trimmed.split(/[,|]/).map((s) => s.trim()).filter(Boolean)
      }
    } else {
      list = trimmed.split(/[,|]/).map((s) => s.trim()).filter(Boolean)
    }
  }
  const count =
    typeof columnCount === 'number' && Number.isFinite(columnCount) && columnCount > 0
      ? Math.floor(columnCount)
      : list.length
  const out: PrintColumnAlign[] = []
  for (let i = 0; i < count; i += 1) {
    out.push(normalizePrintColumnAlign(list[i]))
  }
  return out
}
