import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge, type BadgeTone } from './Badge'

const meta = {
  title: 'Atoms/Badge',
  component: Badge,
  args: {
    children: 'Badge',
    tone: 'neutral',
  },
  argTypes: {
    tone: {
      control: 'select',
      options: ['neutral', 'accent', 'success', 'warning', 'danger'] satisfies BadgeTone[],
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Tones: Story = {
  render: () => (
    <div className="ds-chip-row" style={{ gap: '0.5rem', flexWrap: 'wrap' }}>
      <Badge tone="neutral">Neutral</Badge>
      <Badge tone="accent">Accent</Badge>
      <Badge tone="success">Ready</Badge>
      <Badge tone="warning">Processing</Badge>
      <Badge tone="danger">Failed</Badge>
    </div>
  ),
}

export const MediaStatus: Story = {
  name: 'Media status (browse)',
  render: () => (
    <div className="ds-chip-row" style={{ gap: '0.35rem', flexWrap: 'wrap' }}>
      <Badge tone="success">Bereit</Badge>
      <Badge tone="warning">Verarbeitung</Badge>
      <Badge tone="accent">Upload</Badge>
      <Badge tone="danger">Fehler</Badge>
      <Badge tone="neutral">Keine Analyse</Badge>
      <Badge tone="success">Analysiert</Badge>
      <Badge tone="warning">Analyse läuft</Badge>
      <Badge tone="danger">Analyse fehlgeschlagen</Badge>
    </div>
  ),
}
