import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { CanvasViewport } from './CanvasViewport'

afterEach(() => {
  cleanup()
})

describe('CanvasViewport', () => {
  it('renders children on the artboard', () => {
    render(<CanvasViewport>CanvasViewport</CanvasViewport>)
    expect(screen.getByText('CanvasViewport')).toBeInTheDocument()
  })

  it('applies zoom and pan transform', () => {
    render(
      <CanvasViewport zoom={0.5} panX={12} panY={-4}>
        Scene
      </CanvasViewport>,
    )
    const artboard = screen.getByTestId('canvas-artboard')
    expect(artboard.style.transform).toBe('translate(12px, -4px) scale(0.5)')
  })
})
