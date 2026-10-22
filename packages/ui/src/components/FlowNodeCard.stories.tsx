import type { Meta, StoryObj } from '@storybook/react-vite'
import { FlowNodeCard } from './FlowNodeCard'

const meta = {
  title: 'Organisms/FlowNodeCard',
  component: FlowNodeCard,
  tags: ['magazine'],
  args: {
    kind: 'prompt',
    kindLabel: 'Prompt',
    nodeId: 'node_prompt_1',
    runState: 'active',
    selected: true,
    children: (
      <label className="zaoly-flow-rf-field">
        <span>Text</span>
        <textarea className="ds-textarea" rows={3} defaultValue="Find the buy button" readOnly />
      </label>
    ),
  },
} satisfies Meta<typeof FlowNodeCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithOutput: Story = {
  args: {
    hasOutput: true,
    runState: 'done',
    output: (
      <div className="zaoly-flow-rf-output">
        <p className="zaoly-flow-rf-output-label">Output</p>
        <p className="zaoly-flow-rf-output-headline">Clicked Buy</p>
        <p className="zaoly-flow-rf-output-text">Saw primary CTA in header.</p>
      </div>
    ),
  },
}

export const Gate: Story = {
  args: {
    kind: 'gate',
    kindLabel: 'Gate',
    runState: 'idle',
    selected: false,
    children: (
      <label className="zaoly-flow-rf-field">
        <span>Condition</span>
        <input className="ds-input" defaultValue="manual" readOnly />
      </label>
    ),
  },
}
