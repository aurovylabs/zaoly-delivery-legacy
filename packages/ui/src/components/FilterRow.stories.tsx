import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Chip } from './Chip'
import { FilterRow } from './FilterRow'

const meta = {
  title: 'Molecules/FilterRow',
  component: FilterRow,
  tags: ['magazine'],
} satisfies Meta<typeof FilterRow>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: function MagazineFilters() {
    const [sev, setSev] = useState('all')
    return (
      <FilterRow aria-label="Severity">
        {(['all', 'critical', 'serious', 'moderate'] as const).map((s) => (
          <Chip key={s} size="sm" selected={sev === s} onClick={() => setSev(s)}>
            {s}
          </Chip>
        ))}
      </FilterRow>
    )
  },
}

export const WithLabel: Story = {
  render: () => (
    <FilterRow label="Capability">
      <Chip size="sm" selected>
        WCAG
      </Chip>
      <Chip size="sm">GEO</Chip>
      <Chip size="sm">SEO</Chip>
    </FilterRow>
  ),
}

export const Toolbar: Story = {
  tags: ['workstation'],
  render: () => (
    <FilterRow variant="toolbar" label="View">
      <Chip size="sm" selected>
        All
      </Chip>
      <Chip size="sm">Recent</Chip>
    </FilterRow>
  ),
}
