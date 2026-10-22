import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InspectDock } from './InspectDock'

describe('InspectDock', () => {
  it('renders landmark chrome', () => {
    render(
      <InspectDock aria-label="UX journey inspect">
        <span>child</span>
      </InspectDock>,
    )
    const dock = screen.getByLabelText('UX journey inspect')
    expect(dock).toHaveClass('ds-inspect-dock')
    expect(screen.getByText('child')).toBeInTheDocument()
  })
})
