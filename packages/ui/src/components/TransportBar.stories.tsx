import type { Meta, StoryObj } from '@storybook/react-vite'
import { TransportBar } from './TransportBar'
import { ToolButton } from './ToolButton'
import { Timecode } from './Timecode'

const meta = {
  title: 'Molecules/TransportBar',
  component: TransportBar,
  args: {
    controls: (
      <>
        <ToolButton label="Back">⏮</ToolButton>
        <ToolButton label="Play">▶</ToolButton>
        <ToolButton label="Forward">⏭</ToolButton>
      </>
    ),
    timecode: <Timecode value="00:00:12:00" secondary="00:01:00:00" />,
  },
} satisfies Meta<typeof TransportBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
