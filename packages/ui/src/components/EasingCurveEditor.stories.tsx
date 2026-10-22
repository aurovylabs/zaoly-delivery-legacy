import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { EasingCurveEditor } from './EasingCurveEditor'

const meta = {
  title: 'Molecules/EasingCurveEditor',
  component: EasingCurveEditor,
  args: {
    value: 'cubic-bezier(0.4, 0, 0.2, 1)',
    enableCustomLabel: 'Use custom cubic-bezier',
  },
} satisfies Meta<typeof EasingCurveEditor>

export default meta
type Story = StoryObj<typeof meta>

export const MaterialStandard: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value)
    return <EasingCurveEditor {...args} value={value} onChange={setValue} data-testid="story-easing" />
  },
}

export const KeywordEnable: Story = {
  args: { value: 'ease-in-out' },
  render: (args) => {
    const [value, setValue] = useState(args.value)
    return <EasingCurveEditor {...args} value={value} onChange={setValue} data-testid="story-easing" />
  },
}
