import type { Meta, StoryObj } from '@storybook/react-vite'
import { ToolButton } from './ToolButton'

const meta = {
  title: 'Atoms/ToolButton',
  component: ToolButton,
  args: {
    label: 'Play',
    children: '▶',
  },
} satisfies Meta<typeof ToolButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Active: Story = { args: { active: true } }
