import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { FlowBoardPalette } from './FlowBoardPalette'
import { Button } from './Button'

const meta = {
  title: 'Organisms/FlowBoardPalette',
  component: FlowBoardPalette,
  tags: ['magazine'],
} satisfies Meta<typeof FlowBoardPalette>

export default meta
type Story = StoryObj<typeof meta>

function PaletteDemo({ initialOpen }: { initialOpen: boolean }) {
  const [open, setOpen] = useState(initialOpen)
  return (
    <FlowBoardPalette open={open} onOpenChange={setOpen}>
      <div className="zaoly-flow-palette-row">
        {['Start', 'Prompt', 'Observe', 'Action', 'Gate'].map((k) => (
          <Button key={k} type="button" size="sm" variant="subtle">
            {k}
          </Button>
        ))}
      </div>
    </FlowBoardPalette>
  )
}

export const Open: Story = {
  args: { open: true, onOpenChange: () => undefined },
  render: () => <PaletteDemo initialOpen />,
}

export const Collapsed: Story = {
  args: { open: false, onOpenChange: () => undefined },
  render: () => <PaletteDemo initialOpen={false} />,
}
