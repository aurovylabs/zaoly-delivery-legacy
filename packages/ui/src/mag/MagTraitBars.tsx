import { Text, View } from '@react-pdf/renderer'
import { useMagTheme } from './MagTheme'

export type MagTrait = {
  displayName: string
  score: number
}

export function MagTraitBars({ traits, compact = false }: { traits: MagTrait[]; compact?: boolean }) {
  const { styles } = useMagTheme()
  if (!traits.length) return null
  return (
    <View style={{ marginTop: compact ? 4 : 8, width: '100%' }}>
      {traits.map((t) => {
        const pct = Math.round(t.score <= 1 ? t.score * 100 : t.score)
        return (
          <View key={t.displayName} wrap={false} style={{ marginBottom: compact ? 4 : 6, width: '100%' }}>
            <View style={styles.row}>
              <Text style={styles.traitName}>{t.displayName}</Text>
              <Text style={styles.traitPct}>{pct}%</Text>
            </View>
            <View style={compact ? styles.traitTrackCompact : styles.traitTrack}>
              <View style={[styles.traitFill, { width: `${Math.max(2, Math.min(100, pct))}%` }]} />
            </View>
          </View>
        )
      })}
    </View>
  )
}
