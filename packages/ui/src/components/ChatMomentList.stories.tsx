import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChatBlockPanel } from './ChatBlockPanel'
import { ChatMomentList } from './ChatMomentList'

const meta = {
  title: 'Molecules/ChatMomentList',
  component: ChatMomentList,
  args: {
    items: [
      { id: 'm1', kind: 'action' as const, label: 'Öffnet Vergleichsseite' },
      { id: 'm2', kind: 'thought' as const, label: 'Passt das zu unserem Stack?' },
      { id: 'm3', kind: 'feeling' as const, label: 'Unsicher wegen Lock-in' },
      { id: 'm4', kind: 'pain' as const, label: 'Zu viele Formularfelder' },
      { id: 'm5', kind: 'opportunity' as const, label: 'FAQ mit Citations platzieren' },
    ],
  },
} satisfies Meta<typeof ChatMomentList>

export default meta
type Story = StoryObj<typeof meta>

export const MixedKinds: Story = {}

export const InPanel: Story = {
  render: (args) => (
    <ChatBlockPanel title="Consideration · Moments" eyebrow="moments">
      <ChatMomentList {...args} />
    </ChatBlockPanel>
  ),
}
