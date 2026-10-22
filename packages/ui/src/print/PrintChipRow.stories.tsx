import type { Meta, StoryObj } from '@storybook/react-vite'
import { PrintChip, PrintChipRow, PrintPage } from './PrintPrimitives'

const meta = {
  title: 'Print/ChipRow',
  component: PrintChipRow,
  tags: ['print', 'magazine'],
} satisfies Meta<typeof PrintChipRow>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <PrintPage>
      <PrintChipRow>
        <PrintChip>B2B Entscheiderin</PrintChip>
        <PrintChip>82% Konfidenz</PrintChip>
      </PrintChipRow>
    </PrintPage>
  ),
}
