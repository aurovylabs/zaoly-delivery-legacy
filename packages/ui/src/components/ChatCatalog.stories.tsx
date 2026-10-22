import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Button } from './Button'
import { ChatAlertBlock } from './ChatAlertBlock'
import { ChatBlockList } from './ChatBlockList'
import { ChatBlockPanel } from './ChatBlockPanel'
import { ChatCollapsible } from './ChatCollapsible'
import { ChatDataTable } from './ChatDataTable'
import { ChatEntityGrid } from './ChatEntityGrid'
import { ChatKeyValueList } from './ChatKeyValueList'
import { ChatLinkList } from './ChatLinkList'
import { ChatMetricGrid } from './ChatMetricGrid'
import { ChatMomentList } from './ChatMomentList'
import { ChatOverlay } from './ChatOverlay'
import { ChatPhaseStrip } from './ChatPhaseStrip'
import { ChatQuoteList } from './ChatQuoteList'
import { ChatStepList } from './ChatStepList'
import { Text } from './Text'
import { Textarea } from './Textarea'

/**
 * Discovery catalog — all presentational chat blocks in one place.
 * Story id: organisms-chatcatalog--inventory
 */
const meta = {
  title: 'Organisms/ChatCatalog',
  component: ChatBlockPanel,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ChatBlockPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Inventory: Story = {
  args: {
    title: 'Chat inventory',
    eyebrow: 'catalog',
    children: null,
  },
  render: () => (
    <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '42rem' }}>
      <header style={{ display: 'grid', gap: '0.35rem' }}>
        <Text role="title" size="xl" as="h2">
          Chat inventory
        </Text>
        <Text role="meta" as="p">
          Overlay · Panel · List · Metric · KV · Steps · Links · Alert · Table · Collapsible ·
          EntityGrid · PhaseStrip · MomentList · QuoteList (Audion journey outline).
        </Text>
      </header>

      <ChatBlockPanel title="Erkenntnisse" eyebrow="findings">
        <ChatBlockList
          items={[
            {
              title: 'GEO Gesamt-Score steigern (aktuell 62/100)',
              description: 'Unter Wettbewerbs-Schnitt — Maßnahmen priorisieren.',
              badge: 'Warnung',
              tone: 'warning',
            },
            {
              title: 'Citations in Antworten erhöhen',
              description: 'On-Page-Signale und FAQs nachschärfen.',
              badge: 'Hinweis',
              tone: 'info',
            },
          ]}
        />
      </ChatBlockPanel>

      <ChatBlockPanel title="GEO Kennzahlen" eyebrow="metrics">
        <ChatMetricGrid
          items={[
            { label: 'GEO Score', value: 62, unit: '/100', tone: 'warning' },
            { label: 'Citations', value: 3, tone: 'error' },
          ]}
        />
      </ChatBlockPanel>

      <ChatBlockPanel title="Details" eyebrow="details">
        <ChatKeyValueList
          items={[
            { label: 'Projekt', value: 'Demo Website' },
            { label: 'Domain', value: 'example.com' },
          ]}
        />
      </ChatBlockPanel>

      <ChatBlockPanel title="Workflow" eyebrow="steps">
        <ChatStepList
          steps={[
            { id: 's1', label: 'Research', status: 'done' },
            { id: 's2', label: 'Personas', status: 'running', progress: 60 },
            { id: 's3', label: 'Journey', status: 'pending' },
          ]}
        />
      </ChatBlockPanel>

      <ChatBlockPanel title="Links" eyebrow="links">
        <ChatLinkList
          links={[
            { label: 'Dashboard', href: '/projects/demo' },
            { label: 'Docs', href: 'https://zaoly.app', external: true },
          ]}
        />
      </ChatBlockPanel>

      <ChatAlertBlock title="Sync" message="Mirror pending — retry shortly." tone="warning" />

      <ChatBlockPanel title="Scan-Seiten" eyebrow="table" flush>
        <ChatDataTable
          columns={['Seite', 'Score']}
          rows={[
            ['/', 94],
            ['/kontakt', 91],
          ]}
        />
      </ChatBlockPanel>

      <ChatCollapsible title="Methoden-Notiz" defaultOpen>
        <Text role="meta" as="p" style={{ margin: 0 }}>
          Langer Detailtext als Slot — Markdown rendert das Produkt.
        </Text>
      </ChatCollapsible>

      <ChatBlockPanel title="Personas" eyebrow="audion">
        <ChatEntityGrid
          items={[
            {
              id: 'p1',
              title: 'Alex Rivera',
              subtitle: 'B2B Buyer',
              description: 'Sucht belastbare Citations.',
              badge: '82%',
              tags: ['Persona'],
              accent: 'pink',
            },
          ]}
        />
      </ChatBlockPanel>

      <ChatBlockPanel title="Journey outline" eyebrow="phases">
        <ChatPhaseStrip
          phases={[
            { id: 'ph1', label: 'Awareness', summary: 'Erste Berührung', status: 'done' },
            {
              id: 'ph2',
              label: 'Consideration',
              summary: 'Vergleicht Anbieter',
              active: true,
              status: 'current',
            },
            { id: 'ph3', label: 'Decision', status: 'upcoming' },
          ]}
        />
      </ChatBlockPanel>

      <ChatBlockPanel title="Consideration · Moments" eyebrow="moments">
        <ChatMomentList
          items={[
            { id: 'm1', kind: 'thought', label: 'Passt das zu unserem Stack?' },
            { id: 'm2', kind: 'pain', label: 'Zu viele Formularfelder' },
            { id: 'm3', kind: 'opportunity', label: 'FAQ mit Citations' },
          ]}
        />
      </ChatBlockPanel>

      <ChatBlockPanel title="Persona-Stimmen" eyebrow="validate">
        <ChatQuoteList
          items={[
            {
              quote: 'Ich brauche Citations, sonst vertraue ich dem Anbieter nicht.',
              attribution: 'Alex · Consideration',
              context: 'Friction: fehlende Quellen',
              tone: 'warning',
            },
          ]}
        />
      </ChatBlockPanel>

      <ChatBlockPanel title="Zielgruppen" eyebrow="audiences">
        <ChatEntityGrid
          items={[
            {
              id: 'tg1',
              title: 'Enterprise Marketing',
              subtitle: 'Segment A',
              description: 'Guidelines + Measurables.',
              tags: ['2 Personas', '5 Knowledge'],
              accent: 'green',
            },
          ]}
        />
      </ChatBlockPanel>

      <ChatBlockPanel title="GEO-Empfehlungen" eyebrow="actions">
        <ChatBlockList
          items={[
            {
              title: 'FAQ-Block für Top-Prompts',
              description: 'Deckt die häufigsten GEO-Fragen ab.',
              badge: 'P1',
              chips: [{ label: 'Content', tone: 'neutral' }],
              tone: 'error',
            },
          ]}
        />
      </ChatBlockPanel>

      <div
        className="chat-panel chat-panel-compact"
        style={{ minHeight: '10rem', border: '1px solid var(--line)', padding: '0.75rem' }}
      >
        <div className="chat-turns">
          <div className="chat-turn chat-turn-assistant">
            <span className="chat-role">Assistent</span>
            <div className="chat-answer">
              <Text role="meta" as="p" style={{ margin: 0 }}>
                Composer + turns chrome (product owns streaming).
              </Text>
            </div>
          </div>
        </div>
        <form className="chat-form" onSubmit={(e) => e.preventDefault()} style={{ marginTop: '0.75rem' }}>
          <Textarea className="chat-composer" size="md" block placeholder="Nachricht…" rows={2} />
          <Button type="submit" variant="ghost" size="sm" className="chat-send">
            Senden
          </Button>
        </form>
      </div>
    </div>
  ),
}

