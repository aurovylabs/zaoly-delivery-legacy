import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChatMomentList } from './ChatMomentList'

describe('ChatMomentList', () => {
  it('renders kind chips and labels', () => {
    const { container } = render(
      <ChatMomentList
        items={[
          { id: 'm1', kind: 'pain', label: 'Zu viele Formularfelder' },
          { id: 'm2', kind: 'opportunity', label: 'Vergleichstabelle anbieten' },
        ]}
      />,
    )
    expect(screen.getByText('Pain')).toBeInTheDocument()
    expect(screen.getByText('Zu viele Formularfelder')).toBeInTheDocument()
    expect(screen.getByText('Opportunity')).toBeInTheDocument()
    expect(container.querySelector('[data-kind="pain"]')).toBeTruthy()
  })
})
