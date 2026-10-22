import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { EditorAssetLibraryDialog } from '../components/editor-asset-library-dialog'

afterEach(() => {
  cleanup()
})

describe('EditorAssetLibraryDialog', () => {
  it('stays mounted when closed so open can showModal without Strict Mode race', () => {
    const onClose = vi.fn()
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
    })
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open')
      this.dispatchEvent(new Event('close'))
    })

    const { rerender } = render(
      <EditorAssetLibraryDialog open={false} onClose={onClose} onApplyAsset={vi.fn()} />,
    )
    expect(screen.getByTestId('editor-asset-library-dialog')).toBeTruthy()
    expect(screen.getByTestId('editor-asset-library-dialog').hasAttribute('open')).toBe(false)

    rerender(<EditorAssetLibraryDialog open onClose={onClose} onApplyAsset={vi.fn()} />)
    expect(screen.getByTestId('editor-asset-library-dialog').hasAttribute('open')).toBe(true)
    expect(onClose).not.toHaveBeenCalled()

    const closeBtns = screen.getAllByRole('button', { name: 'Close' })
    fireEvent.click(closeBtns[0]!)
    expect(onClose).toHaveBeenCalled()
  })

  it('uses flexible wide dialog CSS with scrollable auto-fill gallery', () => {
    const css = readFileSync(resolve(__dirname, '../app/globals.css'), 'utf8')
    expect(css).toMatch(
      /\.creation-editor-asset-library-dialog\.ds-dialog\s*\{[^}]*width:\s*min\(92vw,\s*64rem\)/s,
    )
    expect(css).toMatch(
      /\.creation-editor-asset-library-dialog__gallery\s*\{[^}]*min-height:\s*12rem/s,
    )
    expect(css).toMatch(
      /\.creation-editor-asset-library-dialog__grid\s*\{[^}]*auto-fill[^}]*minmax\(9\.5rem/s,
    )

    render(<EditorAssetLibraryDialog open onClose={vi.fn()} onApplyAsset={vi.fn()} />)
    expect(screen.getByTestId('asset-grid-container').className).toContain(
      'creation-editor-asset-library-dialog__gallery',
    )
  })

  it('composes zaoly-ui primitives (Input, Chip, Card) instead of raw chrome', () => {
    const src = readFileSync(
      resolve(__dirname, '../components/editor-asset-library-dialog.tsx'),
      'utf8',
    )
    expect(src).toMatch(/FilterRow/)
    expect(src).toMatch(/ScrollArea/)
    expect(src).toMatch(/EmptyState/)
    expect(src).toMatch(/className="search-input"/)
    expect(src).not.toMatch(/style=\{\{/)

    render(<EditorAssetLibraryDialog open onClose={vi.fn()} onApplyAsset={vi.fn()} />)
    const search = screen.getByTestId('asset-search-input')
    expect(search.className).toMatch(/ds-input/)
    expect(search.className).toMatch(/search-input/)
    expect(screen.getByTestId('asset-cat-all').className).toMatch(/ds-chip/)
    expect(screen.getByTestId('asset-upload-btn').className).toMatch(/ds-btn/)
    const firstCard = document.querySelector('[data-testid^="asset-card-"]')
    expect(firstCard?.className).toMatch(/ds-card/)
    expect(firstCard?.querySelector('.ds-card__media')).toBeTruthy()
    expect(firstCard?.querySelector('.ds-card__title')).toBeTruthy()
  })

  it('keeps asset cards image-first with compact caption CSS', () => {
    const css = readFileSync(resolve(__dirname, '../app/globals.css'), 'utf8')
    expect(css).toMatch(
      /\.creation-editor-asset-library-dialog__card \.ds-card__media\s*\{[^}]*aspect-ratio:\s*4\s*\/\s*3/s,
    )
    expect(css).toMatch(
      /\.creation-editor-asset-library-dialog__card \.ds-card__title\s*\{[^}]*font-size:\s*0\.625rem/s,
    )
  })

  it('exposes Collection media (VIDEON) category and empty state without Collection', () => {
    render(<EditorAssetLibraryDialog open onClose={vi.fn()} onApplyAsset={vi.fn()} />)
    const chip = screen.getByTestId('asset-cat-videon')
    expect(chip.textContent).toMatch(/Collection media \(VIDEON\)/)
    fireEvent.click(chip)
    expect(screen.getByTestId('asset-videon-empty').textContent).toMatch(/Bind this composition/i)
  })

  it('applies VIDEON still with videonMediaRef when Collection is bound', async () => {
    const collectionId = '550e8400-e29b-41d4-a716-446655440000'
    const onApply = vi.fn()
    const frameUrl =
      '/api/videon-media/media-1/frame?platformProjectId=550e8400-e29b-41d4-a716-446655440000&t=1000&w=240'
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            source: 'videon',
            platformProjectId: collectionId,
            items: [
              {
                id: 'media-1',
                originalFilename: 'hero.mp4',
                mimeType: 'video/mp4',
                lifecycleState: 'ready',
                durationMs: 5000,
                sceneCount: 1,
                frameUrl,
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    render(
      <EditorAssetLibraryDialog
        open
        onClose={vi.fn()}
        onApplyAsset={onApply}
        platformProjectId={collectionId}
        targetMode="image"
      />,
    )
    fireEvent.click(screen.getByTestId('asset-cat-videon'))
    const card = await screen.findByTestId('asset-card-videon-media-1')
    fireEvent.click(card)
    fireEvent.click(screen.getByTestId('asset-apply-image-btn'))
    expect(onApply).toHaveBeenCalledTimes(1)
    const [url, mode, meta] = onApply.mock.calls[0]!
    expect(mode).toBe('image')
    expect(url).toContain('/api/videon-media/media-1/frame')
    expect(url).toContain(collectionId)
    expect(meta?.videonMediaRef).toBeTruthy()
    const ref = JSON.parse(meta.videonMediaRef as string)
    expect(ref).toMatchObject({
      source: 'videon',
      mediaAssetId: 'media-1',
      platformProjectId: collectionId,
      kind: 'frame',
    })
    vi.unstubAllGlobals()
  })
})
