import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HubIndexCard } from './HubIndexCard'

describe('HubIndexCard', () => {
  it('renders title and meta', () => {
    render(<HubIndexCard title="North" meta={<span>draft</span>} />)
    expect(screen.getByRole('heading', { name: 'North' })).toBeInTheDocument()
    expect(screen.getByText('draft')).toBeInTheDocument()
  })

  it('renders as link when href is set', () => {
    render(<HubIndexCard href="/projects/1" title="North" />)
    expect(screen.getByRole('link', { name: /North/i })).toHaveAttribute('href', '/projects/1')
  })

  it('applies create variant', () => {
    const { container } = render(
      <HubIndexCard variant="create" title="New project" meta="Create a Collection" />,
    )
    expect(container.querySelector('.ds-hub-index-card--create')).toBeTruthy()
    expect(container.querySelector('.ds-hub-index-card__panel--create')).toBeTruthy()
  })

  it('renders media slot', () => {
    render(<HubIndexCard title="Landing" media={<img alt="preview" src="/p.png" />} />)
    expect(screen.getByAltText('preview')).toBeInTheDocument()
  })
})
