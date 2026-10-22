import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { AppProviders } from '../components/app-providers'
import { EditorTokenStudio } from '../components/editor-token-studio'
import { paths } from '../lib/paths'
import type { BrandTokenPackResponse } from '../lib/inspect/token-catalog'

const livePack: BrandTokenPackResponse = {
  source: 'local',
  guidelineId: null,
  platformProjectId: '',
  canWrite: true,
  tokens: [
    {
      path: 'color.action.primary',
      type: 'color',
      value: JSON.stringify({ digital: { hex: '#ff00aa' }, print: { pantone: 'PMS 226 C' } }),
      status: 'active',
    },
    {
      path: 'spacing.static.medium',
      type: 'spacing',
      value: JSON.stringify({ digital: '1rem' }),
      status: 'active',
    },
  ],
}

function openAddSheet() {
  fireEvent.click(screen.getByTestId('token-studio-add-toggle'))
  expect(screen.getByTestId('token-studio-add')).toBeInTheDocument()
}

function openEditDialog(path: string) {
  fireEvent.click(screen.getByTestId(`token-studio-edit-${path}`))
  expect(screen.getByTestId('token-studio-edit-dialog')).toBeInTheDocument()
}

describe('EditorTokenStudio (P75)', () => {
  it('lists editable leaves and PATCHes digital hex from edit dialog', async () => {
    const onTokenSaved = vi.fn()
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          ok: true,
          token: {
            path: 'color.action.primary',
            type: 'color',
            value: JSON.stringify({ digital: { hex: '#112233' }, print: { pantone: 'PMS 226 C' } }),
            status: 'active',
          },
        }),
        { status: 200 },
      ),
    )
    globalThis.fetch = fetchMock as typeof fetch

    render(
      <AppProviders>
        <EditorTokenStudio pack={livePack} onTokenSaved={onTokenSaved} />
      </AppProviders>,
    )

    expect(screen.getByTestId('creation-editor-token-studio')).toBeInTheDocument()
    expect(screen.getByTestId('token-studio-open-hub')).toHaveAttribute('href', paths.routes.tokens)
    expect(screen.getByTestId('token-studio-hub-color.action.primary')).toHaveAttribute(
      'href',
      paths.routes.tokensFocus('color.action.primary'),
    )
    expect(screen.queryByTestId('token-studio-input-color.action.primary')).toBeNull()

    openEditDialog('color.action.primary')
    expect(screen.getByTestId('token-studio-edit-open-hub')).toHaveAttribute(
      'href',
      paths.routes.tokensFocus('color.action.primary'),
    )
    expect(screen.getByTestId('token-studio-color-color.action.primary')).toBeInTheDocument()
    const input = screen.getByTestId('token-studio-input-color.action.primary') as HTMLInputElement
    expect(input.value).toBe('#ff00aa')
    fireEvent.change(input, { target: { value: '#112233' } })
    fireEvent.click(screen.getByTestId('token-studio-edit-save'))

    await waitFor(() => expect(onTokenSaved).toHaveBeenCalled())
    const patchCall = fetchMock.mock.calls.find((call) => {
      const [url, init] = call as unknown as [RequestInfo | URL, RequestInit | undefined]
      return String(url) === paths.routes.apiTokens && init?.method === 'PATCH'
    }) as unknown as [RequestInfo | URL, RequestInit] | undefined
    expect(patchCall).toBeTruthy()
    const body = JSON.parse(String(patchCall![1].body)) as {
      path: string
      value: string
    }
    expect(body.path).toBe('color.action.primary')
    expect(JSON.parse(body.value).digital.hex).toBe('#112233')
    expect(JSON.parse(body.value).print.pantone).toBe('PMS 226 C')
  })

  it('lists fixture catalog read-only without Brandion guideline', () => {
    render(
      <AppProviders>
        <EditorTokenStudio
          pack={{
            source: 'fixture',
            guidelineId: null,
            platformProjectId: 'plx-local-demo',
            tokens: [],
          }}
          onTokenSaved={vi.fn()}
        />
      </AppProviders>,
    )
    expect(screen.getByTestId('token-studio-status').textContent).toMatch(/read-only|nur lesen/i)
    expect(screen.getByTestId('token-studio-catalog-list')).toBeInTheDocument()
    expect(screen.getByTestId('token-studio-row-color.action.primary')).toBeInTheDocument()
    expect(screen.getByTestId('token-studio-row-color.action.primary')).toHaveAttribute(
      'data-token-draggable',
      'true',
    )
    // Only the first type section is open by default — filter Space to reveal the fixture leaf.
    fireEvent.click(screen.getByRole('button', { name: /^Space$/ }))
    expect(screen.getByTestId('token-studio-row-spacing.static.medium')).toBeInTheDocument()
    expect(screen.queryByTestId('token-studio-input-color.action.primary')).toBeNull()
    expect(screen.queryByTestId('token-studio-add-toggle')).toBeNull()
    expect(screen.queryByTestId('token-studio-add')).toBeNull()
  })

  it('persists add via PATCH /api/tokens', async () => {
    const onTokenSaved = vi.fn()
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          ok: true,
          token: {
            path: 'color.custom.1f44ff',
            type: 'color',
            value: JSON.stringify({ digital: { hex: '#1f44ff' } }),
            status: 'active',
          },
        }),
        { status: 200 },
      ),
    )
    globalThis.fetch = fetchMock as typeof fetch

    render(
      <AppProviders>
        <EditorTokenStudio pack={livePack} onTokenSaved={onTokenSaved} />
      </AppProviders>,
    )

    expect(screen.getByTestId('token-studio-status').textContent).toMatch(/local pack|lokales pack/i)
    openAddSheet()
    fireEvent.change(screen.getByTestId('token-studio-add-path'), {
      target: { value: 'color.custom.1f44ff' },
    })
    fireEvent.click(within(screen.getByTestId('token-studio-add-type')).getByTitle('color'))
    fireEvent.change(screen.getByTestId('token-studio-add-value'), {
      target: { value: '#1f44ff' },
    })
    fireEvent.click(screen.getByTestId('token-studio-add-submit'))

    await waitFor(() =>
      expect(onTokenSaved).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'color.custom.1f44ff',
          type: 'color',
          status: 'active',
        }),
      ),
    )
    const patchCall = fetchMock.mock.calls.find((call) => {
      const [url, init] = call as unknown as [RequestInfo | URL, RequestInit | undefined]
      return String(url) === paths.routes.apiTokens && init?.method === 'PATCH'
    })
    expect(patchCall).toBeTruthy()
  })

  it('P81a adds a new color leaf via PATCH', async () => {
    const onTokenSaved = vi.fn()
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          ok: true,
          token: {
            path: 'color.action.tertiary',
            type: 'color',
            value: JSON.stringify({ digital: { hex: '#abcdef' } }),
            status: 'active',
          },
        }),
        { status: 200 },
      ),
    )
    globalThis.fetch = fetchMock as typeof fetch

    render(
      <AppProviders>
        <EditorTokenStudio pack={livePack} onTokenSaved={onTokenSaved} />
      </AppProviders>,
    )

    openAddSheet()
    fireEvent.change(screen.getByTestId('token-studio-add-path'), {
      target: { value: 'color.action.tertiary' },
    })
    fireEvent.click(within(screen.getByTestId('token-studio-add-type')).getByTitle('color'))
    fireEvent.change(screen.getByTestId('token-studio-add-value'), {
      target: { value: '#abcdef' },
    })
    fireEvent.click(screen.getByTestId('token-studio-add-submit'))

    await waitFor(() => expect(onTokenSaved).toHaveBeenCalled())
    const patchCall = fetchMock.mock.calls.find((call) => {
      const [url, init] = call as unknown as [RequestInfo | URL, RequestInit | undefined]
      return String(url) === paths.routes.apiTokens && init?.method === 'PATCH'
    }) as unknown as [RequestInfo | URL, RequestInit] | undefined
    expect(patchCall).toBeTruthy()
    const body = JSON.parse(String(patchCall![1].body)) as { path: string; type: string; value: string }
    expect(body.path).toBe('color.action.tertiary')
    expect(body.type).toBe('color')
    expect(JSON.parse(body.value).digital.hex).toBe('#abcdef')
  })

  it('P82a adds a typography leaf via structured fields', async () => {
    // Starter catalog already owns typography.heading.h2 — use a free path.
    const newPath = 'typography.heading.h2p82a'
    const onTokenSaved = vi.fn()
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          ok: true,
          token: {
            path: newPath,
            type: 'typography',
            value: JSON.stringify({
              family: 'Source Serif 4',
              weight: '600',
              digital: { size: '2rem' },
            }),
            status: 'active',
          },
        }),
        { status: 200 },
      ),
    )
    globalThis.fetch = fetchMock as typeof fetch

    render(
      <AppProviders>
        <EditorTokenStudio pack={livePack} onTokenSaved={onTokenSaved} />
      </AppProviders>,
    )

    openAddSheet()
    fireEvent.click(within(screen.getByTestId('token-studio-add-type')).getByTitle('typography'))
    fireEvent.change(screen.getByTestId('token-studio-add-path'), {
      target: { value: newPath },
    })
    fireEvent.change(screen.getByTestId('token-studio-add-family'), {
      target: { value: 'Source Serif 4' },
    })
    fireEvent.change(screen.getByTestId('token-studio-add-weight'), {
      target: { value: '600' },
    })
    fireEvent.change(screen.getByTestId('token-studio-add-digital-size'), {
      target: { value: '2rem' },
    })
    fireEvent.click(screen.getByTestId('token-studio-add-submit'))

    await waitFor(() => expect(onTokenSaved).toHaveBeenCalled())
    const patchCall = fetchMock.mock.calls.find((call) => {
      const [url, init] = call as unknown as [RequestInfo | URL, RequestInit | undefined]
      return String(url) === paths.routes.apiTokens && init?.method === 'PATCH'
    }) as unknown as [RequestInfo | URL, RequestInit] | undefined
    expect(patchCall).toBeTruthy()
    const body = JSON.parse(String(patchCall![1].body)) as { path: string; type: string; value: string }
    expect(body.path).toBe(newPath)
    expect(body.type).toBe('typography')
    const value = JSON.parse(body.value) as {
      family: string
      weight: string
      digital: { size: string }
    }
    expect(value.family).toBe('Source Serif 4')
    expect(value.weight).toBe('600')
    expect(value.digital.size).toBe('2rem')
  })

  it('CT-20 edits typography from list dialog and adds shadow/asset', async () => {
    const packWithTypo: BrandTokenPackResponse = {
      ...livePack,
      tokens: [
        ...livePack.tokens,
        {
          path: 'typography.heading.h1',
          type: 'typography',
          value: JSON.stringify({
            family: 'Geist',
            weight: '400',
            digital: { size: '1rem' },
            print: { size: '10pt' },
          }),
          status: 'active',
        },
      ],
    }
    const onTokenSaved = vi.fn()
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body ?? '{}')) as {
        path: string
        type: string
        value: string
      }
      return new Response(
        JSON.stringify({
          ok: true,
          token: {
            path: body.path,
            type: body.type,
            value: body.value,
            status: 'active',
          },
        }),
        { status: 200 },
      )
    })
    globalThis.fetch = fetchMock as typeof fetch

    render(
      <AppProviders>
        <EditorTokenStudio
          pack={packWithTypo}
          catalog={[
            {
              path: 'typography.heading.h1',
              group: 'fontFamily',
              label: 'H1',
              type: 'typography',
              preview: 'Geist',
              status: 'active',
              value: packWithTypo.tokens[2]!.value,
            },
          ]}
          onTokenSaved={onTokenSaved}
        />
      </AppProviders>,
    )

    openEditDialog('typography.heading.h1')
    expect(screen.getByTestId('token-studio-edit-typography')).toBeInTheDocument()
    fireEvent.change(screen.getByTestId('token-studio-edit-family'), {
      target: { value: 'Source Serif 4' },
    })
    fireEvent.change(screen.getByTestId('token-studio-edit-digital-size'), {
      target: { value: '2.5rem' },
    })
    fireEvent.change(screen.getByTestId('token-studio-edit-line-height'), {
      target: { value: '1.2' },
    })
    fireEvent.click(screen.getByTestId('token-studio-edit-save'))
    await waitFor(() => expect(onTokenSaved).toHaveBeenCalled())
    const typoCall = fetchMock.mock.calls.find((call) => {
      const [url, init] = call as unknown as [RequestInfo | URL, RequestInit | undefined]
      return String(url) === paths.routes.apiTokens && init?.method === 'PATCH'
    }) as unknown as [RequestInfo | URL, RequestInit] | undefined
    expect(typoCall).toBeTruthy()
    const typoBody = JSON.parse(String(typoCall![1].body)) as {
      path: string
      value: string
    }
    expect(typoBody.path).toBe('typography.heading.h1')
    const typoValue = JSON.parse(typoBody.value) as {
      family: string
      digital: { size: string; lineHeight: string }
      print: { size: string }
    }
    expect(typoValue.family).toBe('Source Serif 4')
    expect(typoValue.digital.size).toBe('2.5rem')
    expect(typoValue.digital.lineHeight).toBe('1.2')
    expect(typoValue.print.size).toBe('10pt')

    onTokenSaved.mockClear()
    fetchMock.mockClear()
    openAddSheet()
    fireEvent.click(within(screen.getByTestId('token-studio-add-type')).getByTitle('shadow'))
    fireEvent.change(screen.getByTestId('token-studio-add-path'), {
      target: { value: 'shadow.elevation.md' },
    })
    fireEvent.change(screen.getByTestId('token-studio-add-offset-y'), {
      target: { value: '8px' },
    })
    fireEvent.change(screen.getByTestId('token-studio-add-blur'), {
      target: { value: '20px' },
    })
    fireEvent.change(screen.getByTestId('token-studio-add-color'), {
      target: { value: 'rgba(0,0,0,0.25)' },
    })
    fireEvent.click(screen.getByTestId('token-studio-add-submit'))
    await waitFor(() => expect(onTokenSaved).toHaveBeenCalled())
    const shadowCall = fetchMock.mock.calls.find((call) => {
      const init = call[1] as RequestInit | undefined
      return String(init?.body ?? '').includes('shadow.elevation.md')
    }) as unknown as [RequestInfo | URL, RequestInit] | undefined
    expect(shadowCall).toBeTruthy()
    const shadowBody = JSON.parse(String(shadowCall![1].body)) as { type: string; value: string }
    expect(shadowBody.type).toBe('shadow')
    expect(JSON.parse(shadowBody.value).digital.blur).toBe('20px')

    onTokenSaved.mockClear()
    fetchMock.mockClear()
    openAddSheet()
    fireEvent.click(within(screen.getByTestId('token-studio-add-type')).getByTitle('asset'))
    fireEvent.change(screen.getByTestId('token-studio-add-path'), {
      target: { value: 'logo.primary' },
    })
    fireEvent.change(screen.getByTestId('token-studio-add-src'), {
      target: { value: 'https://cdn.example/logo.svg' },
    })
    fireEvent.click(screen.getByTestId('token-studio-add-submit'))
    await waitFor(() => expect(onTokenSaved).toHaveBeenCalled())
    const assetCall = fetchMock.mock.calls.find((call) => {
      const init = call[1] as RequestInit | undefined
      return String(init?.body ?? '').includes('logo.primary')
    }) as unknown as [RequestInfo | URL, RequestInit] | undefined
    expect(assetCall).toBeTruthy()
    const assetBody = JSON.parse(String(assetCall![1].body)) as { type: string; value: string }
    expect(assetBody.type).toBe('asset')
    expect(JSON.parse(assetBody.value).digital.src).toBe('https://cdn.example/logo.svg')
  })

  it('highlightPaths shows Used filter and marks rows (SK-V16)', () => {
    render(
      <AppProviders>
        <EditorTokenStudio
          pack={livePack}
          highlightPaths={['color.action.primary']}
          onTokenSaved={vi.fn()}
        />
      </AppProviders>,
    )
    expect(screen.getByTestId('token-studio-filter-used')).toBeInTheDocument()
    expect(screen.getByTestId('token-studio-filter-used')).toHaveAttribute('data-active', 'true')
    expect(screen.getByTestId('token-studio-row-color.action.primary')).toHaveAttribute(
      'data-highlighted',
      'true',
    )
    expect(screen.getByTestId('token-studio-used-color.action.primary')).toBeInTheDocument()
    expect(screen.queryByTestId('token-studio-row-spacing.static.medium')).toBeNull()
    fireEvent.click(screen.getByTestId('token-studio-filter-used'))
    expect(screen.getByTestId('token-studio-filter-used')).toHaveAttribute('data-active', 'false')
    // Turning off used-only still keeps highlighted row marked; other groups stay collapsible.
    expect(screen.getByTestId('token-studio-row-color.action.primary')).toHaveAttribute(
      'data-highlighted',
      'true',
    )
  })
})
