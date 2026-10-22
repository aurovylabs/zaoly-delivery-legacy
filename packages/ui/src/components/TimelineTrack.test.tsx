import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TimelineTrack } from './TimelineTrack'
import { TimelineClip } from './TimelineClip'

describe('TimelineTrack', () => {
  it('renders label and clips', () => {
    render(
      <TimelineTrack label="V1">
        <TimelineClip label="Clip A" leftPct={10} widthPct={20} />
      </TimelineTrack>,
    )
    expect(screen.getByText('V1')).toBeInTheDocument()
    expect(screen.getByText('Clip A')).toBeInTheDocument()
  })
})
