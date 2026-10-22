import { Text, View } from '@react-pdf/renderer'
import { useMagTheme } from './MagTheme'

type MagPullQuoteProps = {
  label?: string
  body: string
  /** Instance typography for the quote body (Creation P86). */
  bodyStyle?: Record<string, string | number>
}

/** Editorial pull — accent bar + body, no filled card. */
export function MagPullQuote({ label, body, bodyStyle }: MagPullQuoteProps) {
  const { styles } = useMagTheme()
  return (
    <View style={styles.pullQuote} wrap={false}>
      <View style={styles.pullQuoteBar} />
      <View style={styles.pullQuoteBody}>
        {label ? <Text style={styles.subEyebrow}>{label}</Text> : null}
        <Text
          style={[styles.body, { marginBottom: 0, lineHeight: 1.55, width: '100%' }, bodyStyle]}
        >
          {body}
        </Text>
      </View>
    </View>
  )
}
