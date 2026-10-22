import type { ReactNode } from 'react'
import { View } from '@react-pdf/renderer'
import { useMagTheme } from './MagTheme'

type MagTwoColumnProps = {
  left: ReactNode
  right: ReactNode
  /** Inner gutter in pt — applied as padding, never as flex gap. */
  gap?: number
}

/** Magazine spread — two equal 50% columns within the content measure. */
export function MagTwoColumn({ left, right, gap = 24 }: MagTwoColumnProps) {
  const { styles } = useMagTheme()
  const pad = Math.max(0, gap / 2)
  return (
    <View style={styles.twoColRow}>
      <View style={[styles.twoColCell, { paddingRight: pad }]}>{left}</View>
      <View style={[styles.twoColCell, { paddingLeft: pad }]}>{right}</View>
    </View>
  )
}
