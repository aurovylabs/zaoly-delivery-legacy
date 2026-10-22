import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Meter, MeterList } from './Meter'

describe('Meter', () => {
  it('renders label, value, and slider', () => {
    const onChange = vi.fn()
    render(
      <MeterList aria-label="Dims">
        <Meter
          label="Risk aversion"
          valueLabel="50%"
          value={50}
          onChange={onChange}
        />
      </MeterList>,
    )
    expect(screen.getByText('Risk aversion')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    const input = screen.getByLabelText('Risk aversion')
    fireEvent.change(input, { target: { value: '60' } })
    expect(onChange).toHaveBeenCalledWith(60)
  })
})
