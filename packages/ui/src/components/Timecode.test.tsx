import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Timecode } from './Timecode'

describe('Timecode', () => {
  it('renders value and secondary', () => {
    render(<Timecode value="00:01:02:03" secondary="00:10:00:00" />)
    expect(screen.getByText('00:01:02:03')).toBeInTheDocument()
    expect(screen.getByText('00:10:00:00')).toBeInTheDocument()
  })
})
