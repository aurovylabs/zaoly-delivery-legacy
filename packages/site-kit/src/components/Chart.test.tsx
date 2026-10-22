import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  Chart,
  parseChartSeriesText,
  formatChartSeriesText,
  normalizeChartStyle,
} from './Chart'

const SAMPLE = 'A: 42\nB: 28\nC: 65'

describe('SiteChart atom', () => {
  it('parses and formats series text', () => {
    const points = parseChartSeriesText(SAMPLE)
    expect(points).toEqual([
      { label: 'A', value: 42 },
      { label: 'B', value: 28 },
      { label: 'C', value: 65 },
    ])
    expect(formatChartSeriesText(points)).toBe(SAMPLE)
  })

  it('paints each chart type distinctly', () => {
    const cases = [
      { variant: 'bar', expect: 'rect' },
      { variant: 'bar_horizontal', expect: 'rect' },
      { variant: 'line', expect: 'polyline' },
      { variant: 'area', expect: 'polygon' },
      { variant: 'scatter', expect: 'circle' },
      { variant: 'pie', expect: 'path' },
      { variant: 'donut', expect: 'path' },
      { variant: 'funnel', expect: 'rect' },
    ] as const

    for (const c of cases) {
      const { container, unmount } = render(
        <Chart chartType={c.variant} data={SAMPLE} title={`${c.variant} chart`} />,
      )
      const root = container.querySelector('.site-chart') as HTMLElement
      expect(root.getAttribute('data-variant')).toBe(c.variant)
      expect(root.className).toContain(`site-chart--${c.variant}`)
      expect(container.querySelector(c.expect)).toBeTruthy()
      unmount()
    }
  })

  it('applies chartStyle marks to paint attributes', () => {
    const bar = render(
      <Chart chartType="bar" data={SAMPLE} chartStyle={{ barGap: 16 }} />,
    )
    expect(bar.container.querySelector('.site-chart')?.getAttribute('data-bar-gap')).toBe('16')
    bar.unmount()

    const line = render(
      <Chart
        chartType="line"
        data={SAMPLE}
        chartStyle={{ strokeWidth: 4, pointRadius: 6 }}
      />,
    )
    const lineRoot = line.container.querySelector('.site-chart')
    expect(lineRoot?.getAttribute('data-stroke-width')).toBe('4')
    expect(lineRoot?.getAttribute('data-point-radius')).toBe('6')
    expect(line.container.querySelector('polyline')?.getAttribute('stroke-width')).toBe('4')
    expect(line.container.querySelector('circle')?.getAttribute('r')).toBe('6')
    line.unmount()

    const donut = render(
      <Chart chartType="donut" data={SAMPLE} chartStyle={{ donutHole: 0.4 }} />,
    )
    expect(donut.container.querySelector('.site-chart')?.getAttribute('data-donut-hole')).toBe(
      '0.4',
    )
    expect(donut.container.querySelector('path')).toBeTruthy()
    donut.unmount()
  })

  it('normalizes chartStyle clamps', () => {
    expect(normalizeChartStyle({ barGap: 999, donutHole: 2, strokeWidth: 0 })).toEqual({
      barGap: 48,
      donutHole: 0.85,
      strokeWidth: 0.5,
    })
  })

  it('applies per-point colors to fills', () => {
    const { container, unmount } = render(
      <Chart
        chartType="bar"
        data={[
          { label: 'A', value: 10, color: '#ff0000' },
          { label: 'B', value: 20, color: '#00ff00' },
        ]}
      />,
    )
    const rects = container.querySelectorAll('rect')
    expect(rects[0]?.getAttribute('fill')).toBe('#ff0000')
    expect(rects[1]?.getAttribute('fill')).toBe('#00ff00')
    unmount()
  })

  it('uses strokeColor / first point color for line stroke', () => {
    const line = render(
      <Chart
        chartType="line"
        data={[{ label: 'A', value: 10, color: '#112233' }]}
      />,
    )
    expect(line.container.querySelector('polyline')?.getAttribute('stroke')).toBe('#112233')
    line.unmount()

    const styled = render(
      <Chart
        chartType="line"
        data={SAMPLE}
        chartStyle={{ strokeColor: '#abcdef' }}
      />,
    )
    expect(styled.container.querySelector('polyline')?.getAttribute('stroke')).toBe('#abcdef')
    styled.unmount()
  })

  it('shows empty state without series', () => {
    const { container } = render(<Chart variant="pie" data="" />)
    expect(container.querySelector('.site-chart__empty')?.textContent).toBe('No data')
  })
})
