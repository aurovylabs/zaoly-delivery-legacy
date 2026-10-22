import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LabTile, LabTileStrip } from './LabTile'

describe('LabTile', () => {
  it('renders value, label, unit, and meta', () => {
    render(<LabTile label="Pass rate" value="86" unit="%" meta="7d" tone="pos" />)
    expect(screen.getByText('86')).toBeInTheDocument()
    expect(screen.getByText('%')).toBeInTheDocument()
    expect(screen.getByText('Pass rate')).toBeInTheDocument()
    expect(screen.getByText('7d')).toBeInTheDocument()
    expect(document.querySelector('.ds-lab-tile')?.getAttribute('data-tone')).toBe('pos')
  })

  it('marks active tiles', () => {
    const { container } = render(<LabTile label="Device" value="72" active />)
    expect(container.querySelector('.ds-lab-tile')?.getAttribute('data-active')).toBe('true')
  })

  it('LabTileStrip lays out children', () => {
    const { container } = render(
      <LabTileStrip columns={2}>
        <LabTile label="A" value="1" />
        <LabTile label="B" value="2" />
      </LabTileStrip>,
    )
    expect(container.querySelector('.ds-lab-tile-strip')).toBeTruthy()
    expect(container.querySelectorAll('.ds-lab-tile')).toHaveLength(2)
  })
})
