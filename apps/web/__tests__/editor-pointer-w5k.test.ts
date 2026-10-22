import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { CompositionScene, SceneNode } from '@zaoly/contracts'
import { useEditorPointer } from '../components/editor/use-editor-pointer'
import type { FrameDragSession, MarqueeSession, ResizeSession } from '../components/editor/editor-boot'

function scene(): CompositionScene {
  const child: SceneNode = { id: 'text-1', type: 'Text', props: { text: 'Hi' } }
  return {
    id: 's1',
    name: 'Demo',
    version: 1,
    root: { id: 'root', type: 'Stack', children: [child] },
    updatedAt: '2026-09-12T00:00:00.000Z',
  }
}

describe('useEditorPointer (W5k)', () => {
  it('starts idle with no frame drag page', () => {
    const present = scene()
    const panOrigin = { current: null as { x: number; y: number; panX: number; panY: number } | null }
    const resizeSession = { current: null as ResizeSession | null }
    const marqueeSession = { current: null as MarqueeSession | null }
    const frameDragSession = { current: null as FrameDragSession | null }
    const setPanning = vi.fn()
    const { result } = renderHook(() =>
      useEditorPointer({
        sceneRef: { current: present },
        viewportRef: { current: null },
        inspectRootRef: { current: present.root },
        zoomPanRef: { current: { zoom: 1, panX: 0, panY: 0 } },
        panOrigin,
        resizeSession,
        marqueeSession,
        frameDragSession,
        zoom: 1,
        spaceDown: false,
        activeBreakpoint: 'desktop',
        activePrintPreset: 'a4-portrait',
        artboardHeight: 640,
        selected: present.root.children![0],
        selectedIds: ['text-1'],
        selectionBounds: { left: 0, top: 0, width: 100, height: 40 },
        primaryLocked: false,
        runOp: vi.fn(),
        runOps: vi.fn(),
        setSelectedIds: vi.fn(),
        setPanning,
        setMarquee: vi.fn(),
        setSelectionBoundsSnapshot: vi.fn(),
        commitViewport: vi.fn(),
        refreshSelectionBounds: vi.fn(),
      }),
    )
    expect(result.current.frameDraggingPageId).toBeNull()
  })

  it('beginPan via Space-held pointer down sets panning', () => {
    const present = scene()
    const panOrigin = { current: null as { x: number; y: number; panX: number; panY: number } | null }
    const setPanning = vi.fn()
    const setPointerCapture = vi.fn()
    const { result } = renderHook(() =>
      useEditorPointer({
        sceneRef: { current: present },
        viewportRef: { current: null },
        inspectRootRef: { current: present.root },
        zoomPanRef: { current: { zoom: 1, panX: 10, panY: 20 } },
        panOrigin,
        resizeSession: { current: null },
        marqueeSession: { current: null },
        frameDragSession: { current: null },
        zoom: 1,
        spaceDown: true,
        activeBreakpoint: 'desktop',
        activePrintPreset: 'a4-portrait',
        artboardHeight: 640,
        selected: null,
        selectedIds: [],
        selectionBounds: null,
        primaryLocked: false,
        runOp: vi.fn(),
        runOps: vi.fn(),
        setSelectedIds: vi.fn(),
        setPanning,
        setMarquee: vi.fn(),
        setSelectionBoundsSnapshot: vi.fn(),
        commitViewport: vi.fn(),
        refreshSelectionBounds: vi.fn(),
      }),
    )
    act(() => {
      result.current.onCanvasPointerDown({
        button: 0,
        pointerId: 1,
        clientX: 100,
        clientY: 50,
        preventDefault: vi.fn(),
        currentTarget: { setPointerCapture },
        target: document.createElement('div'),
      } as unknown as React.PointerEvent<HTMLDivElement>)
    })
    expect(setPanning).toHaveBeenCalledWith(true)
    expect(panOrigin.current).toEqual({ x: 100, y: 50, panX: 10, panY: 20 })
    expect(setPointerCapture).toHaveBeenCalledWith(1)
  })
})
