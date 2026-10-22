import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppProviders } from '../components/app-providers'
import { CompositionsHub } from '../components/compositions-hub'
import type { CompositionSummary, ProjectSummary } from '@zaoly/contracts'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

const project: ProjectSummary = {
  id: 'proj-1',
  name: 'North',
  status: 'active',
  platformProjectId: 'plx-1',
  capabilityStatus: 'in_sync',
  lastActivityAt: null,
  compositionCount: 0,
  ownerUserId: null,
}

const stubs: CompositionSummary[] = [
  {
    id: 'scene-1',
    name: 'Landing',
    updatedAt: '2026-08-10T12:00:00.000Z',
    status: 'draft',
    platformProjectId: 'plx-1',
    previewPageId: 'page-home',
  },
]

describe('compositions hub', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json(
          {
            scene: {
              id: 'scene-new',
              name: 'Hero',
              version: 1,
              platformProjectId: 'plx-1',
              root: { id: 'r', type: 'SiteStack', children: [] },
              updatedAt: '2026-08-29T00:00:00.000Z',
            },
          },
          { status: 201 },
        ),
      ),
    )
    try {
      sessionStorage.clear()
    } catch {
      /* ignore */
    }
  })

  it('lists compositions as Cards with clipped preview and opens editor', () => {
    render(
      <AppProviders>
        <CompositionsHub compositions={stubs} projects={[project]} inAppEditor />
      </AppProviders>,
    )
    expect(screen.getByText('Landing')).toBeInTheDocument()
    expect(screen.getByTestId('compositions-grid')).toBeInTheDocument()
    expect(screen.getByTestId('composition-card-scene-1')).toBeInTheDocument()
    expect(screen.getByTestId('composition-create-card')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Landing/i })).toHaveAttribute(
      'href',
      '/editor?sceneId=scene-1&platformProjectId=plx-1',
    )
    expect(document.querySelector('.ds-hub-index-card')).toBeTruthy()
    expect(document.querySelector('.ds-hub-index-layout-switch')).toBeTruthy()
    const iframe = document.querySelector(
      'iframe.creation-composition-card-preview__frame',
    ) as HTMLIFrameElement | null
    expect(iframe?.src).toContain('/api/scenes/scene-1/preview-html')
    expect(iframe?.src).toContain('pageId=page-home')
  })

  it('toggles list view', async () => {
    const user = userEvent.setup()
    render(
      <AppProviders>
        <CompositionsHub compositions={stubs} projects={[project]} inAppEditor />
      </AppProviders>,
    )
    await user.click(screen.getByRole('button', { name: /^List$/i }))
    expect(screen.getByTestId('compositions-list')).toBeInTheDocument()
  })

  it('shows create-needs-project when no projects (federated)', () => {
    render(
      <AppProviders>
        <CompositionsHub compositions={[]} projects={[]} inAppEditor />
      </AppProviders>,
    )
    expect(screen.getAllByText(/Open or sync a project first/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /Go to projects/i })).toHaveAttribute(
      'href',
      '/projects',
    )
    expect(screen.getByTestId('composition-create-card')).toBeDisabled()
  })

  it('standalone allows create without projects', async () => {
    const user = userEvent.setup()
    render(
      <AppProviders>
        <CompositionsHub compositions={[]} projects={[]} inAppEditor standalone />
      </AppProviders>,
    )
    expect(screen.getByTestId('composition-create-card')).not.toBeDisabled()
    await user.click(screen.getByTestId('composition-create-card'))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByRole('textbox'), 'Solo')
    await user.click(within(dialog).getByRole('button', { name: /Create & open/i }))
    const scenesCall = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.find(
      (c) => c[0] === '/api/scenes',
    )
    expect(scenesCall).toBeTruthy()
    const body = JSON.parse(scenesCall![1].body as string)
    expect(body.name).toBe('Solo')
    expect(body.platformProjectId == null || body.platformProjectId === null).toBe(true)
  })

  it('lists compositions when in-app editor flag is off', () => {
    render(
      <AppProviders>
        <CompositionsHub compositions={stubs} projects={[project]} />
      </AppProviders>,
    )
    expect(screen.getByText('Landing')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^CREATION Editor$/i })).not.toBeInTheDocument()
  })

  it('opens create dialog from add card and posts blank scene', async () => {
    const user = userEvent.setup()
    render(
      <AppProviders>
        <CompositionsHub compositions={[]} projects={[project]} inAppEditor />
      </AppProviders>,
    )
    await user.click(screen.getByTestId('composition-create-card'))
    const dialog = screen.getByRole('dialog')
    const nameInput = within(dialog).getByRole('textbox')
    await user.type(nameInput, 'Hero')
    await user.click(within(dialog).getByRole('button', { name: /Create & open/i }))
    const scenesCall = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.find(
      (c) => c[0] === '/api/scenes',
    )
    expect(scenesCall).toBeTruthy()
    const body = JSON.parse(scenesCall![1].body as string)
    expect(body.name).toBe('Hero')
    expect(body.platformProjectId).toBe('plx-1')
    expect(body.root?.type).toBe('SiteStack')
  })

  it('renames a composition from the card menu', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url === '/api/scenes/scene-1' && init?.method === 'PATCH') {
          return Response.json({
            scene: {
              id: 'scene-1',
              name: 'Renamed',
              version: 1,
              platformProjectId: 'plx-1',
              root: { id: 'r', type: 'SiteStack', children: [] },
              updatedAt: '2026-10-04T00:00:00.000Z',
            },
          })
        }
        return Response.json({}, { status: 404 })
      }),
    )
    render(
      <AppProviders>
        <CompositionsHub compositions={stubs} projects={[project]} inAppEditor standalone />
      </AppProviders>,
    )
    await user.click(screen.getByTestId('composition-card-menu-scene-1'))
    await user.click(screen.getByTestId('composition-menu-rename-scene-1'))
    const input = screen.getByTestId('composition-rename-input')
    await user.clear(input)
    await user.type(input, 'Renamed')
    await user.click(screen.getByTestId('composition-rename-submit'))
    expect(fetch).toHaveBeenCalledWith(
      '/api/scenes/scene-1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ name: 'Renamed' }),
      }),
    )
    expect(await screen.findByText('Renamed')).toBeInTheDocument()
  })

  it('deletes a composition from the card menu', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url === '/api/scenes/scene-1' && init?.method === 'DELETE') {
          return Response.json({ ok: true })
        }
        return Response.json({}, { status: 404 })
      }),
    )
    render(
      <AppProviders>
        <CompositionsHub compositions={stubs} projects={[project]} inAppEditor standalone />
      </AppProviders>,
    )
    expect(screen.getByTestId('composition-card-scene-1')).toBeInTheDocument()
    await user.click(screen.getByTestId('composition-card-menu-scene-1'))
    await user.click(screen.getByTestId('composition-menu-delete-scene-1'))
    await user.click(screen.getByTestId('composition-delete-confirm'))
    expect(fetch).toHaveBeenCalledWith(
      '/api/scenes/scene-1',
      expect.objectContaining({ method: 'DELETE' }),
    )
    expect(screen.queryByTestId('composition-card-scene-1')).toBeNull()
  })
})
