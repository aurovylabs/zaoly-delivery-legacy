import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MarkerCanvas } from './MarkerCanvas'

describe('MarkerCanvas', () => {
  it('renders empty state', () => {
    render(<MarkerCanvas markers={[]} empty={<p>No preview</p>} />)
    expect(screen.getByText('No preview')).toBeInTheDocument()
  })

  it('activates a marker on click', () => {
    const onActivate = vi.fn()
    render(
      <MarkerCanvas
        media={<div data-testid="paint" />}
        markers={[
          { id: 'm1', x: 0.1, y: 0.1, w: 0.2, h: 0.2, label: 'Rule A', selected: true },
        ]}
        onMarkerActivate={onActivate}
      />
    )
    expect(screen.getByTestId('paint')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Rule A' }))
    expect(onActivate).toHaveBeenCalledWith('m1')
    expect(screen.getByRole('button', { name: 'Rule A' }).className).toContain(
      'ds-marker-canvas__marker--selected'
    )
  })

  it('hides markers when showMarkers is false', () => {
    render(
      <MarkerCanvas
        media={<div />}
        showMarkers={false}
        markers={[{ id: 'm1', x: 0, y: 0, w: 0.1, h: 0.1, label: 'Hidden' }]}
        onMarkerActivate={() => undefined}
      />
    )
    expect(screen.queryByRole('button', { name: 'Hidden' })).toBeNull()
  })
})
