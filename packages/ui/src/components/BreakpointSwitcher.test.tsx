import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BreakpointSwitcher } from './BreakpointSwitcher'

afterEach(() => {
  cleanup()
})

describe('BreakpointSwitcher', () => {
  it('calls onChange with the clicked breakpoint', () => {
    const onChange = vi.fn()
    render(<BreakpointSwitcher value="desktop" onChange={onChange} />)
    fireEvent.click(screen.getByTestId('breakpoint-switcher-mobile'))
    expect(onChange).toHaveBeenCalledWith('mobile')
  })

  it('marks the selected option as aria-checked', () => {
    render(<BreakpointSwitcher value="tablet" onChange={() => undefined} />)
    expect(screen.getByTestId('breakpoint-switcher-tablet')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByTestId('breakpoint-switcher-mobile')).toHaveAttribute('aria-checked', 'false')
  })

  it('renders custom labels', () => {
    render(
      <BreakpointSwitcher
        value="desktop"
        onChange={() => undefined}
        labels={{ mobile: 'SM', tablet: 'MD', desktop: 'LG' }}
      />,
    )
    expect(screen.getByText('SM')).toBeInTheDocument()
    expect(screen.getByText('MD')).toBeInTheDocument()
    expect(screen.getByText('LG')).toBeInTheDocument()
  })

  it('exposes radiogroup accessibility', () => {
    render(<BreakpointSwitcher value="desktop" onChange={() => undefined} />)
    expect(screen.getByRole('radiogroup', { name: 'Breakpoint' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
  })

  it('renders print when options include print', () => {
    const onChange = vi.fn()
    render(
      <BreakpointSwitcher
        value="desktop"
        onChange={onChange}
        options={['mobile', 'tablet', 'desktop', 'print']}
        labels={{ print: 'Print' }}
      />,
    )
    expect(screen.getAllByRole('radio')).toHaveLength(4)
    fireEvent.click(screen.getByTestId('breakpoint-switcher-print'))
    expect(onChange).toHaveBeenCalledWith('print')
  })

  it('icon variant uses aria-labels instead of visible text', () => {
    render(
      <BreakpointSwitcher
        value="desktop"
        onChange={() => undefined}
        variant="icon"
        options={['mobile', 'tablet', 'desktop', 'print']}
        labels={{ mobile: 'Handy', tablet: 'Pad', desktop: 'Screen', print: 'Papier' }}
      />,
    )
    expect(screen.getByTestId('breakpoint-switcher')).toHaveClass('ds-breakpoint-switcher--icon')
    expect(screen.getByRole('radio', { name: 'Handy' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Pad' })).toBeInTheDocument()
    expect(screen.queryByText('Handy')).toBeNull()
  })
})
