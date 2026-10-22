import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Accordion } from './Accordion'

describe('Accordion', () => {
  it('toggles a single open panel and uses accent chevron class', () => {
    const onChange = vi.fn()
    const { container, rerender } = render(
      <Accordion
        value={null}
        onChange={onChange}
        items={[
          { id: 'a', title: 'Company', preview: 'Preview A', panel: <p>Body A</p> },
          { id: 'b', title: 'Market', preview: 'Preview B', panel: <p>Body B</p> },
        ]}
      />,
    )

    expect(container.querySelector('.ds-accordion-chevron')).toBeTruthy()
    expect(screen.getByText('Preview A')).toBeInTheDocument()
    expect(screen.queryByText('Body A')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /Company/i }))
    expect(onChange).toHaveBeenCalledWith('a')

    rerender(
      <Accordion
        value="a"
        onChange={onChange}
        items={[
          { id: 'a', title: 'Company', preview: 'Preview A', panel: <p>Body A</p> },
          { id: 'b', title: 'Market', preview: 'Preview B', panel: <p>Body B</p> },
        ]}
      />,
    )
    expect(container.querySelector('.ds-accordion-item.is-open')).toBeTruthy()
    expect(screen.getByText('Body A')).toBeInTheDocument()
    expect(screen.queryByText('Preview A')).toBeNull()
  })
})
