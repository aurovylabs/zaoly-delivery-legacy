import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Stack } from './Stack'

describe('Stack', () => {
  it('renders children', () => {
    render(<Stack>Stack</Stack>)
    expect(screen.getByText('Stack')).toBeInTheDocument()
  })

  it('applies clip-path from clipInset', () => {
    const { container } = render(
      <Stack clipInset={{ bottomLeft: { y: '12%' } }}>Slant</Stack>,
    )
    const el = container.firstElementChild as HTMLElement
    expect(el.style.clipPath).toBe('polygon(0 0, 100% 0, 100% 100%, 0 calc(100% - 12%))')
  })
})
