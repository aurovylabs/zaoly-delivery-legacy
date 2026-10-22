import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChatBlockPanel } from './ChatBlockPanel'
import { ChatMetricGrid } from './ChatMetricGrid'

const meta = {
  title: 'Molecules/ChatMetricGrid',
  component: ChatMetricGrid,
  args: {
    items: [
      { label: 'PageSpeed', value: 92, unit: '/100', tone: 'success' },
      { label: 'Scans', value: 12, hint: 'CHECKION' },
      { label: 'Personas', value: 4, hint: 'AUDION' },
    ],
  },
} satisfies Meta<typeof ChatMetricGrid>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithTones: Story = {
  args: {
    items: [
      { label: 'GEO Score', value: 62, unit: '/100', tone: 'warning' },
      { label: 'Citations', value: 3, tone: 'error', hint: 'unter Ziel' },
      { label: 'Coverage', value: '78%', tone: 'info' },
    ],
  },
  render: (args) => (
    <ChatBlockPanel title="GEO Kennzahlen" eyebrow="metrics">
      <ChatMetricGrid {...args} />
    </ChatBlockPanel>
  ),
}
