import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SeriesChart, collectSeriesLabels } from './SeriesChart'

describe('collectSeriesLabels', () => {
  it('unions labels in first-seen order', () => {
    expect(
      collectSeriesLabels([
        {
          id: 'a',
          label: 'A',
          points: [
            { label: 'W1', value: 1 },
            { label: 'W2', value: 2 },
          ],
        },
        {
          id: 'b',
          label: 'B',
          points: [
            { label: 'W2', value: 3 },
            { label: 'W3', value: 4 },
          ],
        },
      ]),
    ).toEqual(['W1', 'W2', 'W3'])
  })
})

describe('SeriesChart', () => {
  it('renders title and legend', () => {
    render(
      <SeriesChart
        title="Ranks"
        series={[
          {
            id: 't',
            label: 'target.com',
            points: [
              { label: 'A', value: 2 },
              { label: 'B', value: 1 },
            ],
          },
        ]}
      />,
    )
    expect(screen.getByRole('img', { name: 'Ranks' })).toBeInTheDocument()
    expect(screen.getByText('target.com')).toBeInTheDocument()
    expect(document.querySelectorAll('.ds-series-chart__line').length).toBe(1)
    expect(document.querySelectorAll('.ds-series-chart__dot').length).toBe(2)
  })

  it('breaks the path on null gaps', () => {
    const { container } = render(
      <SeriesChart
        series={[
          {
            id: 't',
            label: 'target.com',
            points: [
              { label: 'A', value: 2 },
              { label: 'B', value: null },
              { label: 'C', value: 1 },
            ],
          },
        ]}
      />,
    )
    const d = container.querySelector('.ds-series-chart__line')?.getAttribute('d') ?? ''
    expect(d.startsWith('M ')).toBe(true)
    expect(d.includes(' M ')).toBe(true)
    // Two finite points → two moves; null breaks the path between them.
    expect((d.match(/\bM\b/g) ?? []).length).toBe(2)
  })

  it('marks invertY on the root', () => {
    const { container } = render(
      <SeriesChart
        invertY
        series={[
          {
            id: 't',
            label: 'target.com',
            points: [
              { label: 'A', value: 3 },
              { label: 'B', value: 1 },
            ],
          },
        ]}
      />,
    )
    expect(container.querySelector('.ds-series-chart')?.getAttribute('data-invert-y')).toBe('true')
  })
})
