import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChatCollapsible } from './ChatCollapsible'
import { Text } from './Text'

const meta = {
  title: 'Molecules/ChatCollapsible',
  component: ChatCollapsible,
  args: {
    title: 'Methoden-Notiz',
    children: (
      <Text role="meta" as="p" style={{ margin: 0 }}>
        Lange Detailtexte bleiben eingeklappt — Produkt rendert Markdown im Body-Slot.
      </Text>
    ),
  },
} satisfies Meta<typeof ChatCollapsible>

export default meta
type Story = StoryObj<typeof meta>

export const Closed: Story = {}

export const Open: Story = {
  args: { defaultOpen: true },
}
