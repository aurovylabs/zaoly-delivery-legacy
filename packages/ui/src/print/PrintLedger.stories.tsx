import type { Meta, StoryObj } from '@storybook/react-vite'
import { PrintLedger, PrintPage } from './PrintPrimitives'

const meta = {
  title: 'Print/Ledger',
  component: PrintLedger,
  tags: ['print', 'magazine'],
} satisfies Meta<typeof PrintLedger>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <PrintPage>
      <PrintLedger
        items={[
          { label: 'Erfahrung', score: 34, detail: 'Wenig First-Hand-Signale' },
          { label: 'Fachkompetenz', score: 58 },
          { label: 'Autorität', score: 71 },
          { label: 'Vertrauen', score: 82 },
        ]}
      />
    </PrintPage>
  ),
}
