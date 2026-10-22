import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { EditorClientShareDialog } from '../components/editor-client-share-dialog'

describe('EditorClientShareDialog', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ shares: [] }),
      })),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders client + invite tabs and shows password error inside dialog', async () => {
    const onError = vi.fn()
    const onInvite = vi.fn(async () => {})
    render(
      <EditorClientShareDialog
        open
        onClose={vi.fn()}
        sceneId="scene-1"
        pages={[
          { id: 'p1', name: 'Home' },
          { id: 'p2', name: 'PDP' },
        ]}
        collectionBound
        t={(key) => key}
        onInviteCollaborator={onInvite}
        inviteBusy={false}
        onStatus={vi.fn()}
        onError={onError}
      />,
    )

    expect(screen.getByTestId('editor-client-share-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('client-share-tab-client')).toBeInTheDocument()
    expect(screen.getByTestId('client-share-active-list')).toBeInTheDocument()
    expect(screen.getByTestId('client-share-active-empty')).toHaveTextContent(
      'editor.clientShareNone',
    )

    fireEvent.click(screen.getByTestId('client-share-create'))
    expect(onError).toHaveBeenCalledWith('editor.clientShareNeedPassword')
    expect(screen.getByTestId('client-share-dialog-error')).toHaveTextContent(
      'editor.clientShareNeedPassword',
    )

    fireEvent.click(screen.getByTestId('client-share-tab-invite'))
    expect(screen.getByTestId('editor-share-invite-from-dialog')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('editor-share-invite-from-dialog'))
    expect(onInvite).toHaveBeenCalled()
  })

  it('shows created URL in dialog after successful create', async () => {
    const shareUrl = 'https://creation-v3.example/share/p/crs_abc'
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (init?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({ shareUrl, id: 'share-1' }),
        }
      }
      if (url.includes('/client-shares')) {
        return { ok: true, json: async () => ({ shares: [] }) }
      }
      return { ok: true, json: async () => ({}) }
    })
    vi.stubGlobal('fetch', fetchMock)
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn(async () => undefined) },
    })

    const onStatus = vi.fn()
    render(
      <EditorClientShareDialog
        open
        onClose={vi.fn()}
        sceneId="scene-1"
        pages={[{ id: 'p1', name: 'Home' }]}
        collectionBound
        t={(key) => key}
        onInviteCollaborator={vi.fn(async () => {})}
        inviteBusy={false}
        onStatus={onStatus}
        onError={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByTestId('client-share-password-field'), {
      target: { value: 'secret-pass' },
    })
    fireEvent.click(screen.getByTestId('client-share-create'))

    await waitFor(() => {
      expect(screen.getByTestId('client-share-created-url-input')).toHaveValue(shareUrl)
    })
    expect(onStatus).toHaveBeenCalledWith('editor.clientShareOk')
  })

  it('lists existing shares with copy + revoke', async () => {
    const shareUrl = 'https://creation-v3.example/share/p/crs_existing'
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (init?.method === 'DELETE') {
        return { ok: true, json: async () => ({ share: { id: 'share-9', revoked: true } }) }
      }
      if (url.includes('/client-shares')) {
        return {
          ok: true,
          json: async () => ({
            shares: [
              {
                id: 'share-9',
                pageIds: ['p1'],
                accessMode: 'password',
                expiresAt: null,
                label: 'Review',
                revoked: false,
                createdAt: '2026-09-20T00:00:00.000Z',
                shareUrl,
              },
            ],
          }),
        }
      }
      return { ok: true, json: async () => ({}) }
    })
    vi.stubGlobal('fetch', fetchMock)
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn(async () => undefined) },
    })

    const onStatus = vi.fn()
    render(
      <EditorClientShareDialog
        open
        onClose={vi.fn()}
        sceneId="scene-1"
        pages={[{ id: 'p1', name: 'Home' }]}
        collectionBound
        t={(key) => key}
        onInviteCollaborator={vi.fn(async () => {})}
        inviteBusy={false}
        onStatus={onStatus}
        onError={vi.fn()}
      />,
    )

    await waitFor(() => {
      expect(screen.getByTestId('client-share-row-share-9')).toBeInTheDocument()
    })
    expect(screen.getByTestId('client-share-url-share-9')).toHaveValue(shareUrl)
    expect(screen.getByTestId('client-share-open-share-9')).toHaveAttribute('href', shareUrl)

    fireEvent.click(screen.getByTestId('client-share-copy-share-9'))
    await waitFor(() => {
      expect(onStatus).toHaveBeenCalledWith('editor.clientShareOk')
    })

    fireEvent.click(screen.getByTestId('client-share-revoke-share-9'))
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/client-shares/share-9'),
        expect.objectContaining({ method: 'DELETE' }),
      )
    })
    expect(onStatus).toHaveBeenCalledWith('editor.clientShareRevoked')
  })
})
