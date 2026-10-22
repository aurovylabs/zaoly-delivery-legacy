import { describe, expect, it, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { CompositionScene } from '@zaoly/contracts'
import { useEditorIntegrations } from '../components/editor/use-editor-integrations'
import { INSPECT_TOKEN_CATALOG } from '../lib/inspect/token-catalog'

function scene(): CompositionScene {
  return {
    id: 's1',
    name: 'Demo',
    version: 1,
    root: { id: 'root', type: 'Stack', children: [] },
    pages: [{ id: 'page-1', name: 'Page 1', root: { id: 'root', type: 'Stack', children: [] } }],
    activePageId: 'page-1',
    updatedAt: '2026-09-12T00:00:00.000Z',
  }
}

describe('useEditorIntegrations (W5g)', () => {
  it('exposes idle busy flags and empty publish/pull counts', () => {
    const present = scene()
    const { result } = renderHook(() =>
      useEditorIntegrations({
        scene: present,
        sceneRef: { current: present },
        activeBreakpoint: 'desktop',
        tokenCatalog: INSPECT_TOKEN_CATALOG,
        pushPresent: vi.fn(),
        mutatePresent: vi.fn(),
        t: (key) => key,
        pushToast: vi.fn(),
        setError: vi.fn(),
      }),
    )
    expect(result.current.pdfBusy).toBe(false)
    expect(result.current.publishBusy).toBe(false)
    expect(result.current.publishableMasterCount).toBe(0)
    expect(result.current.pullableMasterCount).toBe(0)
  })

  it('errors when publishing with no publishable masters', async () => {
    const present = scene()
    const setError = vi.fn()
    const { result } = renderHook(() =>
      useEditorIntegrations({
        scene: present,
        sceneRef: { current: present },
        activeBreakpoint: 'desktop',
        tokenCatalog: INSPECT_TOKEN_CATALOG,
        pushPresent: vi.fn(),
        mutatePresent: vi.fn(),
        t: (key) => key,
        pushToast: vi.fn(),
        setError,
      }),
    )
    await act(async () => {
      await result.current.onPublishToStorybook()
    })
    expect(setError).toHaveBeenCalledWith('editor.siteKitPublishNone')
  })

  it('errors when publishing without a bound Collection', async () => {
    const present: CompositionScene = {
      ...scene(),
      masters: [
        {
          id: 'm1',
          name: 'Button',
          sourceKey: 'SiteButton',
          root: { id: 'r1', type: 'SiteButton', props: {} },
        },
      ],
    }
    const setError = vi.fn()
    const { result } = renderHook(() =>
      useEditorIntegrations({
        scene: present,
        sceneRef: { current: present },
        activeBreakpoint: 'desktop',
        tokenCatalog: INSPECT_TOKEN_CATALOG,
        pushPresent: vi.fn(),
        mutatePresent: vi.fn(),
        t: (key) => key,
        pushToast: vi.fn(),
        setError,
      }),
    )
    expect(result.current.publishableMasterCount).toBeGreaterThan(0)
    await act(async () => {
      await result.current.onPublishToStorybook()
    })
    expect(setError).toHaveBeenCalledWith('editor.siteKitPublishNeedCollection')
  })

  it('requires Collection bind for Save page as Pattern', async () => {
    const present = scene()
    const setError = vi.fn()
    const { result } = renderHook(() =>
      useEditorIntegrations({
        scene: present,
        sceneRef: { current: present },
        activeBreakpoint: 'desktop',
        tokenCatalog: INSPECT_TOKEN_CATALOG,
        pushPresent: vi.fn(),
        mutatePresent: vi.fn(),
        t: (key) => key,
        pushToast: vi.fn(),
        setError,
      }),
    )
    await act(async () => {
      await result.current.onSavePageAsPattern()
    })
    expect(setError).toHaveBeenCalledWith('editor.savePageAsPatternNeedCollection')
  })

  it('opens Kit Playground after successful Save page as Pattern', async () => {
    const present = scene()
    present.platformProjectId = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
    const pushPresent = vi.fn()
    const open = vi.fn().mockReturnValue({ closed: false })
    const prevOpen = window.open
    window.open = open as typeof window.open
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          scene: { ...present, updatedAt: '2026-09-14T00:00:00.000Z' },
          exportName: 'DemoPage',
          masterId: 'm1',
          componentId: 'Composition~aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee~DemoPage',
          storyTitle: 'Patterns/DemoPage',
          results: [
            {
              pageId: 'root',
              exportName: 'DemoPage',
              masterId: 'm1',
              componentId: 'Composition~aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee~DemoPage',
              storyTitle: 'Patterns/DemoPage',
            },
          ],
        }),
      }),
    )

    const { result } = renderHook(() =>
      useEditorIntegrations({
        scene: present,
        sceneRef: { current: present },
        activeBreakpoint: 'desktop',
        tokenCatalog: INSPECT_TOKEN_CATALOG,
        pushPresent,
        mutatePresent: vi.fn(),
        t: (key) => key,
        pushToast: vi.fn(),
        setError: vi.fn(),
      }),
    )

    await act(async () => {
      await result.current.onSavePageAsPattern()
    })

    expect(open).toHaveBeenCalledWith(
      expect.stringMatching(
        /\/kit\?.*componentId=Composition%7Eaaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee%7EDemoPage/,
      ),
      '_blank',
      'noopener,noreferrer',
    )
    expect(pushPresent).toHaveBeenCalled()
    expect(result.current.publishStatus).toBe('editor.savePageAsPatternOkOpened')

    window.open = prevOpen
    vi.unstubAllGlobals()
  })
})
