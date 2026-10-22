import { Text, View } from '@react-pdf/renderer'
import { MagScoreRing } from './MagScoreRing'
import { MagPullQuote } from './MagPullQuote'
import { useMagTheme } from './MagTheme'

export type MagCoverKpi = {
  label: string
  value: string
  ringValue?: number | null
  ringMax?: number
}

type MagCoverProps = {
  eyebrow: string
  title: string
  url?: string
  meta?: string
  fazit?: string
  kpis: MagCoverKpi[]
  /** Instance typography for the cover title (Creation P86). */
  titleStyle?: Record<string, string | number>
}

export function MagCover({
  eyebrow,
  title,
  url,
  meta,
  fazit,
  kpis,
  titleStyle,
}: MagCoverProps) {
  const { styles } = useMagTheme()
  const textAlign =
    titleStyle && typeof titleStyle.textAlign === 'string'
      ? { textAlign: titleStyle.textAlign as 'left' | 'center' | 'right' | 'justify' }
      : undefined
  const alignItems =
    textAlign?.textAlign === 'center'
      ? ('center' as const)
      : textAlign?.textAlign === 'right'
        ? ('flex-end' as const)
        : undefined
  return (
    <View style={alignItems ? { alignItems, width: '100%' } : undefined}>
      <Text style={[styles.eyebrow, textAlign]}>{eyebrow}</Text>
      <Text style={[styles.coverHeadline, titleStyle]}>{title}</Text>
      <View style={styles.accentRule} />
      <View style={styles.coverMetaBlock}>
        {url ? <Text style={[styles.meta, textAlign]}>{url}</Text> : null}
        {meta ? <Text style={[styles.meta, textAlign]}>{meta}</Text> : null}
      </View>
      {fazit ? <MagPullQuote label="Fazit" body={fazit} /> : null}
      {kpis.length > 0 ? (
        <View style={styles.kpiGrid}>
          {kpis.slice(0, 4).map((kpi) => (
            <View key={kpi.label} style={styles.kpiCell}>
              {kpi.ringValue != null ? (
                <MagScoreRing
                  value={kpi.ringValue}
                  max={kpi.ringMax ?? 100}
                  label={kpi.label}
                  size={58}
                />
              ) : (
                <View>
                  <Text style={styles.kpiValue}>{kpi.value}</Text>
                  <Text style={styles.kpiLabel}>{kpi.label}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}
