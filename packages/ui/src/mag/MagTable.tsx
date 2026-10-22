import { Text, View } from '@react-pdf/renderer'
import { useMagTheme } from './MagTheme'
import {
  normalizePrintColumnAlignList,
  type PrintColumnAlign,
} from '../magazine/column-align'

export type { PrintColumnAlign }

type MagTableProps = {
  columns: string[]
  rows: Array<Array<string | number | null>>
  /** Instance typography for header cells (Creation P88). */
  headStyle?: Record<string, string | number>
  /** Instance typography applied to all body cells. */
  cellStyle?: Record<string, string | number>
  /** Optional per-cell body styles [row][col]. */
  cellStyles?: Array<Array<Record<string, string | number> | undefined>>
  /** P92 — per-column align when cell/head textAlign unset. */
  columnAlign?: PrintColumnAlign[] | string
  /** Row vertical rhythm in pt (inspect gap). */
  gap?: number
  /**
   * stretch (default): fill Mag column measure.
   * hug: size to content so parent `alignSelf: flex-end|center` can park the block (P91).
   */
  fit?: 'stretch' | 'hug'
}

type TextAlign = 'left' | 'center' | 'right' | 'justify'

/** react-pdf: textAlign only shows when Text spans the cell measure (P90). */
const CELL_TEXT_STRETCH = { width: '100%' as const }

function textAlignOf(style?: Record<string, string | number>): TextAlign | undefined {
  const raw = style?.textAlign
  if (typeof raw !== 'string') return undefined
  const v = raw.trim().toLowerCase()
  if (v === 'left' || v === 'center' || v === 'right' || v === 'justify') return v
  if (v === 'start' || v === 'flex-start') return 'left'
  if (v === 'end' || v === 'flex-end') return 'right'
  return undefined
}

function cellAlignItems(
  style?: Record<string, string | number>,
): 'flex-start' | 'center' | 'flex-end' | undefined {
  const ta = textAlignOf(style)
  if (ta === 'center') return 'center'
  if (ta === 'right') return 'flex-end'
  if (ta === 'left') return 'flex-start'
  return undefined
}

export function MagTable({
  columns,
  rows,
  headStyle,
  cellStyle,
  cellStyles,
  columnAlign,
  gap,
  fit = 'stretch',
}: MagTableProps) {
  const { styles } = useMagTheme()
  const hug = fit === 'hug'
  const width = hug ? undefined : `${100 / Math.max(columns.length, 1)}%`
  const rowPad = gap != null ? { paddingVertical: Math.max(2, gap / 2) } : undefined
  const colAligns = normalizePrintColumnAlignList(columnAlign, columns.length)
  const headAlign = cellAlignItems(headStyle)
  const bodyAlign = cellAlignItems(cellStyle)
  // Hug must override kit `width: '100%'` on header/row bands or alignSelf cannot park the block.
  const hugBand = hug
    ? { width: 'auto' as const, alignSelf: 'flex-start' as const, flexDirection: 'row' as const }
    : undefined
  return (
    <View style={hug ? undefined : { width: '100%' }}>
      <View style={[styles.tableHeader, hugBand]}>
        {columns.map((col, ci) => {
          const colTa = colAligns[ci]
          const align =
            headAlign ?? (colTa ? cellAlignItems({ textAlign: colTa }) : undefined)
          const headTextStyle =
            colTa && !textAlignOf(headStyle) ? { textAlign: colTa } : undefined
          return (
            <View
              key={col}
              style={[
                hug
                  ? { paddingRight: 12, flexShrink: 0 }
                  : { width, paddingRight: 4, minWidth: 0 },
                align ? { alignItems: align } : undefined,
              ]}
            >
              <Text
                style={[
                  styles.tableHeadCell,
                  hug ? { width: 'auto', maxWidth: undefined } : CELL_TEXT_STRETCH,
                  headStyle,
                  headTextStyle,
                ]}
              >
                {col}
              </Text>
            </View>
          )
        })}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={[styles.tableRow, hugBand, rowPad]} wrap={false}>
          {columns.map((_, ci) => {
            const perCell = cellStyles?.[ri]?.[ci]
            const colTa = colAligns[ci]
            const align =
              cellAlignItems(perCell) ??
              (colTa ? cellAlignItems({ textAlign: colTa }) : undefined) ??
              bodyAlign
            const colTextStyle =
              colTa && !textAlignOf(perCell) && !textAlignOf(cellStyle)
                ? { textAlign: colTa }
                : undefined
            return (
              <View
                key={ci}
                style={[
                  hug
                    ? { paddingRight: 12, flexShrink: 0 }
                    : { width, paddingRight: 4, minWidth: 0 },
                  align ? { alignItems: align } : undefined,
                ]}
              >
                <Text
                  style={[
                    styles.tableCell,
                    hug ? { width: 'auto', maxWidth: undefined } : CELL_TEXT_STRETCH,
                    cellStyle,
                    colTextStyle,
                    perCell,
                  ]}
                >
                  {row[ci] == null || row[ci] === '' ? '–' : String(row[ci])}
                </Text>
              </View>
            )
          })}
        </View>
      ))}
    </View>
  )
}
