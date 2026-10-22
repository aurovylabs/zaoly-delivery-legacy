import type { Meta, StoryObj } from '@storybook/react-vite'
import { Checkbox } from './Checkbox'
const meta = {
  title: 'Atoms/Checkbox',
  component: Checkbox,
  args: { id: 'c1', label: 'Include near-duplicates' },
} satisfies Meta<typeof Checkbox>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {}
export const Checked: Story = { args: { defaultChecked: true } }
export const Disabled: Story = { args: { disabled: true } }
