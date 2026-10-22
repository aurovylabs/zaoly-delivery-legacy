import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EventFooter } from './EventFooter'

describe('EventFooter', () => {
  it('renders summary, meta, and actions', () => {
    const { container } = render(
      <EventFooter
        summary="Done."
        actions={<button type="button">Open</button>}
      >
        <p className="ds-event-footer-meta">Policy: detail high</p>
      </EventFooter>,
    )
    expect(container.firstElementChild).toHaveClass('ds-event-footer')
    expect(screen.getByText('Done.')).toBeInTheDocument()
    expect(screen.getByText('Policy: detail high')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument()
  })
})
