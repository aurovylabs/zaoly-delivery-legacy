import type { Meta, StoryObj } from '@storybook/react-vite'
import { TimelineClip } from './TimelineClip'

const meta = {
  title: 'Molecules/TimelineClip',
  component: TimelineClip,
  args: {
    label: 'Clip',
    leftPct: 10,
    widthPct: 30,
  },
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', height: 40, width: '100%' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TimelineClip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
