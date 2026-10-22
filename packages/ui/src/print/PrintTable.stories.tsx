import type { Meta, StoryObj } from '@storybook/react-vite'
import { PrintPage, PrintTable } from './PrintPrimitives'

const meta = {
  title: 'Print/Table',
  component: PrintTable,
  tags: ['print', 'magazine'],
} satisfies Meta<typeof PrintTable>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <PrintPage>
      <PrintTable
        columns={['Domain', 'Rolle', 'Score', 'Seiten', 'Fehler']}
        rows={[
          ['beispiel.de', 'Eigen', 57, 50, 213],
          ['wettbewerber.de', 'Wettbewerb', 61, 120, 88],
        ]}
      />
    </PrintPage>
  ),
}

/** P92 — numeric column right-aligned via columnAlign. */
export const ColumnAlign: Story = {
  render: () => (
    <PrintPage>
      <PrintTable
        columns={['Metric', 'Now', 'EUR']}
        columnAlign={['left', 'left', 'right']}
        rows={[
          ['GEO', 72, '1.240'],
          ['Pages', 8, '320'],
        ]}
      />
    </PrintPage>
  ),
}
