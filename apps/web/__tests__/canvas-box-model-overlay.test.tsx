import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { RefObject } from 'react'
import type { SceneNode } from '@zaoly/contracts'
import { CanvasBoxModelOverlay } from '../components/canvas-box-model-overlay'

const stackWithSpacing = {
  id: 'stack-1',
  type: 'Stack',
  props: { padding: '16px', margin: '8px' },
} as SceneNode

const stackBare = {
  id: 'stack-2',
  type: 'Stack',
  props: {},
} as SceneNode

describe('CanvasBoxModelOverlay', () => {
  it('renders padding and margin bands for a single selected spaced node', () => {
    render(
      <CanvasBoxModelOverlay
        selectedNode={stackWithSpacing}
        selectedIds={['stack-1']}
        selectionBounds={{ left: 40, top: 20, width: 240, height: 120 }}
        zoom={1}
      />,
    )

    expect(screen.getByTestId('canvas-box-model-overlay')).toBeInTheDocument()
    expect(screen.getByTestId('canvas-box-model-band-padding-top')).toBeInTheDocument()
    expect(screen.getByTestId('canvas-box-model-band-margin-left')).toBeInTheDocument()
  })

  it('scales band thickness with zoom', () => {
    render(
      <CanvasBoxModelOverlay
        selectedNode={stackWithSpacing}
        selectedIds={['stack-1']}
        selectionBounds={{ left: 0, top: 0, width: 200, height: 100 }}
        zoom={2}
      />,
    )

    const padTop = screen.getByTestId('canvas-box-model-band-padding-top')
    expect(padTop).toHaveStyle({ height: '32px' })
  })

  it('hides when spacing is zero', () => {
    render(
      <CanvasBoxModelOverlay
        selectedNode={stackBare}
        selectedIds={['stack-2']}
        selectionBounds={{ left: 0, top: 0, width: 100, height: 40 }}
        zoom={1}
      />,
    )
    expect(screen.queryByTestId('canvas-box-model-overlay')).toBeNull()
  })

  it('hides on multi-select', () => {
    render(
      <CanvasBoxModelOverlay
        selectedNode={stackWithSpacing}
        selectedIds={['stack-1', 'other']}
        selectionBounds={{ left: 0, top: 0, width: 100, height: 40 }}
        zoom={1}
      />,
    )
    expect(screen.queryByTestId('canvas-box-model-overlay')).toBeNull()
  })

  it('hides without selection bounds', () => {
    render(
      <CanvasBoxModelOverlay
        selectedNode={stackWithSpacing}
        selectedIds={['stack-1']}
        selectionBounds={null}
        zoom={1}
      />,
    )
    expect(screen.queryByTestId('canvas-box-model-overlay')).toBeNull()
  })

  it('falls back to paint-pipeline spacing when live host measure is zero', () => {
    const viewport = document.createElement('div')
    const host = document.createElement('div')
    host.setAttribute('data-node-id', 'stack-1')
    host.setAttribute('data-node-type', 'SiteStack')
    // Empty shell child with no computed pad/margin — mimics broken host-only measure.
    const shell = document.createElement('div')
    shell.className = 'site-stack'
    host.appendChild(shell)
    viewport.appendChild(host)
    document.body.appendChild(viewport)

    vi.spyOn(viewport, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 1000,
      bottom: 1000,
      width: 1000,
      height: 1000,
      x: 0,
      y: 0,
      toJSON: () => {},
    })
    Object.defineProperty(shell, 'offsetWidth', { configurable: true, value: 240 })
    vi.spyOn(shell, 'getBoundingClientRect').mockReturnValue({
      left: 40,
      top: 20,
      right: 280,
      bottom: 140,
      width: 240,
      height: 120,
      x: 40,
      y: 20,
      toJSON: () => {},
    })
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: () => '0px',
    } as CSSStyleDeclaration)

    const viewportRef = { current: viewport } as RefObject<HTMLElement | null>

    render(
      <CanvasBoxModelOverlay
        selectedNode={stackWithSpacing}
        selectedIds={['stack-1']}
        selectionBounds={{ left: 40, top: 20, width: 240, height: 120 }}
        zoom={1}
        viewportRef={viewportRef}
      />,
    )

    expect(screen.getByTestId('canvas-box-model-overlay')).toBeInTheDocument()
    expect(screen.getByTestId('canvas-box-model-band-padding-top')).toBeInTheDocument()
    expect(screen.getByTestId('canvas-box-model-band-margin-left')).toBeInTheDocument()

    document.body.removeChild(viewport)
  })
})
