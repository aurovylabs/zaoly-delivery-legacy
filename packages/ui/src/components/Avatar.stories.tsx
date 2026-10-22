import type { Meta, StoryObj } from '@storybook/react-vite'
import { Avatar } from './Avatar'

const meta = {
  title: 'Atoms/Avatar',
  component: Avatar,
  args: { name: 'Ada Lovelace', size: 'md', shape: 'square' },
  tags: ['magazine'],
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Initials: Story = {
  args: { name: 'Grace Hopper', size: 'lg', shape: 'square' },
}

export const Image: Story = {
  args: {
    name: 'MSQ',
    src: `data:image/svg+xml,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect fill="#ff6a3b" width="40" height="40"/></svg>',
    )}`,
    size: 'md',
    shape: 'square',
  },
}

export const Round: Story = {
  tags: ['workstation'],
  args: { name: 'List Mark', size: 'sm', shape: 'round' },
}
