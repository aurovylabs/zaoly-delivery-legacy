import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChatBlockPanel } from './ChatBlockPanel'

describe('ChatBlockPanel', () => {
  it('renders eyebrow, compact title, and body', () => {
    render(
      <ChatBlockPanel title="GEO-Empfehlungen" eyebrow="findings">
        <span>Body slot</span>
      </ChatBlockPanel>,
    )
    expect(screen.getByText('findings')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'GEO-Empfehlungen' })).toBeInTheDocument()
    expect(screen.getByText('Body slot')).toBeInTheDocument()
  })
})
