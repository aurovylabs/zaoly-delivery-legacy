import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { BreakpointEditor } from './BreakpointEditor'

const meta = {
  title: 'Molecules/BreakpointEditor',
  component: BreakpointEditor,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof BreakpointEditor>

export default meta
type Story = StoryObj<typeof meta>

export const Digital: Story = {
  render: (args) => {
    const [value, setValue] = useState('768px')
    return (
      <BreakpointEditor {...args} channel="digital" value={value} onChange={setValue} data-testid="story-bp" />
    )
  },
}

export const Print: Story = {
  render: (args) => {
    const [value, setValue] = useState('148mm')
    return (
      <BreakpointEditor {...args} channel="print" value={value} onChange={setValue} data-testid="story-bp" />
    )
  },
}
