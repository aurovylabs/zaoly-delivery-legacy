import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChannelLane, ChannelStack } from './ChannelStack'

const meta = {
  title: 'Molecules/ChannelStack',
  component: ChannelStack,
} satisfies Meta<typeof ChannelStack>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <ChannelStack aria-label="Think aloud">
      <ChannelLane label="Seen" open>
        Hero CTA and primary nav.
      </ChannelLane>
      <ChannelLane label="Think" defaultOpen>
        Looking for the official path.
      </ChannelLane>
      <ChannelLane label="Next" compact>
        Click primary action.
      </ChannelLane>
    </ChannelStack>
  ),
}
