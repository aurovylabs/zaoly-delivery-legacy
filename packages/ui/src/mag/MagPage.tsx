import type { ReactNode } from 'react'
import { Page, Text, View } from '@react-pdf/renderer'
import { useMagTheme } from './MagTheme'

type MagPageProps = {
  children: ReactNode
  footerTitle?: string
  /** App-injected logo (e.g. plexon/creation ZaolyLogoPdf). */
  logo?: ReactNode
  showLogo?: boolean
}

export function MagPage({ children, footerTitle, logo, showLogo = false }: MagPageProps) {
  const { styles } = useMagTheme()
  return (
    <Page size="A4" style={styles.page} wrap>
      <View style={styles.columnShell}>
        <View style={styles.column}>
          {showLogo && logo ? <View style={{ marginBottom: 36 }}>{logo}</View> : null}
          {children}
        </View>
      </View>
      <View style={styles.footer} fixed>
        <View style={styles.footerRule} />
        <View style={styles.footerRow}>
          <Text style={styles.footerMeta}>{footerTitle ?? 'Quick Check'}</Text>
          <Text
            style={styles.footerMeta}
            render={({ pageNumber, totalPages }) => `${pageNumber} — ${totalPages}`}
          />
        </View>
      </View>
    </Page>
  )
}
