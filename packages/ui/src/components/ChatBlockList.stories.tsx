import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChatBlockList } from './ChatBlockList'

const meta = {
  title: 'Molecules/ChatBlockList',
  component: ChatBlockList,
  args: {
    items: [
      {
        title: 'GEO Gesamt-Score steigern (aktuell 62/100)',
        description:
          'Der Score liegt deutlich unter dem Wettbewerbs-Schnitt. Maßnahmen sollten priorisiert angegangen werden.',
        badge: 'Warnung',
        tone: 'warning' as const,
      },
      {
        title: 'Author-Markup ergänzen',
        description: 'E-E-A-T Experience leidet ohne sichtbare Autoren-Signale.',
        badge: 'Kritisch',
        tone: 'error' as const,
      },
      {
        title: 'Positive Citation-Lage halten',
        description: 'Bei Kernprompts bereits zitiert — Qualität sichern.',
        badge: 'Positiv',
        tone: 'success' as const,
      },
    ],
  },
} satisfies Meta<typeof ChatBlockList>

export default meta
type Story = StoryObj<typeof meta>

export const Findings: Story = {}

export const Recommendations: Story = {
  args: {
    items: [
      {
        title: 'FAQ-Block für Top-Prompts',
        description: 'Deckt die häufigsten GEO-Fragen mit klaren Antworten ab.',
        badge: 'P1',
        chips: [{ label: 'Content' }],
        tone: 'error',
      },
      {
        title: 'Vergleichstabellen für Wettbewerber',
        description: 'Hilft Modellen, eure Differenzierung zu zitieren.',
        badge: 'P2',
        chips: [{ label: 'GEO' }],
        tone: 'warning',
      },
      {
        title: 'Schema.org HowTo für Kernservices',
        description: 'Strukturierte Daten erhöhen die Zitierbarkeit.',
        badge: 'P3',
        chips: [{ label: 'Technical' }],
        tone: 'info',
      },
    ],
  },
}
