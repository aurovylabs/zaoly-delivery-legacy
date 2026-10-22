import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CollectionHubCard, CollectionHubMetric } from './CollectionHubCard'

describe('CollectionHubCard', () => {
  it('renders title, kicker, badge, stats, and actions', () => {
    render(
      <CollectionHubCard
        kicker="acme.test"
        badge="In sync"
        badgeStatus="in_sync"
        title="Acme"
        stats={<CollectionHubMetric icon={<span>i</span>} value="4" label="Scans" />}
        actions={<button type="button">Open</button>}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Acme' })).toBeInTheDocument()
    expect(screen.getByText('acme.test')).toBeInTheDocument()
    expect(screen.getByText('In sync')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument()
  })

  it('applies create variant as a button', () => {
    const { container } = render(
      <CollectionHubCard variant="create" title="New project" hint="Create a Collection" />,
    )
    expect(container.querySelector('.ds-collection-hub-card--create')).toBeTruthy()
    expect(screen.getByRole('button', { name: /New project/i })).toBeInTheDocument()
  })

  it('marks metric linked state', () => {
    const { container } = render(
      <CollectionHubMetric icon={<span>•</span>} value="—" label="Last" linked={false} />,
    )
    expect(container.querySelector('[data-linked="false"]')).toBeTruthy()
  })
})
