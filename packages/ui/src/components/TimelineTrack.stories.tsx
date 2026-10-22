import type { Meta, StoryObj } from '@storybook/react-vite'
import { TimelineTrack } from './TimelineTrack'
import { TimelineClip } from './TimelineClip'

const meta = {
  title: 'Molecules/TimelineTrack',
  component: TimelineTrack,
  args: {
    label: 'V1',
    children: (
      <>
        <TimelineClip label="Intro" leftPct={5} widthPct={25} />
        <TimelineClip label="Main" leftPct={35} widthPct={40} active tone="accent" />
      </>
    ),
  },
} satisfies Meta<typeof TimelineTrack>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
