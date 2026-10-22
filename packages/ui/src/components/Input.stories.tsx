import type { Meta, StoryObj } from '@storybook/react-vite'
import { Input } from './Input'
const meta = {
  title: 'Atoms/Input',
  component: Input,
  args: { size: 'sm', placeholder: 'Search…', 'aria-label': 'Search' },
} satisfies Meta<typeof Input>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Medium: Story = { args: { size: 'md' } }
export const Disabled: Story = { args: { disabled: true, defaultValue: 'Locked' } }
