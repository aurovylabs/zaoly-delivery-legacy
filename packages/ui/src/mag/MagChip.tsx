import type { ReactNode } from 'react'
import { Text, View } from '@react-pdf/renderer'
import { useMagTheme } from './MagTheme'
import {
  normalizePrintChipTone,
  type PrintChipTone,
} from '../magazine/chip-tone'

export type { PrintChipTone }

export function MagChip({
  children,
  tone,
}: {
  children: ReactNode
  /** P92 — default | muted | accent | solid */
  tone?: PrintChipTone
}) {
  const { styles } = useMagTheme()
  const resolved = normalizePrintChipTone(tone)
  const toneStyle =
    resolved === 'muted'
      ? styles.chipMuted
      : resolved === 'accent'
        ? styles.chipAccent
        : resolved === 'solid'
          ? styles.chipSolid
          : styles.chip
  return <Text style={toneStyle}>{children}</Text>
}

export function MagChipRow({ children }: { children: ReactNode }) {
  const { styles } = useMagTheme()
  return <View style={styles.chipRow}>{children}</View>
}
