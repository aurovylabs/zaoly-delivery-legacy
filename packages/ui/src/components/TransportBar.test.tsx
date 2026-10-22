import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TransportBar } from './TransportBar'
import { ToolButton } from './ToolButton'
import { Timecode } from './Timecode'

describe('TransportBar', () => {
  it('composes controls and timecode', () => {
    render(
      <TransportBar
        controls={<ToolButton label="Play">▶</ToolButton>}
        timecode={<Timecode value="00:00:01:00" />}
      />,
    )
    expect(screen.getByRole('group', { name: 'Transport' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
    expect(screen.getByText('00:00:01:00')).toBeInTheDocument()
  })
})
