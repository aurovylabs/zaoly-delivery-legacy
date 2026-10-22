// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TokenBezierPad } from '../components/token-bezier-pad'

const t = (key: string) => key.replace(/^tokens\./, '')

describe('TokenBezierPad', () => {
  it('renders pad, presets, and applies a preset chip', () => {
    const onChange = vi.fn()
    render(
      <TokenBezierPad
        value="cubic-bezier(0.2, 0, 0, 1)"
        onChange={onChange}
        onEnter={() => undefined}
        t={t}
      />,
    )
    expect(screen.getByTestId('token-bezier-pad')).toBeInTheDocument()
    expect(screen.getByTestId('token-bezier-svg')).toBeInTheDocument()
    expect(screen.getByTestId('token-bezier-p1')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /linear/i }))
    expect(onChange).toHaveBeenCalledWith('linear')
  })

  it('updates cubic-bezier when a handle is dragged', () => {
    const onChange = vi.fn()
    render(
      <TokenBezierPad
        value="cubic-bezier(0.2, 0, 0, 1)"
        onChange={onChange}
        onEnter={() => undefined}
        t={t}
      />,
    )
    const svg = screen.getByTestId('token-bezier-svg')
    vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 200,
      bottom: 200,
      width: 200,
      height: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    const p1 = screen.getByTestId('token-bezier-p1')
    fireEvent.pointerDown(p1, { pointerId: 1, clientX: 100, clientY: 100 })
    expect(onChange).toHaveBeenCalled()
    const next = onChange.mock.calls.at(-1)?.[0] as string
    expect(next).toMatch(/^cubic-bezier\(/)
  })
})
