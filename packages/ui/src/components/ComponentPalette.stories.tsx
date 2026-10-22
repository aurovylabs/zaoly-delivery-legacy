import type { Meta, StoryObj } from '@storybook/react-vite'
import { ComponentPalette } from './ComponentPalette'

const meta = {
  title: 'Organisms/ComponentPalette',
  component: ComponentPalette,
  args: {
    items: [
      { id: 'Stack', label: 'Stack', description: 'Flex layout' },
      { id: 'Button', label: 'Button', description: 'Action' },
      { id: 'Text', label: 'Text', description: 'Typography' },
    ],
  },
} satisfies Meta<typeof ComponentPalette>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
