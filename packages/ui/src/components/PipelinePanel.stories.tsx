import type { Meta, StoryObj } from '@storybook/react-vite'
import { PipelinePanel } from './PipelinePanel'

const meta = {
  title: 'Organisms/PipelinePanel',
  component: PipelinePanel,
} satisfies Meta<typeof PipelinePanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Persona pipeline',
    lanes: [
      { id: 'draft', label: 'Draft', value: '4', fillPct: 40, tone: 'enrich' },
      { id: 'ready', label: 'Ready', value: '12', fillPct: 80, tone: 'embed', selected: true },
      { id: 'rss', label: 'Signals', value: '86', fillPct: 55, tone: 'rss', meta: 'last 24h' },
    ],
    focusSlot: {
      label: 'Review slot',
      value: 'idle',
      state: 'idle',
      fillPct: 12,
      meta: 'No blocker',
    },
    operations: [
      {
        id: 'coverage',
        label: 'Coverage',
        state: 'active',
        detail: '14 / 18 complete',
        fillPct: 78,
        live: true,
      },
      {
        id: 'embed',
        label: 'Embeddings',
        state: 'paused',
        detail: 'Queue drained',
        fillPct: 100,
        tone: 'embed',
      },
    ],
  },
}
