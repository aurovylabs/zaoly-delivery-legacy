import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TimelineClip } from './TimelineClip'

describe('TimelineClip', () => {
  it('positions with percent styles', () => {
    const { container } = render(<TimelineClip label="Shot" leftPct={25} widthPct={10} active />)
    const clip = container.querySelector('.ds-timeline-clip') as HTMLElement
    expect(clip.style.left).toBe('25%')
    expect(clip.style.width).toBe('10%')
    expect(screen.getByText('Shot')).toBeInTheDocument()
  })
})
