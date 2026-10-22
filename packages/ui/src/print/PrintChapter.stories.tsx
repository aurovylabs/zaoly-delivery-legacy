import type { Meta, StoryObj } from '@storybook/react-vite'
import { PrintChapter, PrintPage, PrintRankedList } from './PrintPrimitives'

const meta = {
  title: 'Print/Chapter',
  component: PrintChapter,
  tags: ['print', 'magazine'],
} satisfies Meta<typeof PrintChapter>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <PrintPage>
      <PrintChapter
        index="02"
        eyebrow="Markt & Trends"
        title="Markt & Trends"
        lede="Kurzüberblick über Nachfrage und Wettbewerb."
      >
        <PrintRankedList
          items={[
            { label: 'Nachfrage nach konfigurierbaren Sets steigt' },
            { label: 'Lokale Verfügbarkeit bleibt Kaufkriterium' },
          ]}
        />
      </PrintChapter>
    </PrintPage>
  ),
}
