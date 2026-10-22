import { Text, View } from '@react-pdf/renderer'
import { useMagTheme } from './MagTheme'
import {
  normalizePrintCalloutVariant,
  type PrintCalloutVariant,
} from '../magazine/callout-variant'

export type { PrintCalloutVariant }

type MagCalloutProps = {
  label?: string
  body: string
  /** P92 — wash | emphasize | quiet */
  variant?: PrintCalloutVariant
  /** Instance typography for the body (Creation P86). */
  bodyStyle?: Record<string, string | number>
}

/** Report wash / emphasis band — not an attributed pull-quote. */
export function MagCallout({ label, body, variant, bodyStyle }: MagCalloutProps) {
  const { styles } = useMagTheme()
  const resolved = normalizePrintCalloutVariant(variant)
  const boxStyle =
    resolved === 'emphasize'
      ? styles.calloutEmphasize
      : resolved === 'quiet'
        ? styles.calloutQuiet
        : styles.calloutWash
  const bodyTone =
    resolved === 'quiet'
      ? styles.calloutBodyQuiet
      : resolved === 'emphasize'
        ? styles.calloutBodyEmphasize
        : styles.calloutBody
  return (
    <View style={boxStyle} wrap={false}>
      {label ? <Text style={styles.subEyebrow}>{label}</Text> : null}
      <Text style={[bodyTone, { width: '100%' }, bodyStyle]}>{body}</Text>
    </View>
  )
}
