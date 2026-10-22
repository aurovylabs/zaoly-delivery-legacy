/**
 * MagRankedList — magazine numbered list (PDF twin of PrintRankedList).
 * Optional instance tones: apps (CREATION) pass inspect-resolved colors.
 */

import { Text, View } from '@react-pdf/renderer'
import { useMagTheme } from './MagTheme'

export type MagRankedItem = {
  label: string
  meta?: string
  /** Optional per-item label color (Creation instance paint). */
  color?: string
  /** Optional per-item label typography (Creation P86). */
  labelStyle?: Record<string, string | number>
}

export type MagRankedListTones = {
  ink?: string
  accentInk?: string
  muted?: string
  line?: string
}

type MagRankedListProps = {
  items: MagRankedItem[]
  startIndex?: number
  /** Magazine two-column flow within the content measure. */
  columns?: 1 | 2
  /** Tighter rows for persona tiles and nested lists. */
  compact?: boolean
  /** Instance color overrides from the authoring canvas (optional). */
  tones?: MagRankedListTones
  /** Instance typography applied to all labels (optional; per-item labelStyle wins). */
  labelStyle?: Record<string, string | number>
  /** Row gap in pt (Creation inspect gap → Mag). */
  gap?: number
}

function splitColumns(items: MagRankedItem[]): [MagRankedItem[], MagRankedItem[]] {
  const mid = Math.ceil(items.length / 2)
  return [items.slice(0, mid), items.slice(mid)]
}

function RankedColumn({
  items,
  startIndex,
  compact,
  styles,
  tones,
  labelStyle,
  gap,
}: {
  items: MagRankedItem[]
  startIndex: number
  compact: boolean
  styles: ReturnType<typeof useMagTheme>['styles']
  tones?: MagRankedListTones
  labelStyle?: Record<string, string | number>
  gap?: number
}) {
  return (
    <View style={{ width: '100%', gap: gap != null ? gap : undefined }}>
      {items.map((item, i) => (
        <View
          key={`${item.label}-${i}`}
          style={[
            compact ? styles.rankedRowCompact : styles.rankedRow,
            tones?.line ? { borderBottomColor: tones.line } : undefined,
          ]}
          wrap={false}
        >
          <Text
            style={[
              compact ? styles.rankedIndexCompact : styles.rankedIndex,
              tones?.accentInk ? { color: tones.accentInk } : undefined,
            ]}
          >
            {String(startIndex + i).padStart(2, '0')}
          </Text>
          <View style={styles.rankedTextCol}>
            <Text
              style={[
                compact ? styles.rankedLabelCompact : styles.rankedLabel,
                { width: '100%' },
                tones?.ink ? { color: tones.ink } : undefined,
                item.color ? { color: item.color } : undefined,
                labelStyle,
                item.labelStyle,
              ]}
            >
              {item.label}
            </Text>
            {item.meta ? (
              <Text
                style={[
                  compact
                    ? [styles.meta, styles.rankedMetaCompact, { marginTop: 3 }]
                    : [styles.meta, { marginTop: 3 }],
                  tones?.muted ? { color: tones.muted } : undefined,
                ]}
              >
                {item.meta}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  )
}

export function MagRankedList({
  items,
  startIndex = 1,
  columns = 1,
  compact = false,
  tones,
  labelStyle,
  gap,
}: MagRankedListProps) {
  const { styles } = useMagTheme()
  if (!items.length) return null

  if (columns === 2 && items.length > 1) {
    const [left, right] = splitColumns(items)
    const pad = 12
    return (
      <View style={[styles.twoColRow, { marginTop: compact ? 2 : 6 }]}>
        <View style={[styles.twoColCell, { paddingRight: pad }]}>
          <RankedColumn
            items={left}
            startIndex={startIndex}
            compact={compact}
            styles={styles}
            tones={tones}
            labelStyle={labelStyle}
            gap={gap}
          />
        </View>
        <View style={[styles.twoColCell, { paddingLeft: pad }]}>
          <RankedColumn
            items={right}
            startIndex={startIndex + left.length}
            compact={compact}
            styles={styles}
            tones={tones}
            labelStyle={labelStyle}
            gap={gap}
          />
        </View>
      </View>
    )
  }

  return (
    <View style={{ marginTop: compact ? 2 : 6, width: '100%' }}>
      <RankedColumn
        items={items}
        startIndex={startIndex}
        compact={compact}
        styles={styles}
        tones={tones}
        labelStyle={labelStyle}
        gap={gap}
      />
    </View>
  )
}
