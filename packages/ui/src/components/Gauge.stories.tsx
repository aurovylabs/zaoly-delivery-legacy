import type { Meta, StoryObj } from '@storybook/react-vite'
import { Gauge } from './Gauge'

const meta = {
  title: 'Molecules/Gauge',
  component: Gauge,
  args: {
    value: 72,
    label: 'Fill rate',
    unit: '%',
  },
} satisfies Meta<typeof Gauge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Warn: Story = { args: { value: 38, tone: 'warn' } }
export const Full: Story = { args: { value: 100, tone: 'ok' } }
