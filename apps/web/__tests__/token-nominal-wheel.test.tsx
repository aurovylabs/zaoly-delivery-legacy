// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TokenNominalWheel } from '../components/token-nominal-wheel'
import { remLadder } from '../lib/tokens/nominal-sliders'

describe('TokenNominalWheel', () => {
  it('moves the scale under a fixed notch via pointer drag', () => {
    const onChange = vi.fn()
    render(
      <TokenNominalWheel
        label="Digital value"
        value="1rem"
        ladder={remLadder()}
        onChange={onChange}
        testId="wheel"
      />,
    )
    const wheel = screen.getByTestId('wheel')
    expect(wheel.querySelector('.zaoly-token-studio__wheel-notch')).toBeTruthy()
    fireEvent.pointerDown(wheel, { pointerId: 1, clientX: 200 })
    // Drag left by two steps → higher values (1 → 1.25 → 1.5)
    fireEvent.pointerMove(wheel, { pointerId: 1, clientX: 200 - 36 * 2 })
    fireEvent.pointerUp(wheel, { pointerId: 1, clientX: 200 - 36 * 2 })
    expect(onChange).toHaveBeenCalledWith('1.5rem')
  })

  it('extends past the catalog end instead of wrapping to 0', () => {
    const onChange = vi.fn()
    render(
      <TokenNominalWheel
        label="Digital value"
        value="8rem"
        ladder={remLadder()}
        onChange={onChange}
        testId="wheel"
      />,
    )
    const wheel = screen.getByTestId('wheel')
    fireEvent.keyDown(wheel, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('10rem')
    expect(onChange).not.toHaveBeenCalledWith('0rem')
  })
})
