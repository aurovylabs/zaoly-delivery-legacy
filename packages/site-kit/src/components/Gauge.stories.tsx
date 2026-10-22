import type { Meta, StoryObj } from '@storybook/react-vite'
import { Gauge } from './Gauge'

const meta = {
  title: 'Site/Gauge',
  component: Gauge,
  tags: ['site-kit'],
  args: {
    value: 72,
    min: 0,
    max: 100,
    label: 'Score',
    unit: '%',
    tone: 'ok',
  },
} satisfies Meta<typeof Gauge>

export default meta
export const Default: StoryObj<typeof meta> = {}
