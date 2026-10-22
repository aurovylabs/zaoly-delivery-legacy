import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FlowBoardStage } from './FlowBoardStage'

describe('FlowBoardStage', () => {
  it('renders viewport and alert', () => {
    render(
      <FlowBoardStage active={false} alert="Heads up" viewport={<div>Canvas</div>} />,
    )
    expect(screen.getByText('Heads up')).toBeInTheDocument()
    expect(screen.getByText('Canvas')).toBeInTheDocument()
  })

  it('wraps overlays so dock children can receive pointer events', () => {
    const { container } = render(
      <FlowBoardStage
        active={false}
        viewport={<div>Canvas</div>}
        overlays={<button type="button">Save</button>}
      />,
    )
    const slot = container.querySelector('.zaoly-flow-board-overlays')
    expect(slot).toBeTruthy()
    expect(slot?.querySelector('button')?.textContent).toBe('Save')
  })
})
