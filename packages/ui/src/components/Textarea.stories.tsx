import type { Meta, StoryObj } from '@storybook/react-vite'
import { Textarea } from './Textarea'
const meta = {
  title: 'Atoms/Textarea',
  component: Textarea,
  args: { size: 'sm', rows: 4, placeholder: 'Ask…', 'aria-label': 'Ask' },
} satisfies Meta<typeof Textarea>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Disabled: Story = { args: { disabled: true, defaultValue: 'Locked' } }
