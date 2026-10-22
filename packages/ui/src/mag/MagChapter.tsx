import type { ReactNode } from 'react'
import { Text, View } from '@react-pdf/renderer'
import { useMagTheme } from './MagTheme'

type MagChapterProps = {
  eyebrow: string
  title: string
  lede?: string
  /** Print folio index, e.g. "02" */
  index?: string
  /** Second+ module on a packed page — hairline + air above. */
  stacked?: boolean
  children?: ReactNode
  break?: boolean
  /** Instance typography for the chapter title (Creation P86). */
  titleStyle?: Record<string, string | number>
}

export function MagChapter({
  eyebrow,
  title,
  lede,
  index,
  stacked = false,
  children,
  break: pageBreak,
  titleStyle,
}: MagChapterProps) {
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
    <View
      style={[
        styles.chapterGap,
        stacked ? styles.chapterStacked : undefined,
        alignItems ? { alignItems, width: '100%' } : undefined,
      ]}
      break={pageBreak}
    >
      {index ? <Text style={[styles.chapterIndex, textAlign]}>{index}</Text> : null}
      <Text style={[styles.eyebrow, textAlign]}>{eyebrow}</Text>
      <Text style={[styles.headline, titleStyle]}>{title}</Text>
      <View style={styles.accentRule} />
      {lede ? <Text style={[styles.lede, textAlign]}>{lede}</Text> : null}
      {children}
    </View>
  )
}
