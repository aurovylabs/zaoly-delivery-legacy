import type { Meta, StoryObj } from '@storybook/react-vite'
import { FlowNodeEditorShell } from './FlowNodeEditorShell'

const meta = {
  title: 'Organisms/FlowNodeEditorShell',
  component: FlowNodeEditorShell,
  tags: ['magazine'],
  args: {
    open: true,
    onClose: () => {},
    kind: 'compare',
    kindLabel: 'Compare',
    title: 'Overall score ≥ 70',
    nodeId: 'n_compare',
    runState: 'done',
    input: (
      <div className="zaoly-flow-inspector-stats">
        <div className="zaoly-flow-inspector-stat">
          <span>Scan</span>
          <strong>overallScore · 72</strong>
        </div>
      </div>
    ),
    params: <p className="zaoly-flow-inspector-prose">Path, op, value fields</p>,
    output: <p className="zaoly-flow-inspector-prose">pass · actual 72</p>,
  },
} satisfies Meta<typeof FlowNodeEditorShell>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
