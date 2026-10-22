import type { Meta, StoryObj } from '@storybook/react-vite'
import { PrintPage, PrintSteps } from './PrintPrimitives'

const meta = {
  title: 'Print/Steps',
  component: PrintSteps,
  tags: ['print', 'magazine'],
} satisfies Meta<typeof PrintSteps>

export default meta
type Story = StoryObj<typeof meta>

const DEMO_STEPS = [
  { label: 'Audit', detail: 'Capture signals' },
  { label: 'Cluster', detail: 'Group themes' },
  { label: 'Prioritize', detail: 'Rank actions' },
  { label: 'Ship', detail: 'Publish fixes' },
]

export const Default: Story = {
  render: () => (
    <PrintPage>
      <PrintSteps steps={DEMO_STEPS} emphasisIndex={2} />
    </PrintPage>
  ),
}

export const Vertical: Story = {
  render: () => (
    <PrintPage>
      <PrintSteps steps={DEMO_STEPS} orientation="vertical" emphasisIndex={1} />
    </PrintPage>
  ),
}
