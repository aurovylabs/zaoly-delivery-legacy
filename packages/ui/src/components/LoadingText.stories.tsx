import type { Meta, StoryObj } from '@storybook/react-vite'
import { LoadingText } from './LoadingText'
const meta = {
  title: 'Atoms/LoadingText',
  component: LoadingText,
  args: { children: 'Loading…' },
} satisfies Meta<typeof LoadingText>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
