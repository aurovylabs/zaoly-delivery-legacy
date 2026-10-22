// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EditorSceneShareDialog } from '../components/editor-scene-share-dialog'

describe('EditorSceneShareDialog', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          ownerUserId: 'owner-1',
          members: [
            {
              userId: 'm1',
              email: 'ed@example.com',
              name: 'Ed',
              role: 'editor',
              createdAt: '2026-01-01T00:00:00.000Z',
            },
          ],
        }),
      })),
    )
  })

  it('loads members when open', async () => {
    render(<EditorSceneShareDialog open sceneId="scene-1" onClose={vi.fn()} />)
    expect(await screen.findByText(/Ed · editor/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
  })
})
