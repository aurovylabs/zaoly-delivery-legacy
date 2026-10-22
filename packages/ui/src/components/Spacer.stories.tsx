import type { Meta, StoryObj } from '@storybook/react-vite'
import { Spacer } from './Spacer'
import { Stack } from './Stack'
import { Text } from './Text'

const meta = {
  title: 'Atoms/Spacer',
  component: Spacer,
  args: {
    size: 'lg',
  },
  render: (args) => (
    <Stack>
      <Text>Above</Text>
      <Spacer {...args} />
      <Text>Below</Text>
    </Stack>
  ),
} satisfies Meta<typeof Spacer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
