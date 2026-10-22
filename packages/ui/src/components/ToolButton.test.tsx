import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ToolButton } from './ToolButton'

describe('ToolButton', () => {
  it('renders accessible icon button', () => {
    render(<ToolButton label="Play">▶</ToolButton>)
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
  })

  it('marks active state', () => {
    render(
      <ToolButton label="Mark" active>
        I
      </ToolButton>,
    )
    expect(screen.getByRole('button', { name: 'Mark' })).toHaveAttribute('data-active', 'true')
  })
})
