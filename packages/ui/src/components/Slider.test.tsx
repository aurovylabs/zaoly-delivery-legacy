import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Slider } from './Slider'

describe('Slider', () => {
  it('fires onChange and onCommit', () => {
    const onChange = vi.fn()
    const onCommit = vi.fn()
    render(
      <Slider value={40} onChange={onChange} onCommit={onCommit} aria-label="Score" />,
    )
    const input = screen.getByLabelText('Score')
    expect(input).toHaveClass('ds-slider')
    fireEvent.change(input, { target: { value: '70' } })
    expect(onChange).toHaveBeenCalledWith(70)
    fireEvent.mouseUp(input, { target: { value: '70' } })
    expect(onCommit).toHaveBeenCalledWith(70)
  })

  it('sets fill css var from value', () => {
    render(<Slider value={25} min={0} max={100} aria-label="Fill" />)
    expect(screen.getByLabelText('Fill')).toHaveStyle({ '--ds-slider-pct': '25%' })
  })
})
