import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChatBlockPanel } from './ChatBlockPanel'
import { ChatPhaseStrip } from './ChatPhaseStrip'

const meta = {
  title: 'Molecules/ChatPhaseStrip',
  component: ChatPhaseStrip,
  args: {
    phases: [
      { id: 'p1', label: 'Awareness', summary: 'Erste Berührung mit der Marke', status: 'done' as const },
      {
        id: 'p2',
        label: 'Consideration',
        summary: 'Vergleicht Anbieter und sucht Citations',
        active: true,
        status: 'current' as const,
      },
      { id: 'p3', label: 'Decision', summary: 'Finaler Kaufweg', status: 'upcoming' as const },
    ],
  },
} satisfies Meta<typeof ChatPhaseStrip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const InPanel: Story = {
  render: (args) => (
    <ChatBlockPanel title="Journey outline" eyebrow="phases">
      <ChatPhaseStrip {...args} />
    </ChatBlockPanel>
  ),
}
