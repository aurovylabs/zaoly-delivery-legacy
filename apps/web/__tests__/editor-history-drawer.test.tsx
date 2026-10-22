import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EditorHistoryDrawer } from '../components/editor-history-drawer'

describe('EditorHistoryDrawer', () => {
  it('offsets from the right so the docked inspect rail stays visible', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ versions: [] }),
      })),
    )
    render(
      <EditorHistoryDrawer
        isOpen
        onClose={() => {}}
        sceneId="scene-1"
        insetRight={320}
        onRestoreVersion={async () => {}}
        onCreateMilestone={() => {}}
      />,
    )
    const drawer = await screen.findByTestId('editor-history-drawer')
    expect(drawer.style.right).toBe('320px')
    expect(drawer.style.position).toBe('absolute')
  })
})
