import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  RadarChart,
  radarGridRing,
  radarPolygon,
  radarVertex,
} from './RadarChart'

afterEach(() => {
  cleanup()
})

describe('radar geometry', () => {
  it('places first vertex at top when value=1', () => {
    const p = radarVertex(0, 6, 1, 100, 100, 50)
    expect(p.x).toBeCloseTo(100, 5)
    expect(p.y).toBeCloseTo(50, 5)
  })

  it('builds a closed polygon and grid ring', () => {
    const points = [
      { key: 'a', label: 'A', value: 0.5 },
      { key: 'b', label: 'B', value: 1 },
      { key: 'c', label: 'C', value: 0 },
    ]
    const poly = radarPolygon(points, 100, 100, 40)
    expect(poly.split(' ')).toHaveLength(3)
    expect(radarGridRing(3, 1, 100, 100, 40).split(' ')).toHaveLength(3)
  })
})

describe('RadarChart', () => {
  it('clamps values and exposes an a11y list', () => {
    const { container } = render(
      <RadarChart
        ariaLabel="Scores"
        data={[
          { label: 'High', value: 1.4 },
          { label: 'Low', value: -0.2 },
          { label: 'Mid', value: 0.5 },
        ]}
      />,
    )
    expect(screen.getByRole('img', { name: 'Scores' })).toBeInTheDocument()
    expect(screen.getByText(/High: 1/)).toBeInTheDocument()
    expect(screen.getByText(/Low: 0/)).toBeInTheDocument()
    expect(container.querySelector('.briefing-radar-shape')).toBeTruthy()
  })

  it('fires onPointClick from axis hit targets', () => {
    const onPointClick = vi.fn()
    const { container } = render(
      <RadarChart
        title="Craft"
        data={[
          { label: 'Tone', value: 0.8 },
          { label: 'Risks', value: 0.2 },
          { label: 'Color', value: 0.6 },
        ]}
        onPointClick={onPointClick}
      />,
    )
    const hit = container.querySelector('.ds-radar-chart__hit[aria-label="Tone"]')
    expect(hit).toBeTruthy()
    fireEvent.click(hit!)
    expect(onPointClick).toHaveBeenCalledWith({ label: 'Tone', value: 0.8 }, 0)
  })

  it('renders empty a11y note without a shape', () => {
    const { container } = render(<RadarChart data={[]} title="Empty" />)
    expect(screen.getByText('No data')).toBeInTheDocument()
    expect(container.querySelector('.briefing-radar-shape')).toBeNull()
  })
})
