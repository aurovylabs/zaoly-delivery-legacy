import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { CompositionScene, SceneNode } from '@zaoly/contracts'
import { useEditorPalette } from '../components/editor/use-editor-palette'
import { activePageRoot } from '../lib/scene/scene-pages'
import { paths } from '../lib/paths'

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

describe('useEditorPalette (W5j)', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes(paths.routes.apiSiteKitCompositions)) {
          return {
            ok: true,
            json: async () => ({ compositions: [] }),
          } as Response
        }
        return { ok: false, json: async () => ({}) } as Response
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('exposes empty pattern list and catalog groups', async () => {
    const present = scene()
    const { result } = renderHook(() =>
      useEditorPalette({
        scene: present,
        sceneRef: { current: present },
        selectedId: 'root',
        workingRoot: activePageRoot,
        editingMasterIdRef: { current: null },
        editingVariantIdRef: { current: null },
        runOps: vi.fn(),
        pushPresent: vi.fn(),
        setSelectedIds: vi.fn(),
        setError: vi.fn(),
        t: (key) => key,
      }),
    )
    await waitFor(() => expect(result.current.patternItems).toEqual([]))
    expect(result.current.paletteQuery).toBe('')
    expect(result.current.paletteItems.length).toBeGreaterThan(0)
    expect(result.current.paletteGroups.length).toBeGreaterThan(0)
  })

  it('onAdd hydrates a Text insert under the root', async () => {
    const present = scene()
    const pushPresent = vi.fn()
    const setSelectedIds = vi.fn()
    const { result } = renderHook(() =>
      useEditorPalette({
        scene: present,
        sceneRef: { current: present },
        selectedId: 'root',
        workingRoot: activePageRoot,
        editingMasterIdRef: { current: null },
        editingVariantIdRef: { current: null },
        runOps: vi.fn(),
        pushPresent,
        setSelectedIds,
        setError: vi.fn(),
        t: (key) => key,
      }),
    )
    await act(async () => {
      result.current.onAdd('Text')
      await Promise.resolve()
      await Promise.resolve()
    })
    await waitFor(() => expect(pushPresent).toHaveBeenCalled())
    const next = pushPresent.mock.calls[0][0] as CompositionScene
    expect((next.root.children ?? []).length).toBeGreaterThan(1)
    expect(setSelectedIds).toHaveBeenCalled()
  })
})
