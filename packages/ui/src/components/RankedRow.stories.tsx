import type { Meta, StoryObj } from '@storybook/react-vite'
import { RankedRow } from './RankedList'

const meta = {
  title: 'Molecules/RankedRow',
  component: RankedRow,
} satisfies Meta<typeof RankedRow>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (<RankedRow index={1} label="Priority item" value={0.82} secondary="82%" barPct={82} />),
}
