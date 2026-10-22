import type { Meta, StoryObj } from '@storybook/react-vite'
import { PrintChapter, PrintPage } from './PrintPrimitives'

const meta = {
  title: 'Print/Page',
  component: PrintPage,
  tags: ['print', 'magazine'],
} satisfies Meta<typeof PrintPage>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <PrintPage folioTitle="beispiel.de" folioPage="1 — 8">
      <PrintChapter eyebrow="Kapitel" title="Seite" lede="Folio-Chrome für Magazin-HTML." />
    </PrintPage>
  ),
}
