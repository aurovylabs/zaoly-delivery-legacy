import { Text, View } from '@react-pdf/renderer'
import { useMagTheme } from './MagTheme'

export type MagLedgerItem = {
  label: string
  score: number
  detail?: string
}

type MagLedgerProps = {
  items: MagLedgerItem[]
  max?: number
}

export function MagLedger({ items, max = 100 }: MagLedgerProps) {
  const { colors, styles } = useMagTheme()
  const sorted = [...items].sort((a, b) => a.score - b.score)
  return (
    <View style={{ width: '100%' }}>
      {sorted.map((item, i) => {
        const tone =
          item.score < max * 0.4
            ? colors.neg
            : item.score < max * 0.7
              ? colors.warn
              : colors.accentInk
        return (
          <View key={`${item.label}-${i}`} style={styles.ledgerRow} wrap={false}>
            <Text style={styles.rankedIndex}>{String(i + 1).padStart(2, '0')}</Text>
            <Text style={[styles.ledgerScore, { color: tone }]}>{Math.round(item.score)}</Text>
            <View style={styles.rankedTextCol}>
              <Text style={styles.rankedLabel}>{item.label}</Text>
              {item.detail ? <Text style={styles.meta}>{item.detail}</Text> : null}
            </View>
          </View>
        )
      })}
    </View>
  )
}
