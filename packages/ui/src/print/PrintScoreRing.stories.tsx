import type { Meta, StoryObj } from '@storybook/react-vite'
import { PrintPage, PrintScoreRing } from './PrintPrimitives'

const meta = {
  title: 'Print/ScoreRing',
  component: PrintScoreRing,
  tags: ['print', 'magazine'],
} satisfies Meta<typeof PrintScoreRing>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <PrintPage>
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        <PrintScoreRing value={57} label="Domain" />
        <PrintScoreRing value={72} label="GEO Fitness" />
        <PrintScoreRing value={28} label="GEO Score" />
      </div>
    </PrintPage>
  ),
}
