import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AppProviders } from '../components/app-providers'
import { ProjectEditDialog } from '../components/project-edit-dialog'
import { paths } from '../lib/paths'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

describe('ProjectEditDialog', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        if (url.includes('/api/auth/session')) {
          return new Response(JSON.stringify({ user: { id: 'user-1' } }), { status: 200 })
        }
        if (url === paths.routes.apiProject('proj-1') && init?.method === 'PATCH') {
          return new Response(
            JSON.stringify({
              id: 'proj-1',
              name: 'Renamed',
              description: 'Updated',
              status: 'active',
              platformProjectId: 'plx-1',
              capabilityStatus: 'in_sync',
              lastActivityAt: null,
              compositionCount: 0,
              ownerUserId: null,
            }),
            { status: 200 },
          )
        }
        return new Response(JSON.stringify({ error: 'unexpected' }), { status: 500 })
      }),
    )
  })

  it('PATCHes name and description on save', async () => {
    const onSaved = vi.fn()
    const onClose = vi.fn()
    const fetchMock = vi.mocked(fetch)

    render(
      <AppProviders>
        <ProjectEditDialog
          open
          project={{ id: 'proj-1', name: 'North', description: 'Old' }}
          onClose={onClose}
          onSaved={onSaved}
        />
      </AppProviders>,
    )

    fireEvent.change(screen.getByLabelText(/project name/i), {
      target: { value: 'Renamed' },
    })
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Updated' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        paths.routes.apiProject('proj-1'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ name: 'Renamed', description: 'Updated' }),
        }),
      )
    })
    await waitFor(() => {
      expect(onSaved).toHaveBeenCalled()
      expect(onClose).toHaveBeenCalled()
    })
  })
})
