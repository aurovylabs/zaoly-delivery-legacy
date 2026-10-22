import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Gauge } from './Gauge'

describe('Gauge', () => {
  it('exposes meter semantics and clamps', () => {
    render(<Gauge value={150} min={0} max={100} label="Fill" unit="%" />)
    const meter = screen.getByRole('meter', { name: 'Fill' })
    expect(meter.getAttribute('aria-valuenow')).toBe('100')
    expect(meter.getAttribute('aria-valuemin')).toBe('0')
    expect(meter.getAttribute('aria-valuemax')).toBe('100')
    expect(screen.getByText('%')).toBeInTheDocument()
  })
})
