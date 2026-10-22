import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { FontFamilyPicker } from './FontFamilyPicker'

const meta = {
  title: 'Molecules/FontFamilyPicker',
  component: FontFamilyPicker,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof FontFamilyPicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState('Inter')
    return <FontFamilyPicker {...args} value={value} onChange={setValue} data-testid="story-font" />
  },
}
