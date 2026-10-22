import type { Meta, StoryObj } from '@storybook/react-vite'
import { PrintChip, PrintChipRow, PrintPage } from './PrintPrimitives'

const meta = {
  title: 'Print/Chip',
  component: PrintChip,
  tags: ['print', 'magazine'],
} satisfies Meta<typeof PrintChip>

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

/** P92 — all PrintChipTone values for HTML ↔ Mag parity smoke. */
export const Tones: Story = {
  render: () => (
    <PrintPage>
      <PrintChipRow>
        <PrintChip tone="default">default</PrintChip>
        <PrintChip tone="muted">muted</PrintChip>
        <PrintChip tone="accent">accent</PrintChip>
        <PrintChip tone="solid">solid</PrintChip>
      </PrintChipRow>
    </PrintPage>
  ),
}
