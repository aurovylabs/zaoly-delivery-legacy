import type { Meta, StoryObj } from '@storybook/react-vite'
import { FlowRunStrip } from './FlowRunStrip'
import { Button } from './Button'

const meta = {
  title: 'Organisms/FlowRunStrip',
  component: FlowRunStrip,
  tags: ['magazine'],
  args: {
    status: <strong>running</strong>,
    meta: <span>3 / 9 steps</span>,
    links: (
      <Button type="button" size="sm" variant="link">
        Soft-Q
      </Button>
    ),
    verdict: <span className="zaoly-flow-verdict-lede">Collection ready pending gates</span>,
  },
} satisfies Meta<typeof FlowRunStrip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
