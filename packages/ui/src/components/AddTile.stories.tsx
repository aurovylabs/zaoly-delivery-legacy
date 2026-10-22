import type { Meta, StoryObj } from '@storybook/react-vite'
import { AddTile } from './AddTile'

const meta = {
  title: 'Atoms/AddTile',
  component: AddTile,
  args: {
    label: 'Add',
  },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Dashed grid “add” tile — Brandion token board empty slot.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '16rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AddTile>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Disabled: Story = {
  args: { disabled: true },
}

export const Tall: Story = {
  args: { className: 'ds-add-tile--tall', label: 'Add layout' },
}
