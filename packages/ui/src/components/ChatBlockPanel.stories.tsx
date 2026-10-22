import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChatBlockList } from './ChatBlockList'
import { ChatBlockPanel } from './ChatBlockPanel'

const meta = {
  title: 'Molecules/ChatBlockPanel',
  component: ChatBlockPanel,
  args: {
    title: 'GEO-Empfehlungen',
    eyebrow: 'findings',
  },
} satisfies Meta<typeof ChatBlockPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: (
      <p className="ds-text-meta" style={{ margin: 0 }}>
        Block body slot — compose lists or prose.
      </p>
    ),
  },
}

export const Findings: Story = {
  args: {
    title: 'Erkenntnisse',
    eyebrow: 'findings',
    children: (
      <ChatBlockList
        items={[
          {
            title: 'GEO Gesamt-Score steigern (aktuell 62/100)',
            description:
              'Der Score liegt deutlich unter dem Wettbewerbs-Schnitt. Maßnahmen sollten priorisiert angegangen werden.',
            badge: 'Warnung',
            tone: 'warning',
          },
          {
            title: 'Citations in Antworten erhöhen',
            description: 'Modelle zitieren die Domain selten — On-Page-Signale und FAQs nachschärfen.',
            badge: 'Hinweis',
            tone: 'info',
          },
        ]}
      />
    ),
  },
}

export const WithTooltip: Story = {
  args: {
    title: 'Handlungsempfehlungen',
    eyebrow: 'actions',
    infoTooltip: 'Priorisierte Next Moves aus dem GEO-Lauf.',
    children: (
      <ChatBlockList
        items={[
          {
            title: 'FAQ-Block für Top-Prompts',
            description: 'Deckt die häufigsten GEO-Fragen mit klaren Antworten ab.',
            badge: 'P1',
            tone: 'error',
          },
        ]}
      />
    ),
  },
}
