import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { SelectionHandles } from './SelectionHandles'

const meta = {
  title: 'Organisms/SelectionHandles',
  component: SelectionHandles,
  decorators: [
    (Story) => (
      <div style={{ position: 'relative', width: 280, height: 180, background: 'var(--surface-2, #f0f0f0)' }}>
        <div
          style={{
            position: 'absolute',
            left: 40,
            top: 40,
            width: 120,
            height: 80,
            background: 'var(--surface-1, #fff)',
            border: '1px dashed var(--border, #ccc)',
          }}
        />
        <Story />
      </div>
    ),
  ],
  args: {
    left: 40,
    top: 40,
    width: 120,
    height: 80,
  },
} satisfies Meta<typeof SelectionHandles>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Interactive: Story = {
  render: function InteractiveStory() {
    const [last, setLast] = useState<string>('—')
    return (
      <>
        <SelectionHandles
          left={40}
          top={40}
          width={120}
          height={80}
          interactive
          onHandlePointerDown={(handle) => setLast(handle)}
        />
        <span style={{ position: 'absolute', bottom: 8, left: 8, fontSize: 12 }}>
          Last handle: {last}
        </span>
      </>
    )
  },
}
