import { describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { CompositionScene } from '@zaoly/contracts'
import { createHistory } from '../lib/scene/history'
import { useEditorHistory } from '../components/editor/use-editor-history'
import { useEditorSelection } from '../components/editor/use-editor-selection'

function scene(name: string): CompositionScene {
  return {
    id: 's1',
    name,
    version: 1,
    root: { id: 'root', type: 'Stack', children: [] },
    updatedAt: '2026-09-12T00:00:00.000Z',
  }
}

describe('useEditorHistory (W5e/W5f)', () => {
  it('pushes present and undoes/redoes', () => {
    const { result } = renderHook(() => useEditorHistory(createHistory(scene('A'))))
    expect(result.current.scene.name).toBe('A')
    expect(result.current.canUndo()).toBe(false)
    expect(result.current.revision).toBe(0)

    act(() => {
      result.current.pushPresent(scene('B'))
    })
    expect(result.current.scene.name).toBe('B')
    expect(result.current.revision).toBe(1)
    expect(result.current.canUndo()).toBe(true)

    act(() => {
      result.current.undo()
    })
    expect(result.current.scene.name).toBe('A')
    expect(result.current.revision).toBe(0)
    expect(result.current.canRedo()).toBe(true)

    act(() => {
      result.current.redo()
    })
    expect(result.current.scene.name).toBe('B')
    expect(result.current.revision).toBe(1)
  })

  it('resetPresent clears stacks and revision', () => {
    const { result } = renderHook(() => useEditorHistory(createHistory(scene('A'))))
    act(() => {
      result.current.pushPresent(scene('B'))
      result.current.resetPresent(scene('C'))
    })
    expect(result.current.scene.name).toBe('C')
    expect(result.current.revision).toBe(0)
    expect(result.current.canUndo()).toBe(false)
    expect(result.current.canRedo()).toBe(false)
  })

  it('mutatePresent bumps revision without undo stack', () => {
    const { result } = renderHook(() => useEditorHistory(createHistory(scene('A'))))
    act(() => {
      result.current.mutatePresent((s) => ({ ...s, name: 'Patched' }))
    })
    expect(result.current.scene.name).toBe('Patched')
    expect(result.current.revision).toBe(1)
    expect(result.current.canUndo()).toBe(false)
  })

  it('does not change revision when undo apply fails', () => {
    const { result } = renderHook(() => useEditorHistory(createHistory(scene('A'))))
    act(() => {
      result.current.pushPresent(scene('B'))
    })
    expect(result.current.revision).toBe(1)
    // Keep pastRevRef aligned with one push; swap in a broken ops inverse.
    act(() => {
      result.current.setHistory({
        past: [
          {
            kind: 'ops',
            forward: [{ op: 'set_prop', nodeId: 'root', key: 'x', value: 1 }],
            inverse: [{ op: 'remove_node', nodeId: 'root' }],
          },
        ],
        present: scene('B'),
        future: [],
      })
    })
    act(() => {
      result.current.undo()
    })
    expect(result.current.scene.name).toBe('B')
    expect(result.current.revision).toBe(1)
  })
})

describe('useEditorSelection (W5e)', () => {
  it('tracks primary id and toggle/replace', () => {
    const { result } = renderHook(() => useEditorSelection(['a']))
    expect(result.current.selectedId).toBe('a')

    act(() => {
      result.current.selectToggle('b')
    })
    expect(result.current.selectedIds).toEqual(['a', 'b'])
    expect(result.current.selectedId).toBe('b')
    expect(result.current.selectedIdRef.current).toBe('b')

    act(() => {
      result.current.selectOnly('c')
    })
    expect(result.current.selectedIds).toEqual(['c'])
  })
})
