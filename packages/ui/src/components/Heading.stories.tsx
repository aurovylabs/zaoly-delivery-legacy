import type { Meta, StoryObj } from '@storybook/react-vite'
import { Heading } from './Heading'

const meta = {
  title: 'Atoms/Heading',
  component: Heading,
  args: {
    children: 'Heading',
  },
} satisfies Meta<typeof Heading>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
