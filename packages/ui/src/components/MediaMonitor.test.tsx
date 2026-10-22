import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MediaMonitor } from './MediaMonitor'

describe('MediaMonitor', () => {
  it('renders label and media slot', () => {
    render(<MediaMonitor label="Program" media={<div>Player</div>} />)
    expect(screen.getByText('Program')).toBeInTheDocument()
    expect(screen.getByText('Player')).toBeInTheDocument()
  })
})
