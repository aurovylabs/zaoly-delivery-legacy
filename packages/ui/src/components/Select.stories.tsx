import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { narrowViewportGlobals } from '../storybook/viewports'
import { Select } from './Select'
const opts = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma', disabled: true },
]
const meta = {
  title: 'Atoms/Select',
  component: Select,
  args: { options: opts, 'aria-label': 'Choice', size: 'sm' },
} satisfies Meta<typeof Select>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: function R(args) {
    const [v, setV] = useState('a')
    return <Select {...args} value={v} onChange={setV} />
  },
}
export const Narrow: Story = {
  ...Default,
  globals: narrowViewportGlobals,
}
export const Disabled: Story = { args: { disabled: true, defaultValue: 'a' } }
