import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EditorHtmlPreviewDialog } from '../components/editor-html-preview-dialog'

vi.mock('../lib/user-prefs', () => ({
  useUserPrefs: () => ({
    t: (key: string) => key,
  }),
}))

describe('EditorHtmlPreviewDialog', () => {
  it('exposes a resizable dialog chrome for HTML preview', () => {
    render(
      <EditorHtmlPreviewDialog
        open
        onClose={() => undefined}
        sceneId="scene-1"
        pageId="page-1"
        baseUpdatedAt="2026-08-26T00:00:00.000Z"
        dirty={false}
        onSceneImported={() => undefined}
      />,
    )
    const dialog = screen.getByTestId('editor-html-preview-dialog')
    expect(dialog).toHaveAttribute('data-resizable', 'true')
    expect(dialog.className).toContain('creation-editor-html-preview-dialog')
  })
})
