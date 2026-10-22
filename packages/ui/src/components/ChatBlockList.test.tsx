import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChatBlockList } from './ChatBlockList'

describe('ChatBlockList', () => {
  it('renders item titles, prose, and badges', () => {
    render(
      <ChatBlockList
        items={[
          {
            title: 'GEO Gesamt-Score steigern',
            description: 'Unter Schnitt.',
            badge: 'Warnung',
            tone: 'warning',
          },
        ]}
      />,
    )
    expect(screen.getByRole('heading', { name: 'GEO Gesamt-Score steigern' })).toBeInTheDocument()
    expect(screen.getByText('Unter Schnitt.')).toBeInTheDocument()
    expect(screen.getByText('Warnung')).toBeInTheDocument()
  })
})
