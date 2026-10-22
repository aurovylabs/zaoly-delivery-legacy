import type { Meta, StoryObj } from '@storybook/react-vite'
import { TimelineRuler } from './TimelineRuler'

const meta = {
  title: 'Molecules/TimelineRuler',
  component: TimelineRuler,
  args: {
    marks: [
      { id: '0', label: '0', offsetPct: 0 },
      { id: '50', label: '50%', offsetPct: 50 },
      { id: '100', label: '100%', offsetPct: 100 },
    ],
    playheadPct: 35,
  },
} satisfies Meta<typeof TimelineRuler>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
