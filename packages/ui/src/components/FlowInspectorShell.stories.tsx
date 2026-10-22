import type { Meta, StoryObj } from '@storybook/react-vite'
import { FlowInspectorShell } from './FlowInspectorShell'

const meta = {
  title: 'Organisms/FlowInspectorShell',
  component: FlowInspectorShell,
  tags: ['magazine'],
  args: {
    kind: 'action',
    kindLabel: 'Action',
    title: 'Click Buy',
    nodeId: 'n_action',
    runState: 'done',
    sections: [
      {
        id: 'design',
        title: 'Design',
        children: <p className="zaoly-flow-inspector-prose">Selector + notes</p>,
      },
      {
        id: 'run',
        title: 'Run',
        meta: 'ok',
        children: <p className="zaoly-flow-inspector-prose">Completed in 1.2s</p>,
      },
      {
        id: 'gate',
        title: 'Gate',
        defaultOpen: false,
        children: <p className="zaoly-flow-inspector-prose">No gate</p>,
      },
    ],
  },
} satisfies Meta<typeof FlowInspectorShell>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
