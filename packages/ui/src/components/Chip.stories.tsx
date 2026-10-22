import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Chip } from './Chip'

const meta = {
  title: 'Atoms/Chip',
  component: Chip,
  args: {
    children: 'MARKET',
    size: 'sm',
    selected: false,
  },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof Chip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Selected: Story = {
  args: { selected: true },
}

export const Small: Story = {
  args: { size: 'sm', children: 'TECHNOLOGY' },
}

export const Static: Story = {
  args: { static: true, children: 'READ-ONLY' },
}

export const Disabled: Story = {
  args: { disabled: true, children: 'Off' },
}

export const FilterRow: Story = {
  render: function FilterRowStory() {
    const [cat, setCat] = useState<string | null>(null)
    const cats = ['TECHNOLOGY', 'MARKET', 'REGULATORY', 'POLITICS']
    return (
      <div className="ds-chip-row">
        <Chip size="sm" selected={cat == null} onClick={() => setCat(null)}>
          ALL
        </Chip>
        {cats.map((c) => (
          <Chip key={c} size="sm" selected={cat === c} onClick={() => setCat(cat === c ? null : c)}>
            {c}
          </Chip>
        ))}
      </div>
    )
  },
}
