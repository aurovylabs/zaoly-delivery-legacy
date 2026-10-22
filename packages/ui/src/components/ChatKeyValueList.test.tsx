import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChatKeyValueList } from './ChatKeyValueList'

describe('ChatKeyValueList', () => {
  it('renders labels and values', () => {
    render(
      <ChatKeyValueList
        items={[
          { label: 'Projekt', value: 'Demo Website' },
          { label: 'Domain', value: 'example.com' },
        ]}
      />,
    )
    expect(screen.getByText('Projekt')).toBeInTheDocument()
    expect(screen.getByText('Demo Website')).toBeInTheDocument()
    expect(screen.getByText('Domain')).toBeInTheDocument()
    expect(screen.getByText('example.com')).toBeInTheDocument()
  })

  it('renders optional leading icons', () => {
    render(
      <ChatKeyValueList
        items={[{ label: 'Ort', value: 'Studio', icon: <span data-testid="kv-icon">📍</span> }]}
      />,
    )
    expect(screen.getByTestId('kv-icon')).toBeInTheDocument()
    expect(screen.getByText('Ort')).toBeInTheDocument()
  })
})
