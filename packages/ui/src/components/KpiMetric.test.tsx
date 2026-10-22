import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { KpiMetric } from './KpiMetric'

describe('KpiMetric', () => {
  it('renders label, value, unit, and meta', () => {
    render(<KpiMetric label="Hired" value="42" unit="ppl" meta="sticky region=EU" />)
    expect(screen.getByText('Hired')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('ppl')).toBeInTheDocument()
    expect(screen.getByText('sticky region=EU')).toBeInTheDocument()
  })

  it('applies hero density class', () => {
    const { container } = render(<KpiMetric label="Apps" value="1.2k" density="hero" />)
    expect(container.querySelector('.ds-kpi-metric--hero')).toBeTruthy()
    expect(container.querySelector('[data-density="hero"]')).toBeTruthy()
  })
})
