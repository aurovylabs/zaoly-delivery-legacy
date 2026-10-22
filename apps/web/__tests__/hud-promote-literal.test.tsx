import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { SceneNode } from '@zaoly/contracts'
import { HudTokenField } from '../components/hud-token-field'
import { HudPromoteProvider } from '../components/hud-promote-context'
import { TokenCatalogProvider } from '../lib/inspect/token-catalog-context'
import { INSPECT_TOKEN_CATALOG } from '../lib/inspect/token-catalog'
import type { BrandTokenPackResponse } from '../lib/inspect/token-catalog'

vi.mock('../lib/user-prefs', () => ({
  useT: () => (key: string) => key,
}))

const brandPack: BrandTokenPackResponse = {
  source: 'local',
  platformProjectId: '',
  guidelineId: null,
  canWrite: true,
  tokens: [],
}

describe('HUD promote literal', () => {
  const node: SceneNode = {
    id: 't1',
    type: 'SiteText',
    name: 'T',
    props: { color: '#1f44ff' },
    tokenBindings: {},
  }

  it('shows promote on free color literal and PATCHes the local pack', async () => {
    const onOps = vi.fn()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        token: { path: 'color.custom.1f44ff', type: 'color', value: '#1f44ff', status: 'active' },
      }),
    } as Response)

    render(
      <TokenCatalogProvider catalog={INSPECT_TOKEN_CATALOG}>
        <HudPromoteProvider brandPack={brandPack} selectedNode={node} onOps={onOps}>
          <HudTokenField
            node={node}
            slotKey="color"
            label="Color"
            tokenGroup="color"
            onOps={onOps}
          />
        </HudPromoteProvider>
      </TokenCatalogProvider>,
    )

    fireEvent.click(screen.getByTestId('hud-token-color'))
    expect(screen.getByTestId('token-picker-promote')).toBeTruthy()
    fireEvent.click(screen.getByTestId('token-picker-promote'))
    expect(screen.getByTestId('inspect-promote-literal-dialog')).toBeTruthy()
    fireEvent.click(screen.getByTestId('inspect-promote-submit'))
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    await waitFor(() =>
      expect(onOps).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            op: 'set_token_binding',
            key: 'color',
            tokenPath: 'color.custom.1f44ff',
          }),
        ]),
      ),
    )
    fetchMock.mockRestore()
  })

  it('hides promote when the local pack is not writable', () => {
    render(
      <TokenCatalogProvider catalog={INSPECT_TOKEN_CATALOG}>
        <HudPromoteProvider
          brandPack={{ ...brandPack, source: 'fixture', guidelineId: null }}
          selectedNode={node}
          onOps={vi.fn()}
        >
          <HudTokenField
            node={node}
            slotKey="color"
            label="Color"
            tokenGroup="color"
            onOps={vi.fn()}
          />
        </HudPromoteProvider>
      </TokenCatalogProvider>,
    )
    fireEvent.click(screen.getByTestId('hud-token-color'))
    expect(screen.queryByTestId('token-picker-promote')).toBeNull()
  })

  it('promotes a literal via PATCH /api/tokens', async () => {
    const onOps = vi.fn()
    const onTokenSaved = vi.fn()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        token: { path: 'color.custom.1f44ff', type: 'color', value: '#1f44ff', status: 'active' },
      }),
    } as Response)

    render(
      <TokenCatalogProvider catalog={INSPECT_TOKEN_CATALOG}>
        <HudPromoteProvider
          brandPack={brandPack}
          selectedNode={node}
          onOps={onOps}
          onTokenSaved={onTokenSaved}
        >
          <HudTokenField
            node={node}
            slotKey="color"
            label="Color"
            tokenGroup="color"
            onOps={onOps}
          />
        </HudPromoteProvider>
      </TokenCatalogProvider>,
    )

    fireEvent.click(screen.getByTestId('hud-token-color'))
    expect(screen.getByTestId('token-picker-promote')).toBeTruthy()
    fireEvent.click(screen.getByTestId('token-picker-promote'))
    fireEvent.click(screen.getByTestId('inspect-promote-submit'))
    await waitFor(() =>
      expect(onTokenSaved).toHaveBeenCalledWith(
        expect.objectContaining({
          path: expect.stringContaining('color.'),
          type: 'color',
          status: 'active',
        }),
      ),
    )
    await waitFor(() =>
      expect(onOps).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            op: 'set_token_binding',
            key: 'color',
          }),
        ]),
      ),
    )
    expect(fetchMock).toHaveBeenCalled()
    const patchCall = fetchMock.mock.calls.find((call) => {
      const [url, init] = call as unknown as [RequestInfo | URL, RequestInit | undefined]
      return String(url).includes('/api/tokens') && init?.method === 'PATCH'
    })
    expect(patchCall).toBeTruthy()
    fetchMock.mockRestore()
  })
})
