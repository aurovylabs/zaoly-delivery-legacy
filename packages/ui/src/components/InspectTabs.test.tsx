import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { InspectTabs } from './InspectTabs'

afterEach(() => {
  cleanup()
})

describe('InspectTabs', () => {
  it('calls onChange with the clicked tab id', () => {
    const onChange = vi.fn()
    render(<InspectTabs value="design" onChange={onChange} />)
    fireEvent.click(screen.getByTestId('inspect-tab-css'))
    expect(onChange).toHaveBeenCalledWith('css')
  })

  it('uses design/css ids by default', () => {
    render(<InspectTabs value="design" onChange={() => undefined} />)
    expect(screen.getByTestId('inspect-tab-design')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('inspect-tab-css')).toHaveAttribute('aria-selected', 'false')
  })

  it('renders custom Design/CSS labels', () => {
    render(
      <InspectTabs
        value="design"
        onChange={() => undefined}
        designLabel="Tokens"
        cssLabel="Raw"
      />,
    )
    expect(screen.getByText('Tokens')).toBeInTheDocument()
    expect(screen.getByText('Raw')).toBeInTheDocument()
  })

  it('supports custom items', () => {
    const onChange = vi.fn()
    render(
      <InspectTabs
        value="a"
        onChange={onChange}
        items={[
          { id: 'a', label: 'Alpha' },
          { id: 'b', label: 'Beta' },
        ]}
      />,
    )
    fireEvent.click(screen.getByTestId('inspect-tab-b'))
    expect(onChange).toHaveBeenCalledWith('b')
  })
})
