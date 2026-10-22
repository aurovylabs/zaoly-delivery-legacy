import type { Meta, StoryObj } from '@storybook/react-vite'
import { FlowBoardToolbar } from './FlowBoardToolbar'
import { Button } from './Button'

const meta = {
  title: 'Organisms/FlowBoardToolbar',
  component: FlowBoardToolbar,
  tags: ['magazine'],
  args: {
    dirty: true,
    children: (
      <>
        <Button type="button" size="sm" variant="ghost" className="zaoly-flow-toolbar-btn">
          Undo
        </Button>
        <Button type="button" size="sm" variant="primary" className="zaoly-flow-toolbar-btn">
          Save
        </Button>
      </>
    ),
  },
} satisfies Meta<typeof FlowBoardToolbar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
