import type { Meta, StoryObj } from '@storybook/react-vite'
import { Hint } from './Hint'
const meta = {
  title: 'Atoms/Hint',
  component: Hint,
  args: { children: 'click row → detail', panel: true },
} satisfies Meta<typeof Hint>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
