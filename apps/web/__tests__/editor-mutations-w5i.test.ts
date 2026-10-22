import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { CompositionScene, SceneNode } from '@zaoly/contracts'
import { useEditorMutations } from '../components/editor/use-editor-mutations'

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

describe('useEditorMutations (W5i)', () => {
  it('runOp select updates selection without pushPresent', () => {
    const present = sceneWithChild()
    const pushPresent = vi.fn()
    const setSelectedIds = vi.fn()
    const { result } = renderHook(() =>
      useEditorMutations({
        sceneRef: { current: present },
        editingMasterIdRef: { current: null },
        editingVariantIdRef: { current: null },
        inspectRootRef: { current: present.root },
        pushPresent,
        enqueuePendingOp: vi.fn(),
        enqueuePendingOps: vi.fn(),
        setSelectedIds,
        setError: vi.fn(),
        pushToast: vi.fn(),
      }),
    )
    act(() => {
      result.current.runOp({ op: 'select', nodeId: 'text-1' })
    })
    expect(setSelectedIds).toHaveBeenCalledWith(['text-1'])
    expect(pushPresent).not.toHaveBeenCalled()
  })

  it('runOp applies set_prop and enqueues pending op', () => {
    const present = sceneWithChild()
    const sceneRef = { current: present }
    const pushPresent = vi.fn()
    const enqueuePendingOp = vi.fn()
    const setError = vi.fn()
    const { result } = renderHook(() =>
      useEditorMutations({
        sceneRef,
        editingMasterIdRef: { current: null },
        editingVariantIdRef: { current: null },
        inspectRootRef: { current: present.root },
        pushPresent,
        enqueuePendingOp,
        enqueuePendingOps: vi.fn(),
        setSelectedIds: vi.fn(),
        setError,
        pushToast: vi.fn(),
      }),
    )
    const op = { op: 'set_prop' as const, nodeId: 'text-1', key: 'text', value: 'Bye' }
    act(() => {
      result.current.runOp(op)
    })
    expect(setError).toHaveBeenCalledWith(null)
    expect(pushPresent).toHaveBeenCalledTimes(1)
    const [next, ops] = pushPresent.mock.calls[0]
    expect(ops).toEqual([op])
    expect(next.root.children?.[0]?.props?.text).toBe('Bye')
    expect(enqueuePendingOp).toHaveBeenCalledWith(op)
  })

  it('workingRoot returns active page root outside master edit', () => {
    const present = sceneWithChild()
    const { result } = renderHook(() =>
      useEditorMutations({
        sceneRef: { current: present },
        editingMasterIdRef: { current: null },
        editingVariantIdRef: { current: null },
        inspectRootRef: { current: present.root },
        pushPresent: vi.fn(),
        enqueuePendingOp: vi.fn(),
        enqueuePendingOps: vi.fn(),
        setSelectedIds: vi.fn(),
        setError: vi.fn(),
        pushToast: vi.fn(),
      }),
    )
    expect(result.current.workingRoot(present).id).toBe('root')
  })
})
