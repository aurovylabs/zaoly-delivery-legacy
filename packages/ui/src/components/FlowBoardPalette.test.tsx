import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FlowBoardPalette } from './FlowBoardPalette'

describe('FlowBoardPalette', () => {
  it('renders FAB when closed and opens via callback', () => {
    const onOpenChange = vi.fn()
    render(
      <FlowBoardPalette open={false} onOpenChange={onOpenChange} fabLabel="Bausteine" />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Bausteine' }))
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it('renders kind children when open', () => {
    render(
      <FlowBoardPalette open onOpenChange={() => undefined}>
        <button type="button">Prompt</button>
      </FlowBoardPalette>
    )
    expect(screen.getByText('Bausteine')).toBeInTheDocument()
    expect(screen.getByText('Prompt')).toBeInTheDocument()
  })
})
