import type { Meta, StoryObj } from '@storybook/react-vite'
import { MetricChip } from './MetricChip'

const meta = {
  title: 'Molecules/MetricChip',
  component: MetricChip,
} satisfies Meta<typeof MetricChip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (<MetricChip label="Signals">42</MetricChip>),
}
