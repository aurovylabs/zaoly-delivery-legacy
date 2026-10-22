import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Switch } from './Switch'
const meta = {
  title: 'Atoms/Switch',
  component: Switch,
} satisfies Meta<typeof Switch>
export default meta
type Story = StoryObj<typeof meta>
export const Default: Story = {
  render: function R() {
    const [on, setOn] = useState(true)
    return <Switch id="s1" label="Live updates" checked={on} onCheckedChange={setOn} />
  },
}
