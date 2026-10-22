import type { Meta, StoryObj } from '@storybook/react-vite'
import { ToggleGroup } from './ToggleGroup'
import { IconAlignCenter, IconAlignLeft, IconAlignRight } from './icons'

const meta = {
  title: 'Molecules/ToggleGroup',
  component: ToggleGroup,
} satisfies Meta<typeof ToggleGroup>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <ToggleGroup
      aria-label="View"
      value="all"
      onChange={() => {}}
      options={[
        { value: 'all', label: 'All' },
        { value: 'active', label: 'Active' },
      ]}
    />
  ),
}

export const IconRow: Story = {
  render: () => (
    <ToggleGroup
      aria-label="Align"
      variant="icon"
      value="start"
      onChange={() => {}}
      options={[
        { value: 'start', label: 'start', icon: <IconAlignLeft /> },
        { value: 'center', label: 'center', icon: <IconAlignCenter /> },
        { value: 'end', label: 'end', icon: <IconAlignRight /> },
      ]}
    />
  ),
}
