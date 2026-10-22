import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChatDataTable } from './ChatDataTable'

describe('ChatDataTable', () => {
  it('renders column headers and cell values', () => {
    render(
      <ChatDataTable
        columns={['Seite', 'Score']}
        rows={[
          ['/', 94],
          ['/kontakt', 91],
        ]}
      />,
    )
    expect(screen.getByText('Seite')).toBeInTheDocument()
    expect(screen.getByText('/')).toBeInTheDocument()
    expect(screen.getByText('94')).toBeInTheDocument()
  })
})
