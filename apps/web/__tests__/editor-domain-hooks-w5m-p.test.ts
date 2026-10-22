import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { CompositionScene, SceneNode } from '@zaoly/contracts'
import { useEditorMasterEdit } from '../components/editor/use-editor-master-edit'
import { useEditorNodeSelect } from '../components/editor/use-editor-node-select'
import { useEditorContextMenu } from '../components/editor/use-editor-context-menu'
import { useEditorSceneSync } from '../components/editor/use-editor-scene-sync'
import { activePageRoot } from '../lib/scene/scene-pages'

function scene(): CompositionScene {
  const child: SceneNode = { id: 'text-1', type: 'Text', props: { text: 'Hi' } }
  return {
    id: 's1',
    name: 'Demo',
    version: 1,
    root: { id: 'root', type: 'Stack', children: [child] },
    updatedAt: '2026-09-12T00:00:00.000Z',
    masters: [
      {
        id: 'm1',
        name: 'Card',
        root: { id: 'm-root', type: 'Stack', children: [] },
        defaultVariantId: 'v1',
        variants: [{ id: 'v1', name: 'Default', root: { id: 'm-root', type: 'Stack', children: [] } }],
      },
    ],
  }
}

describe('editor remaining domain hooks (W5m–W5p)', () => {
  it('orchestrator imports W5m–W5p hooks and drops inlined bodies', () => {
    const src = readFileSync(resolve(__dirname, '../components/editor/use-editor-scene-state.ts'), 'utf8')
    expect(src).toContain("from './use-editor-master-edit'")
    expect(src).toContain("from './use-editor-node-select'")
    expect(src).toContain("from './use-editor-context-menu'")
    expect(src).toContain("from './use-editor-scene-sync'")
    expect(src).not.toContain('function enterMasterEdit')
    expect(src).not.toContain('function selectNode')
    expect(src).not.toContain('function applySceneSnapshot')
    expect(src).not.toContain('function onBreakpointChange')
  })

  it('W5m enterMasterEdit selects variant root and switches left tab', () => {
    const present = scene()
    const setSelectedIds = vi.fn()
    const setLeftTab = vi.fn()
    const { result } = renderHook(() =>
      useEditorMasterEdit({
        sceneRef: { current: present },
        setSelectedIds,
        setLeftTab,
        pushPresent: vi.fn(),
        enqueuePendingOp: vi.fn(),
        setError: vi.fn(),
      }),
    )
    act(() => {
      result.current.enterMasterEdit('m1')
    })
    expect(result.current.editingMasterId).toBe('m1')
    expect(result.current.editingVariantId).toBe('v1')
    expect(result.current.editingVariantIdRef.current).toBe('v1')
    expect(setSelectedIds).toHaveBeenCalledWith(['m-root'])
    expect(setLeftTab).toHaveBeenCalledWith('layers')
  })

  it('W5n selectNode replaces selection for a simple node id', () => {
    const present = scene()
    const setSelectedIds = vi.fn()
    const { result } = renderHook(() =>
      useEditorNodeSelect({
        sceneRef: { current: present },
        editingMasterIdRef: { current: null },
        editingVariantIdRef: { current: null },
        masterBoardRootRef: { current: null },
        inspectRootRef: { current: present.root },
        expandedRootRef: { current: present.root },
        activeBreakpointRef: { current: 'desktop' },
        onActivateBreakpoint: vi.fn(),
        applyMutatingOp: vi.fn(),
        activateMasterVariant: vi.fn(),
        upsertMasterBoardCell: vi.fn(),
        addMasterVariantFromBoard: vi.fn(),
        pushPresent: vi.fn(),
        setSelectedIds,
        setError: vi.fn(),
      }),
    )
    act(() => {
      result.current.selectNode('text-1')
    })
    expect(setSelectedIds).toHaveBeenCalledWith(['text-1'])
  })

  it('W5o context menu opens for a node id', () => {
    const present = scene()
    const setSelectedIds = vi.fn()
    const { result } = renderHook(() =>
      useEditorContextMenu({
        scene: present,
        pageRoot: present.root,
        selectedIdsRef: { current: ['root'] },
        clipboardLength: () => 0,
        workingRoot: activePageRoot,
        setSelectedIds,
        t: (key) => key,
        actions: {
          cut: vi.fn(),
          copy: vi.fn(),
          paste: vi.fn(),
          duplicate: vi.fn(),
          delete: vi.fn(),
          wrapStack: vi.fn(),
          wrapGrid: vi.fn(),
          unwrap: vi.fn(),
        },
      }),
    )
    act(() => {
      result.current.openEditorContextMenu(10, 20, 'text-1')
    })
    expect(result.current.contextMenu.open).toBe(true)
    expect(result.current.contextMenu.ids).toEqual(['text-1'])
    expect(setSelectedIds).toHaveBeenCalledWith(['text-1'])
  })

  it('W5p onBreakpointChange mutates present activeBreakpoint', () => {
    const mutatePresent = vi.fn()
    const setActiveBreakpoint = vi.fn()
    const { result } = renderHook(() =>
      useEditorSceneSync({
        sceneId: 's1',
        activeBreakpoint: 'desktop',
        activePrintPreset: 'a4-portrait',
        activeBreakpointRef: { current: 'desktop' },
        activePrintPresetRef: { current: 'a4-portrait' },
        savedUpdatedAtRef: { current: '2026-09-12T00:00:00.000Z' },
        dirtyRef: { current: false },
        saveInFlightRef: { current: false },
        setActiveBreakpoint,
        setActivePrintPreset: vi.fn(),
        setEditingMasterId: vi.fn(),
        setEditingVariantId: vi.fn(),
        setSelectedIds: vi.fn(),
        setRemoteUpdateAvailable: vi.fn(),
        setStaleConflict: vi.fn(),
        setError: vi.fn(),
        mutatePresent,
        resetPresent: vi.fn(),
        setSavedUpdatedAt: vi.fn(),
        syncSavedSceneSnapshot: vi.fn(),
        markSaved: vi.fn(),
      }),
    )
    act(() => {
      result.current.onBreakpointChange('mobile')
    })
    expect(setActiveBreakpoint).toHaveBeenCalledWith('mobile')
    expect(mutatePresent).toHaveBeenCalledTimes(1)
  })

  it('W5p ignores scene-updated while save is in flight (own persist echo)', () => {
    class HookEventSource {
      static instances: HookEventSource[] = []
      listeners = new Map<string, Set<(ev: MessageEvent<string>) => void>>()
      constructor(public url: string) {
        HookEventSource.instances.push(this)
      }
      addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
        const set = this.listeners.get(type) ?? new Set<(ev: MessageEvent<string>) => void>()
        set.add(
          typeof listener === 'function'
            ? (listener as (ev: MessageEvent<string>) => void)
            : (ev) => listener.handleEvent(ev),
        )
        this.listeners.set(type, set)
      }
      removeEventListener() {}
      close() {}
      emit(type: string, data: unknown) {
        const event = { data: JSON.stringify(data) } as MessageEvent<string>
        for (const fn of this.listeners.get(type) ?? []) fn(event)
      }
    }
    HookEventSource.instances = []
    vi.stubGlobal('EventSource', HookEventSource as unknown as typeof EventSource)
    const setRemoteUpdateAvailable = vi.fn()
    const saveInFlightRef = { current: true }
    const dirtyRef = { current: true }
    try {
      renderHook(() =>
        useEditorSceneSync({
          sceneId: 's1',
          activeBreakpoint: 'desktop',
          activePrintPreset: 'a4-portrait',
          activeBreakpointRef: { current: 'desktop' },
          activePrintPresetRef: { current: 'a4-portrait' },
          savedUpdatedAtRef: { current: '2026-09-12T00:00:00.000Z' },
          dirtyRef,
          saveInFlightRef,
          setActiveBreakpoint: vi.fn(),
          setActivePrintPreset: vi.fn(),
          setEditingMasterId: vi.fn(),
          setEditingVariantId: vi.fn(),
          setSelectedIds: vi.fn(),
          setRemoteUpdateAvailable,
          setStaleConflict: vi.fn(),
          setError: vi.fn(),
          mutatePresent: vi.fn(),
          resetPresent: vi.fn(),
          setSavedUpdatedAt: vi.fn(),
          syncSavedSceneSnapshot: vi.fn(),
          markSaved: vi.fn(),
        }),
      )
      const es = HookEventSource.instances[0]
      expect(es).toBeTruthy()
      act(() => {
        es!.emit('scene-updated', {
          type: 'scene-updated',
          sceneId: 's1',
          updatedAt: '2099-01-01T00:00:00.000Z',
          platformProjectId: null,
          source: 'scene_ops',
        })
      })
      expect(setRemoteUpdateAvailable).not.toHaveBeenCalled()
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
