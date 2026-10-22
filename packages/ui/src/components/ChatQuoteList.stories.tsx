import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChatBlockPanel } from './ChatBlockPanel'
import { ChatQuoteList } from './ChatQuoteList'

const meta = {
  title: 'Molecules/ChatQuoteList',
  component: ChatQuoteList,
  args: {
    items: [
      {
        quote: 'Ich brauche Citations, sonst vertraue ich dem Anbieter nicht.',
        attribution: 'Alex · Consideration',
        context: 'Friction: fehlende Quellen auf der Vergleichsseite',
        tone: 'warning' as const,
      },
      {
        quote: 'Eine klare FAQ würde mir die Entscheidung erleichtern.',
        attribution: 'Alex · Decision',
        context: 'Recommendation: FAQ mit Schema.org',
        tone: 'info' as const,
      },
    ],
  },
} satisfies Meta<typeof ChatQuoteList>

export default meta
type Story = StoryObj<typeof meta>

export const ValidateQuotes: Story = {}

export const InPanel: Story = {
  render: (args) => (
    <ChatBlockPanel title="Persona-Stimmen" eyebrow="validate">
      <ChatQuoteList {...args} />
    </ChatBlockPanel>
  ),
}
