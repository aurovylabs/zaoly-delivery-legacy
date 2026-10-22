import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Waveform } from './Waveform'

describe('Waveform', () => {
  it('renders peak bars', () => {
    render(<Waveform peaks={[0.2, 0.8, 0.4]} />)
    expect(screen.getByRole('img', { name: 'Waveform' })).toBeInTheDocument()
    expect(document.querySelectorAll('.ds-waveform__bar')).toHaveLength(3)
  })
})
