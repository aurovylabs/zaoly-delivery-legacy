import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { CompositionScene, SceneNode, SceneOp } from '@zaoly/contracts'
import { useEditorStructure } from '../components/editor/use-editor-structure'
import { activePageRoot } from '../lib/scene/scene-pages'
import { applySceneOp } from '../lib/scene/ops'

function sceneWithChild(): CompositionScene {
  const child: SceneNode = {
    id: 'text-1',
    type: 'Text',
    props: { text: 'Hi' },
  }
  return {
    id: 's1',
    name: 'Demo',
    version: 1,
    root: { id: 'root', type: 'Stack', children: [child] },
    updatedAt: '2026-09-12T00:00:00.000Z',
  }
}

describe('useEditorStructure (W5h)', () => {
  it('copySelectedNodes returns false when nothing is copyable', () => {
    const present = sceneWithChild()
    const { result } = renderHook(() =>
      useEditorStructure({
        sceneRef: { current: present },
        selectedIdsRef: { current: ['root'] },
        selectedIdRef: { current: 'root' },
        selectedRef: { current: present.root },
        selectionBoundsRef: { current: null },
        zoom: 1,
        activeBreakpoint: 'desktop',
        workingRoot: activePageRoot,
        applyMutatingOp: (current, op) => applySceneOp(current, op),
        runOp: vi.fn(),
        runOps: vi.fn(),
        pushPresent: vi.fn(),
        enqueuePendingOp: vi.fn(),
        enqueuePendingOps: vi.fn(),
        setSelectedIds: vi.fn(),
        setError: vi.fn(),
        rejectMutation: vi.fn(),
        t: (key) => key,
      }),
    )
    let copied = true
    act(() => {
      copied = result.current.copySelectedNodes()
    })
    expect(copied).toBe(false)
  })

  it('removeSelectedNodes pushes remove_node and selects parent', () => {
    const present = sceneWithChild()
    const pushPresent = vi.fn()
    const enqueuePendingOps = vi.fn()
    const setSelectedIds = vi.fn()
    const sceneRef = { current: present }
    const { result } = renderHook(() =>
      useEditorStructure({
        sceneRef,
        selectedIdsRef: { current: ['text-1'] },
        selectedIdRef: { current: 'text-1' },
        selectedRef: { current: present.root.children![0] },
        selectionBoundsRef: { current: null },
        zoom: 1,
        activeBreakpoint: 'desktop',
        workingRoot: activePageRoot,
        applyMutatingOp: (current, op) => applySceneOp(current, op),
        runOp: vi.fn(),
        runOps: vi.fn(),
        pushPresent,
        enqueuePendingOp: vi.fn(),
        enqueuePendingOps,
        setSelectedIds,
        setError: vi.fn(),
        rejectMutation: vi.fn(),
        t: (key) => key,
      }),
    )
    act(() => {
      result.current.removeSelectedNodes()
    })
    expect(pushPresent).toHaveBeenCalledTimes(1)
    const [next, ops] = pushPresent.mock.calls[0] as [CompositionScene, SceneOp[]]
    expect(ops).toEqual([{ op: 'remove_node', nodeId: 'text-1' }])
    expect(next.root.children ?? []).toHaveLength(0)
    expect(enqueuePendingOps).toHaveBeenCalledWith([{ op: 'remove_node', nodeId: 'text-1' }])
    expect(setSelectedIds).toHaveBeenCalledWith(['root'])
  })
})
