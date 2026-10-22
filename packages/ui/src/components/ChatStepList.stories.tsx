import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChatBlockPanel } from './ChatBlockPanel'
import { ChatStepList } from './ChatStepList'

const meta = {
  title: 'Molecules/ChatStepList',
  component: ChatStepList,
  args: {
    steps: [
      { id: 's1', label: 'Research', status: 'done' as const },
      { id: 's2', label: 'Personas', status: 'running' as const, progress: 60, detail: 'AUDION' },
      { id: 's3', label: 'Journey', status: 'pending' as const },
      { id: 's4', label: 'QA Gate', status: 'error' as const, detail: 'Timeout' },
    ],
  },
} satisfies Meta<typeof ChatStepList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Running: Story = {
  args: {
    steps: [
      { id: 'a', label: 'Domain resolve', status: 'done' },
      { id: 'b', label: 'GEO crawl', status: 'running', progress: 35 },
      { id: 'c', label: 'Score', status: 'pending' },
    ],
  },
  render: (args) => (
    <ChatBlockPanel title="Workflow" eyebrow="steps">
      <ChatStepList {...args} />
    </ChatBlockPanel>
  ),
}
