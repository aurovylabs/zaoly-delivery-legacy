import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChatBlockPanel } from './ChatBlockPanel'
import { ChatEntityGrid } from './ChatEntityGrid'

const meta = {
  title: 'Molecules/ChatEntityGrid',
  component: ChatEntityGrid,
  args: {
    items: [
      {
        id: 'p1',
        title: 'Alex Rivera',
        subtitle: 'B2B Buyer',
        description: 'Vergleicht Anbieter und sucht belastbare Citations.',
        badge: '82%',
        tags: ['Persona'],
        accent: 'pink' as const,
      },
      {
        id: 'p2',
        title: 'Sam Chen',
        subtitle: 'Ops Lead',
        description: 'Will schnelle Checks ohne Tool-Chaos.',
        badge: '74%',
        tags: ['Persona'],
        accent: 'pink' as const,
      },
    ],
  },
} satisfies Meta<typeof ChatEntityGrid>

export default meta
type Story = StoryObj<typeof meta>

export const Personas: Story = {
  render: (args) => (
    <ChatBlockPanel title="Personas" eyebrow="audion">
      <ChatEntityGrid {...args} />
    </ChatBlockPanel>
  ),
}

export const Audiences: Story = {
  args: {
    items: [
      {
        id: 'tg1',
        title: 'Enterprise Marketing',
        subtitle: 'Segment A',
        description: 'Brand-guidelines und Measurables im Fokus.',
        tags: ['2 Personas', '5 Knowledge'],
        accent: 'green',
      },
      {
        id: 'tg2',
        title: 'SMB Founders',
        subtitle: 'Segment B',
        description: 'Schnelle Marken-Checks vor dem Launch.',
        tags: ['3 Personas', '2 Knowledge'],
        accent: 'neutral',
      },
    ],
  },
  render: (args) => (
    <ChatBlockPanel title="Zielgruppen" eyebrow="audiences">
      <ChatEntityGrid {...args} />
    </ChatBlockPanel>
  ),
}