export const InOverlay: Story = {
  args: {
    title: 'Assistant',
    eyebrow: 'overlay',
    children: null,
  },
  parameters: { layout: 'fullscreen' },
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <div style={{ minHeight: '100vh', padding: '1.5rem' }}>
        <Button type="button" onClick={() => setOpen(true)}>
          Open catalog overlay
        </Button>
        <ChatOverlay open={open} onOpenChange={setOpen} title="Assistant" placement="dock-end">
          <div className="chat-panel chat-panel-compact" style={{ padding: '0.75rem', overflow: 'auto' }}>
            <div className="chat-answer" style={{ display: 'grid', gap: '0.85rem' }}>
              <ChatBlockPanel title="Personas" eyebrow="audion">
                <ChatEntityGrid
                  items={[
                    {
                      id: 'p1',
                      title: 'Alex',
                      subtitle: 'Buyer',
                      badge: '82%',
                      accent: 'pink',
                      tags: ['Persona'],
                    },
                  ]}
                />
              </ChatBlockPanel>
              <ChatAlertBlock message="Sync ok" tone="success" title="Fertig" />
              <ChatBlockPanel title="Links" eyebrow="links">
                <ChatLinkList links={[{ label: 'Dashboard', href: '#' }]} />
              </ChatBlockPanel>
            </div>
          </div>
        </ChatOverlay>
      </div>
    )
  },
}
