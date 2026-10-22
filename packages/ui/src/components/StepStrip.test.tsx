import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StepStrip, StepStripItem } from './StepStrip'

describe('StepStrip', () => {
  it('activates items and exposes scroll targets', () => {
    const onActivate = vi.fn()
    const { container } = render(
      <StepStrip scrollToIndex={1}>
        <StepStripItem index={0} label="Step 01" onActivate={onActivate}>
          A
        </StepStripItem>
        <StepStripItem index={1} label="Step 02" selected>
          B
        </StepStripItem>
      </StepStrip>,
    )
    expect(container.querySelector('[data-step-index="1"]')).toHaveClass(
      'ds-step-strip-item--selected',
    )
    fireEvent.click(screen.getByLabelText('Step 01'))
    expect(onActivate).toHaveBeenCalled()
  })

  it('applies vertical orientation class', () => {
    const { container } = render(
      <StepStrip orientation="vertical">
        <StepStripItem index={0} label="Step 01">
          A
        </StepStripItem>
      </StepStrip>,
    )
    expect(container.querySelector('.ds-step-strip')).toHaveClass('ds-step-strip--vertical')
    expect(container.querySelector('.ds-step-strip-scroller')).toHaveAttribute('data-orientation', 'vertical')
  })
})
