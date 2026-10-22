import type { Meta, StoryObj } from '@storybook/react-vite'
import { DataTable } from './DataTable'
import { Avatar } from './Avatar'

type Row = { id: string; name: string; score: number }

const rows: Row[] = [
  { id: '1', name: 'Alpha', score: 0.92 },
  { id: '2', name: 'Beta', score: 0.81 },
  { id: '3', name: 'Gamma', score: 0.44 },
]

const meta = {
  title: 'Organisms/DataTable',
  component: DataTable,
} satisfies Meta<typeof DataTable<Row>>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <DataTable
      caption="Demo ranked signals"
      getRowId={(r) => r.id}
      rows={rows}
      columns={[
        {
          id: 'name',
          header: 'Name',
          sortValue: (r) => r.name,
          cell: (r) => (
            <span style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
              <Avatar name={r.name} size="sm" />
              {r.name}
            </span>
          ),
        },
        {
          id: 'score',
          header: 'Score',
          align: 'end',
          sortValue: (r) => r.score,
          cell: (r) => r.score.toFixed(2),
        },
      ]}
    />
  ),
}

export const Empty: Story = {
  render: () => (
    <DataTable
      getRowId={(r: Row) => r.id}
      rows={[]}
      columns={[
        { id: 'name', header: 'Name', cell: (r) => r.name },
        { id: 'score', header: 'Score', cell: (r) => r.score },
      ]}
    />
  ),
}
