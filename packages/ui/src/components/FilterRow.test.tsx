import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FilterRow } from './FilterRow'
import { Chip } from './Chip'

describe('FilterRow', () => {
  it('renders magazine hairline band by default', () => {
    const { container } = render(
      <FilterRow aria-label="Severity">
        <Chip selected>All</Chip>
        <Chip>Critical</Chip>
      </FilterRow>,
    )
    const row = container.querySelector('.ds-filter-row')
    expect(row).toHaveAttribute('data-variant', 'magazine')
    expect(row?.className).toContain('ds-filter-row--magazine')
    expect(container.querySelector('.ds-filter-row-chips')).toBeTruthy()
    expect(screen.getByText('All')).toBeTruthy()
  })

  it('supports label eyebrow and toolbar variant', () => {
    const { container } = render(
      <FilterRow label="Severity" variant="toolbar">
        <Chip>A</Chip>
      </FilterRow>,
    )
    expect(screen.getByText('Severity').className).toContain('ds-filter-row-label')
    expect(container.querySelector('.ds-filter-row--toolbar')).toBeTruthy()
  })
})
