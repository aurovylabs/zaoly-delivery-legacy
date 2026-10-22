import type { Meta, StoryObj } from '@storybook/react-vite'
import { KpiStrip } from './KpiStrip'

const meta = {
  title: 'Organisms/KpiStrip',
  component: KpiStrip,
} satisfies Meta<typeof KpiStrip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    items: [
      { id: 'total', label: 'Personas', value: '18', meta: 'workspace' },
      { id: 'ready', label: 'Ready', value: '12', meta: '67%' },
      { id: 'draft', label: 'Draft', value: '4', meta: 'in review' },
      { id: 'blocked', label: 'Blocked', value: '2', meta: 'needs data' },
    ],
  },
}

export const Interactive: Story = {
  render: () => (
    <KpiStrip
      items={[
        {
          id: 'open',
          label: 'Open issues',
          value: '7',
          meta: 'click me',
          onClick: () => undefined,
        },
        { id: 'resolved', label: 'Resolved', value: '41', meta: '7d' },
      ]}
    />
  ),
}
