import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { BreakpointEditor } from './BreakpointEditor'

describe('BreakpointEditor', () => {
  it('applies digital preset', () => {
    const onChange = vi.fn()
    render(
      <BreakpointEditor value="480px" onChange={onChange} data-testid="bp" />,
    )
    fireEvent.click(screen.getByTestId('bp-preset-md'))
    expect(onChange).toHaveBeenCalledWith('768px')
  })

  it('renders minWidth field', () => {
    render(<BreakpointEditor value="768px" onChange={() => {}} data-testid="bp" />)
    expect(screen.getByTestId('bp-min-width-input')).toHaveValue('768px')
  })
})
