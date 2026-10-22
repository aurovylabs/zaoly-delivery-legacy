import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChatAlertBlock } from './ChatAlertBlock'

describe('ChatAlertBlock', () => {
  it('renders title and message', () => {
    render(<ChatAlertBlock title="Sync" message="Mirror pending" tone="warning" />)
    expect(screen.getByRole('heading', { name: 'Sync' })).toBeInTheDocument()
    expect(screen.getByText('Mirror pending')).toBeInTheDocument()
  })
})
