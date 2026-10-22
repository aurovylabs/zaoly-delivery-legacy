import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TimelineRuler } from './TimelineRuler'

describe('TimelineRuler', () => {
  it('renders marks', () => {
    render(<TimelineRuler marks={[{ id: 'a', label: '00:00', offsetPct: 0 }]} />)
    expect(screen.getByText('00:00')).toBeInTheDocument()
  })
})
