import type { Meta, StoryObj } from '@storybook/react-vite'
import { Timecode } from './Timecode'

const meta = {
  title: 'Atoms/Timecode',
  component: Timecode,
  args: {
    value: '00:01:12:08',
    secondary: '00:05:00:00',
  },
} satisfies Meta<typeof Timecode>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
