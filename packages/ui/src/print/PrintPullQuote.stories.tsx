import type { Meta, StoryObj } from '@storybook/react-vite'
import { PrintPage, PrintPullQuote } from './PrintPrimitives'

const meta = {
  title: 'Print/PullQuote',
  component: PrintPullQuote,
  tags: ['print', 'magazine'],
} satisfies Meta<typeof PrintPullQuote>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <PrintPage>
      <PrintPullQuote
        label="Fazit"
        body="Domain tragfähig; GEO-Prompts zeigen Lücken bei Lieferversprechen und lokalem Expertennachweis."
      />
    </PrintPage>
  ),
}
