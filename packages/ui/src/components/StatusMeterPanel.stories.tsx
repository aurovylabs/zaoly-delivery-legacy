import type { Meta, StoryObj } from '@storybook/react-vite'
import { StatusMeterPanel } from './StatusMeterPanel'

const meta = {
  title: 'Organisms/StatusMeterPanel',
  component: StatusMeterPanel,
} satisfies Meta<typeof StatusMeterPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Workspace health',
    meta: 'live',
    level: 'ok',
    banner: 'Stable',
    meters: [
      { id: 'quality', label: 'Quality', value: '78%', fillPct: 78, meta: '14 / 18 ready' },
      { id: 'coverage', label: 'Coverage', value: '92%', fillPct: 92, meta: 'sources linked' },
      { id: 'latency', label: 'Latency', value: '240ms', fillPct: 35, meta: 'p95 sync' },
    ],
  },
}

export const Warn: Story = {
  args: {
    title: 'Workspace health',
    level: 'warn',
    banner: 'Elevated load',
    meters: [
      { id: 'queue', label: 'Queue', value: '64%', fillPct: 64 },
      { id: 'errors', label: 'Errors', value: '3%', fillPct: 3 },
      { id: 'retry', label: 'Retries', value: '11%', fillPct: 11 },
    ],
  },
}
