import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CanvasDistanceGuides } from '../components/canvas-distance-guides'

describe('CanvasDistanceGuides (Smart Alt-Hover Guides)', () => {
  it('does not render when Alt is not pressed', () => {
    const viewportRef = { current: document.createElement('div') }
    render(
      <CanvasDistanceGuides
        viewportRef={viewportRef}
        selectedId="node-a"
        selectedBounds={{ left: 100, top: 100, width: 200, height: 100 }}
        zoom={1}
      />,
    )

    expect(screen.queryByTestId('canvas-distance-guides')).toBeNull()
  })

  it('renders target highlight, distance lines, and pixel pills when Alt is held and hovering another node', () => {
    const viewport = document.createElement('div')
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

    const targetNode = document.createElement('div')
    targetNode.setAttribute('data-node-id', 'node-b')
    viewport.appendChild(targetNode)
    document.body.appendChild(viewport)

    vi.spyOn(targetNode, 'getBoundingClientRect').mockReturnValue({
      left: 400,
      top: 100,
      right: 600,
      bottom: 200,
      width: 200,
      height: 100,
      x: 400,
      y: 100,
      toJSON: () => {},
    })

    // Mock document.elementFromPoint
    document.elementFromPoint = vi.fn((x: number, y: number) => {
      if (x >= 400 && x <= 600) return targetNode
      return viewport
    })

    const viewportRef = { current: viewport }
    render(
      <CanvasDistanceGuides
        viewportRef={viewportRef}
        selectedId="node-a"
        // Node A: left 100, top 100, width 200, height 100 => right = 300
        // Node B: left 400, top 100 => gap = 400 - 300 = 100px
        selectedBounds={{ left: 100, top: 100, width: 200, height: 100 }}
        zoom={1}
      />,
    )

    // Press Alt
    fireEvent.keyDown(window, { key: 'Alt' })

    // Move pointer over Node B
    fireEvent.pointerMove(viewport, { clientX: 450, clientY: 150 })

    // Guides container should now be visible
    expect(screen.getByTestId('canvas-distance-guides')).toBeInTheDocument()

    // Should show 100px distance pill
    expect(screen.getByText('100px')).toBeInTheDocument()

    // Releasing Alt hides the guides
    fireEvent.keyUp(window, { key: 'Alt' })
    expect(screen.queryByTestId('canvas-distance-guides')).toBeNull()

    document.body.removeChild(viewport)
  })

  it('correctly accounts for canvas zoom scale in distance calculation', () => {
    const viewport = document.createElement('div')
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

    const targetNode = document.createElement('div')
    targetNode.setAttribute('data-node-id', 'node-b')
    viewport.appendChild(targetNode)
    document.body.appendChild(viewport)

    vi.spyOn(targetNode, 'getBoundingClientRect').mockReturnValue({
      left: 500,
      top: 100,
      right: 700,
      bottom: 200,
      width: 200,
      height: 100,
      x: 500,
      y: 100,
      toJSON: () => {},
    })

    document.elementFromPoint = vi.fn(() => targetNode)

    const viewportRef = { current: viewport }
    render(
      <CanvasDistanceGuides
        viewportRef={viewportRef}
        selectedId="node-a"
        // Screen gap = 500 - 300 = 200px. With zoom = 2, logical distance is 200 / 2 = 100px
        selectedBounds={{ left: 100, top: 100, width: 200, height: 100 }}
        zoom={2}
      />,
    )

    fireEvent.keyDown(window, { key: 'Alt' })
    fireEvent.pointerMove(viewport, { clientX: 550, clientY: 150 })

    expect(screen.getByText('100px')).toBeInTheDocument()

    document.body.removeChild(viewport)
  })
})
