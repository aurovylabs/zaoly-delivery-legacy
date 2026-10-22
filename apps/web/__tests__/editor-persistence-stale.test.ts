import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { CompositionScene } from '@zaoly/contracts'

const { putScene, applySceneOps, reportError } = vi.hoisted(() => ({
  putScene: vi.fn(),
  applySceneOps: vi.fn(),
  reportError: vi.fn(),
}))

vi.mock('../lib/scene/scene-save-client', () => ({
  putScene,
  applySceneOps,
}))

vi.mock('../lib/observability/report-error', () => ({
  reportError,
}))

import { useEditorPersistence } from '../components/editor/use-editor-persistence'

function scene(name: string): CompositionScene {
  return {
    id: 's1',
    name,
    version: 1,
    root: { id: 'root', type: 'Stack', children: [] },
    updatedAt: '2026-09-12T00:00:00.000Z',
  }
}

describe('useEditorPersistence stale conflict (W6 keep-draft)', () => {
  beforeEach(() => {
    putScene.mockReset()
    applySceneOps.mockReset()
    reportError.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps local present and notifies on stale-scene without reload', async () => {
    putScene.mockResolvedValue({ ok: false, stale: true, message: 'stale', status: 409 })
    const onStaleConflict = vi.fn()
    const pushToast = vi.fn()
    const setError = vi.fn()
    const present = scene('local-draft')

    const { result } = renderHook(() =>
      useEditorPersistence({
        initialUpdatedAt: present.updatedAt,
        initialPresent: present,
        initialBreakpoint: 'desktop',
        initialPrintPreset: 'a4-portrait',
        contentRevision: 1,
        scene: present,
        activeBreakpoint: 'desktop',
        activePrintPreset: 'a4-portrait',
        getLive: () => ({
          scene: present,
          activeBreakpoint: 'desktop',
          activePrintPreset: 'a4-portrait',
          revision: 1,
        }),
        isSaveBlocked: () => false,
        onStaleConflict,
        t: (key) => key,
        pushToast,
        setError,
      }),
    )

    await act(async () => {
      await result.current.onSave()
    })

    expect(putScene).toHaveBeenCalled()
    expect(onStaleConflict).toHaveBeenCalledWith({ sceneId: 's1' })
    expect(setError).toHaveBeenCalledWith('editor.staleSceneConflict')
    expect(pushToast).toHaveBeenCalled()
    expect(reportError).toHaveBeenCalled()
    expect(result.current.saveState).toBe('error')
    expect(result.current.dirty).toBe(true)
  })

  it('commits updatedAt lock to the ref before trailing autosave microtask', async () => {
    let revision = 1
    putScene.mockImplementation(async (_scene, baseUpdatedAt: string) => {
      if (putScene.mock.calls.length === 1) {
        revision = 2
        return {
          ok: true as const,
          scene: { ...scene('v1'), updatedAt: '2026-09-12T00:00:01.000Z' },
        }
      }
      void baseUpdatedAt
      return {
        ok: true as const,
        scene: { ...scene('v2'), updatedAt: '2026-09-12T00:00:02.000Z' },
      }
    })

    const present = scene('local-draft')
    const { result } = renderHook(() =>
      useEditorPersistence({
        initialUpdatedAt: present.updatedAt,
        initialPresent: present,
        initialBreakpoint: 'desktop',
        initialPrintPreset: 'a4-portrait',
        contentRevision: revision,
        scene: present,
        activeBreakpoint: 'desktop',
        activePrintPreset: 'a4-portrait',
        getLive: () => ({
          scene: present,
          activeBreakpoint: 'desktop',
          activePrintPreset: 'a4-portrait',
          revision,
        }),
        isSaveBlocked: () => false,
        onStaleConflict: vi.fn(),
        t: (key) => key,
        pushToast: vi.fn(),
        setError: vi.fn(),
      }),
    )

    await act(async () => {
      await result.current.onSave()
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(putScene).toHaveBeenCalledTimes(2)
    expect(putScene.mock.calls[1][1]).toBe('2026-09-12T00:00:01.000Z')
    expect(reportError).not.toHaveBeenCalled()
  })
})
