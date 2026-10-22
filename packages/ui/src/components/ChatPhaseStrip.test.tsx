import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChatPhaseStrip } from './ChatPhaseStrip'

describe('ChatPhaseStrip', () => {
  it('renders phase labels and active state', () => {
    const { container } = render(
      <ChatPhaseStrip
        phases={[
          { id: 'p1', label: 'Awareness', summary: 'Erste Berührung', status: 'done' },
          { id: 'p2', label: 'Consideration', active: true, status: 'current' },
          { id: 'p3', label: 'Decision', status: 'upcoming' },
        ]}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Awareness' })).toBeInTheDocument()
    expect(screen.getByText('Erste Berührung')).toBeInTheDocument()
    expect(container.querySelector('[data-active="true"]')).toBeTruthy()
    expect(container.querySelector('[data-status="current"]')).toBeTruthy()
  })
})
