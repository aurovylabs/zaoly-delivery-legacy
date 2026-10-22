// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { useLocalPackFocusRefresh } from '../components/editor/use-local-pack-focus-refresh'
import { INSPECT_TOKEN_CATALOG } from '../lib/inspect/token-catalog'
import { paths } from '../lib/paths'
import { resolveTokenBindingsToStyle } from '../lib/inspect/resolve-bindings'

afterEach(() => vi.unstubAllGlobals())

describe('local pack focus refresh', () => {
  it('updates the shared editor catalog when a local token changes', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tokens: [{
          path: 'color.action.primary',
          type: 'color',
          value: JSON.stringify({ digital: { hex: '#7457d8' } }),
          status: 'active',
        }],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => {
      const [catalog, setCatalog] = useState(INSPECT_TOKEN_CATALOG)
      useLocalPackFocusRefresh(true, setCatalog)
      return catalog
    })

    act(() => window.dispatchEvent(new Event('focus')))
    await waitFor(() => {
      expect(result.current.find((row) => row.path === 'color.action.primary')?.preview).toBe('#7457d8')
    })
    expect(resolveTokenBindingsToStyle({ background: 'color.action.primary' }, undefined, result.current).backgroundColor).toBe('#7457d8')
    expect(resolveTokenBindingsToStyle({ color: 'color.action.primary' }, undefined, result.current).color).toBe('#7457d8')
    expect(fetchMock).toHaveBeenCalledWith(paths.routes.apiTokens, { cache: 'no-store' })
  })

  it('does not replace a disabled refresh', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderHook(() => {
      const [, setCatalog] = useState(INSPECT_TOKEN_CATALOG)
      useLocalPackFocusRefresh(false, setCatalog)
    })

    act(() => window.dispatchEvent(new Event('focus')))
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
