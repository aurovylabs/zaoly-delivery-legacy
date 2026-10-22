import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChatBlockPanel } from './ChatBlockPanel'
import { ChatDataTable } from './ChatDataTable'

const meta = {
  title: 'Molecules/ChatDataTable',
  component: ChatDataTable,
  args: {
    columns: ['Seite', 'Score', 'Issues'],
    rows: [
      ['/', 94, 2],
      ['/produkte', 88, 5],
      ['/kontakt', 91, 1],
    ],
  },
} satisfies Meta<typeof ChatDataTable>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const InPanelFlush: Story = {
  render: (args) => (
    <ChatBlockPanel title="Scan-Seiten" eyebrow="table" flush>
      <ChatDataTable {...args} />
    </ChatBlockPanel>
  ),
}
