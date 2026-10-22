import type { Meta, StoryObj } from '@storybook/react-vite'
import { LabTile, LabTileStrip } from './LabTile'

const meta = {
  title: 'Molecules/LabTile',
  component: LabTile,
  args: {
    label: 'Pass rate',
    value: '86',
    unit: '%',
    meta: 'Last 7 days',
    tone: 'pos',
  },
} satisfies Meta<typeof LabTile>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Neutral: Story = { args: { tone: 'neutral', meta: 'Baseline' } }
export const Warning: Story = { args: { tone: 'low', value: '54', label: 'Coverage' } }
export const Negative: Story = { args: { tone: 'neg', value: '12', label: 'Blockers' } }

export const Strip: Story = {
  render: () => (
    <LabTileStrip columns={4}>
      <LabTile label="Checks" value="128" meta="Published" />
      <LabTile label="Pass" value="86" unit="%" tone="pos" />
      <LabTile label="Warn" value="9" tone="low" />
      <LabTile label="Fail" value="3" tone="neg" />
    </LabTileStrip>
  ),
}
