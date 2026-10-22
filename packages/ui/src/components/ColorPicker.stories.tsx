import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { ColorPicker } from './ColorPicker'

const meta = {
  title: 'Molecules/ColorPicker',
  component: ColorPicker,
  args: {
    value: '#0b3d2e',
  },
} satisfies Meta<typeof ColorPicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithAlpha: Story = {
  args: {
    value: '#c4a35a88',
    defaultOpen: true,
  },
}

export const OpenPanel: Story = {
  args: {
    value: '#1a1a1a',
    defaultOpen: true,
  },
}

export const Disabled: Story = {
  args: {
    value: '#245',
    disabled: true,
  },
}

function ControlledDemo() {
  const [value, setValue] = useState('#336699')
  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <ColorPicker value={value} onChange={setValue} />
      <code>{value}</code>
    </div>
  )
}

export const Controlled: Story = {
  render: () => <ControlledDemo />,
}
