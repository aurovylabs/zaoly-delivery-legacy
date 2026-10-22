import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Slider } from './Slider'

const meta = {
  title: 'Atoms/Slider',
  component: Slider,
  args: {
    value: 50,
    min: 0,
    max: 100,
    'aria-label': 'Example slider',
  },
} satisfies Meta<typeof Slider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: function DefaultStory(args) {
    const [value, setValue] = useState(args.value ?? 50)
    return <Slider {...args} value={value} onChange={setValue} />
  },
}

export const High: Story = {
  render: function HighStory() {
    const [value, setValue] = useState(88)
    return <Slider value={value} onChange={setValue} aria-label="High fill" />
  },
}

export const Disabled: Story = {
  args: {
    value: 35,
    disabled: true,
    'aria-label': 'Disabled slider',
  },
}
