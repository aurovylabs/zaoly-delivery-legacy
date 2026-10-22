import type { Meta, StoryObj } from '@storybook/react-vite'
import { EmptyState } from './LoadingText'
const meta = {
  title: 'Atoms/EmptyState',
  component: EmptyState,
  args: { children: 'No items yet' },
} satisfies Meta<typeof EmptyState>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
