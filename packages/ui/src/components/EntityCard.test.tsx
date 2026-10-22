import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EntityCard } from './EntityCard'

describe('EntityCard', () => {
  it('exposes title and meta', () => {
    render(
      <EntityCard meta="Color" title="color.brand.primary">
        <span>swatch</span>
      </EntityCard>
    )
    expect(screen.getByText('color.brand.primary')).toBeInTheDocument()
    expect(screen.getByText('Color')).toBeInTheDocument()
    expect(screen.getByText('swatch')).toBeInTheDocument()
  })

  it('renders tall size class', () => {
    const { container } = render(<EntityCard title="x" size="tall" />)
    expect(container.querySelector('.ds-entity-card--tall')).toBeTruthy()
  })
})
