import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChatBlockPanel } from './ChatBlockPanel'
import { ChatKeyValueList } from './ChatKeyValueList'

const meta = {
  title: 'Molecules/ChatKeyValueList',
  component: ChatKeyValueList,
  args: {
    items: [
      { label: 'Projekt', value: 'Demo Website' },
      { label: 'Domain', value: 'example.com' },
      { label: 'Status', value: 'Aktiv' },
    ],
  },
} satisfies Meta<typeof ChatKeyValueList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const InPanel: Story = {
  render: (args) => (
    <ChatBlockPanel title="Details" eyebrow="details">
      <ChatKeyValueList {...args} />
    </ChatBlockPanel>
  ),
}
