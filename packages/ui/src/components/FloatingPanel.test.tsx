import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FloatingPanel } from './FloatingPanel'

describe('FloatingPanel', () => {
  it('renders children with magazine solid defaults', () => {
    render(
      <FloatingPanel storageKey="test.fp" title="Tools">
        Panel body
      </FloatingPanel>,
    )
    expect(screen.getByText('Panel body')).toBeInTheDocument()
    expect(screen.getByText('Tools')).toBeInTheDocument()
    expect(document.querySelector('[data-surface="solid"]')).toBeTruthy()
    expect(document.querySelector('[data-variant="panel"]')).toBeTruthy()
    expect(document.querySelector('.ds-floating-panel--panel')).toBeTruthy()
  })

  it('applies toolbar variant and glass surface', () => {
    const { container } = render(
      <FloatingPanel
        storageKey="test.fp.toolbar"
        variant="toolbar"
        surface="glass"
        ariaLabel="Board toolbar"
      >
        Actions
      </FloatingPanel>,
    )
    expect(container.querySelector('.ds-floating-panel--toolbar')).toBeTruthy()
    expect(container.querySelector('.ds-floating-panel--glass')).toBeTruthy()
    expect(container.querySelector('[data-variant="toolbar"]')).toBeTruthy()
    expect(container.querySelector('[data-surface="glass"]')).toBeTruthy()
    expect(screen.getByLabelText('Board toolbar')).toBeInTheDocument()
  })
})
