import type { Meta, StoryObj } from '@storybook/react-vite'
import { PrintPage, PrintRankedList } from './PrintPrimitives'

const meta = {
  title: 'Print/RankedList',
  component: PrintRankedList,
  tags: ['print', 'magazine'],
} satisfies Meta<typeof PrintRankedList>

export default meta
type Story = StoryObj<typeof meta>

const items = [
  {
    label: 'FAQ-Schema ergänzen',
    meta: 'Strukturierte Antworten für generative Modelle.',
  },
  { label: 'Autorenboxen auf Ratgeberseiten', meta: 'E-E-A-T Erfahrung' },
  { label: 'Liefer- und Montageversprechen klarer machen' },
  { label: 'Lokale Landingpages mit Prompt-Ankern' },
  { label: 'Vergleichstabellen für Konfigurationen' },
  { label: 'Quellenangaben in Ratgebertexten' },
]

export const Default: Story = {
  render: () => (
    <PrintPage>
      <PrintRankedList items={items.slice(0, 3)} />
    </PrintPage>
  ),
}

export const TwoColumn: Story = {
  render: () => (
    <PrintPage>
      <PrintRankedList columns={2} items={items} />
    </PrintPage>
  ),
}

export const Compact: Story = {
  render: () => (
    <PrintPage>
      <PrintRankedList compact items={items.slice(0, 4)} />
    </PrintPage>
  ),
}
