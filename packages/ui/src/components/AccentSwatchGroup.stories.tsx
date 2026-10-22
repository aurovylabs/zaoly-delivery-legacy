import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import type { AccentPreference } from '../accentPreference'
import { AccentSwatchGroup } from './AccentSwatchGroup'

const meta = {
  title: 'Molecules/AccentSwatchGroup',
  component: AccentSwatchGroup,
} satisfies Meta<typeof AccentSwatchGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: function Render() {
    const [value, setValue] = useState<AccentPreference>('green')
    return (
      <AccentSwatchGroup
        value={value}
        onChange={setValue}
        labels={{
          purple: 'Purple',
          blue: 'Blue',
          pink: 'Pink',
          orange: 'Orange',
          green: 'Green',
          yellow: 'Yellow',
          grey: 'Grey',
          ink: 'Ink',
        }}
      />
    )
  },
}
