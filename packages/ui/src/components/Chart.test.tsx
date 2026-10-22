import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Chart, CHART_VARIANTS, formatChartValue, isChartVariant } from './Chart'

describe('formatChartValue', () => {
  it('keeps integers clean and trims long floats', () => {
    expect(formatChartValue(72)).toBe('72')
    expect(formatChartValue(52.936614583333345)).toBe('52.9')
    expect(formatChartValue(0.125)).toBe('0.13')
  })
})

describe('isChartVariant', () => {
  it('accepts the curated family', () => {
    expect(CHART_VARIANTS).toHaveLength(8)
    expect(isChartVariant('pie')).toBe(true)
    expect(isChartVariant('waterfall')).toBe(false)
  })
})

describe('Chart', () => {
  it('renders visible legend labels and value ticks', () => {
    render(
      <Chart
        title="Apps"
        data={[
          { label: 'Hired', value: 2 },
          { label: 'Rejected', value: 5 },
        ]}
      />,
    )
    expect(screen.getByRole('img', { name: 'Apps' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Category' })).toBeInTheDocument()
    expect(screen.getAllByText('Hired').length).toBeGreaterThanOrEqual(1)
    expect(document.querySelectorAll('.ds-chart__bar')).toHaveLength(2)
    expect(document.querySelectorAll('.ds-chart__tick')).toHaveLength(2)
  })

  it('renders pie slices', () => {
    const { container } = render(
      <Chart
        variant="pie"
        data={[
          { label: 'A', value: 2 },
          { label: 'B', value: 1 },
        ]}
      />,
    )
    expect(container.querySelectorAll('.ds-chart__slice')).toHaveLength(2)
  })

  it('renders funnel stages', () => {
    const { container } = render(
      <Chart
        variant="funnel"
        data={[
          { label: 'Applied', value: 10 },
          { label: 'Hired', value: 2 },
        ]}
      />,
    )
    expect(container.querySelectorAll('.ds-chart__funnel')).toHaveLength(2)
  })

  it('renders area fill', () => {
    const { container } = render(
      <Chart
        variant="area"
        data={[
          { label: 'A', value: 1 },
          { label: 'B', value: 3 },
        ]}
      />,
    )
    expect(container.querySelector('.ds-chart__area')).toBeTruthy()
    expect(container.querySelector('.ds-chart__line')).toBeTruthy()
  })

  it('invokes onPointClick from bar group', () => {
    const onPointClick = vi.fn()
    const { container } = render(
      <Chart
        data={[
          { label: 'Hired', value: 2 },
          { label: 'Rejected', value: 1 },
        ]}
        onPointClick={onPointClick}
      />,
    )
    fireEvent.click(container.querySelector('.ds-chart__point')!)
    expect(onPointClick).toHaveBeenCalledWith({ label: 'Hired', value: 2 }, 0)
  })

  it('links legend hover to chart mark highlight', () => {
    const { container } = render(
      <Chart
        data={[
          { label: 'Hired', value: 2 },
          { label: 'Rejected', value: 1 },
        ]}
      />,
    )
    const rows = container.querySelectorAll('.ds-chart__row')
    expect(rows).toHaveLength(2)
    fireEvent.mouseEnter(rows[1]!)
    expect(container.querySelector('.ds-chart')?.getAttribute('data-hover-index')).toBe('1')
    expect(container.querySelectorAll('.ds-chart__point--active')).toHaveLength(1)
    expect(container.querySelectorAll('.ds-chart__point--dim')).toHaveLength(1)
    expect(rows[1]?.classList.contains('ds-chart__row--active')).toBe(true)
    fireEvent.mouseLeave(rows[1]!)
    expect(container.querySelector('.ds-chart')?.getAttribute('data-hover-index')).toBeNull()
  })

  it('links chart mark hover to legend row', () => {
    const { container } = render(
      <Chart
        data={[
          { label: 'Hired', value: 2 },
          { label: 'Rejected', value: 1 },
        ]}
      />,
    )
    const points = container.querySelectorAll('.ds-chart__point')
    fireEvent.mouseEnter(points[0]!)
    expect(container.querySelector('.ds-chart__row--active')?.textContent).toContain('Hired')
  })
})
