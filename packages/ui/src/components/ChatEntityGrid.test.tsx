import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChatEntityGrid } from './ChatEntityGrid'

describe('ChatEntityGrid', () => {
  it('renders entity titles and badges', () => {
    render(
      <ChatEntityGrid
        items={[
          {
            id: 'p1',
            title: 'Alex',
            subtitle: 'B2B Buyer',
            description: 'Vergleicht Anbieter sorgfältig.',
            badge: '82%',
            tags: ['Persona'],
            accent: 'pink',
          },
        ]}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Alex' })).toBeInTheDocument()
    expect(screen.getByText('82%')).toBeInTheDocument()
    expect(screen.getByText('Persona')).toBeInTheDocument()
  })
})
