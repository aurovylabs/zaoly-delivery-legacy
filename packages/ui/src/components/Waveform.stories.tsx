import type { Meta, StoryObj } from '@storybook/react-vite'
import { Waveform } from './Waveform'

const meta = {
  title: 'Molecules/Waveform',
  component: Waveform,
  args: {
    peaks: Array.from({ length: 64 }, (_, i) => 0.2 + Math.abs(Math.sin(i / 4)) * 0.7),
    progressPct: 40,
  },
} satisfies Meta<typeof Waveform>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
