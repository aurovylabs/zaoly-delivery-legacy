import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChatBlockPanel } from './ChatBlockPanel'
import { ChatLinkList } from './ChatLinkList'

const meta = {
  title: 'Molecules/ChatLinkList',
  component: ChatLinkList,
  args: {
    links: [
      { label: 'PLEXON Dashboard', href: '/projects/demo' },
      { label: 'Zaoly', href: 'https://zaoly.app', external: true },
    ],
  },
} satisfies Meta<typeof ChatLinkList>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const InPanel: Story = {
  render: (args) => (
    <ChatBlockPanel title="Links" eyebrow="links">
      <ChatLinkList {...args} />
    </ChatBlockPanel>
  ),
}
