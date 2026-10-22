import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChatQuoteList } from './ChatQuoteList'

describe('ChatQuoteList', () => {
  it('renders quote and attribution', () => {
    render(
      <ChatQuoteList
        items={[
          {
            quote: 'Ich brauche Citations, sonst vertraue ich dem Anbieter nicht.',
            attribution: 'Alex · Consideration',
            context: 'Friction: fehlende Quellen',
            tone: 'warning',
          },
        ]}
      />,
    )
    expect(
      screen.getByText(/Ich brauche Citations/),
    ).toBeInTheDocument()
    expect(screen.getByText('Alex · Consideration')).toBeInTheDocument()
    expect(screen.getByText(/fehlende Quellen/)).toBeInTheDocument()
  })
})
