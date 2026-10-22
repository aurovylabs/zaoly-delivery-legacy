import { cleanup, render, screen, fireEvent } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ChatOverlay } from './ChatOverlay'

afterEach(() => {
  cleanup()
})

describe('ChatOverlay', () => {
  it('renders nothing when closed', () => {
    render(
      <ChatOverlay open={false} onOpenChange={() => {}} title="Assistant">
        Body
      </ChatOverlay>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens dock-end sheet with dialog role', () => {
    render(
      <ChatOverlay open onOpenChange={() => {}} title="Assistant" placement="dock-end">
        Body
      </ChatOverlay>,
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveClass('chat-overlay-sheet-dock-end')
    expect(screen.getByText('Body')).toBeInTheDocument()
  })

  it('documents dock-end default width token in stylesheet contract', async () => {
    const { readFileSync } = await import('node:fs')
    const { fileURLToPath } = await import('node:url')
    const { dirname, join } = await import('node:path')
    const here = dirname(fileURLToPath(import.meta.url))
    const css = readFileSync(join(here, '../css/chat.css'), 'utf8')
    expect(css).toMatch(
      /\.chat-overlay-sheet-dock-end\s*\{[^}]*width:\s*var\(--chat-overlay-sheet-width,\s*min\(32rem,\s*100%\)\)/s,
    )
    expect(css).toContain('.chat-overlay-resize')
    expect(css).toMatch(/background:\s*var\(--panel,\s*var\(--bg1\)\)/)
  })

  it('declares ReactNode return type for cross-package @types/react consumers', async () => {
    const { readFileSync } = await import('node:fs')
    const { fileURLToPath } = await import('node:url')
    const { dirname, join } = await import('node:path')
    const here = dirname(fileURLToPath(import.meta.url))
    const src = readFileSync(join(here, 'ChatOverlay.tsx'), 'utf8')
    expect(src).toMatch(/\}: ChatOverlayProps\): ReactNode \{/)
  })

  it('renders a dock-end resize handle by default', () => {
    render(
      <ChatOverlay open onOpenChange={() => {}} title="Assistant" placement="dock-end">
        Body
      </ChatOverlay>,
    )
    expect(screen.getByRole('slider', { name: 'Resize chat panel' })).toBeInTheDocument()
  })

  it('widens the sheet when dragging the resize handle', () => {
    render(
      <ChatOverlay
        open
        onOpenChange={() => {}}
        title="Assistant"
        placement="dock-end"
        defaultWidth={400}
        widthStorageKey={null}
      >
        Body
      </ChatOverlay>,
    )
    const dialog = screen.getByRole('dialog')
    const handle = screen.getByRole('slider', { name: 'Resize chat panel' })
    fireEvent.pointerDown(handle, { button: 0, clientX: 800, pointerId: 1 })
    fireEvent.pointerMove(handle, { clientX: 700, pointerId: 1 })
    fireEvent.pointerUp(handle, { clientX: 700, pointerId: 1 })
    expect(dialog).toHaveStyle({ '--chat-overlay-sheet-width': '500px' })
  })

  it('widens the sheet with keyboard arrows on the resize handle', () => {
    render(
      <ChatOverlay
        open
        onOpenChange={() => {}}
        title="Assistant"
        placement="dock-end"
        defaultWidth={400}
        widthStorageKey={null}
      >
        Body
      </ChatOverlay>,
    )
    const dialog = screen.getByRole('dialog')
    const handle = screen.getByRole('slider', { name: 'Resize chat panel' })
    fireEvent.keyDown(handle, { key: 'ArrowLeft' })
    expect(dialog).toHaveStyle({ '--chat-overlay-sheet-width': '416px' })
  })

  it('omits resize handle when resizable is false', () => {
    render(
      <ChatOverlay
        open
        onOpenChange={() => {}}
        title="Assistant"
        placement="dock-end"
        resizable={false}
      >
        Body
      </ChatOverlay>,
    )
    expect(screen.queryByRole('slider', { name: 'Resize chat panel' })).not.toBeInTheDocument()
  })

  it('docs MDX binds Meta to stories (Organisms sidebar, not components/)', async () => {
    const { readFileSync } = await import('node:fs')
    const { fileURLToPath } = await import('node:url')
    const { dirname, join } = await import('node:path')
    const here = dirname(fileURLToPath(import.meta.url))
    const mdx = readFileSync(join(here, 'ChatOverlay.mdx'), 'utf8')
    expect(mdx).toContain("<Meta of={Stories} />")
    expect(mdx).toContain("from './ChatOverlay.stories'")
    expect(mdx).toContain('ComposedPanel')
  })

  it('uses center placement without dock-end class', () => {
    render(
      <ChatOverlay open onOpenChange={() => {}} title="Assistant" placement="center">
        Center body
      </ChatOverlay>,
    )
    expect(screen.getByRole('dialog')).not.toHaveClass('chat-overlay-sheet-dock-end')
  })

  it('closes on backdrop click and Esc', () => {
    const onOpenChange = vi.fn()
    const onClose = vi.fn()
    const { rerender } = render(
      <ChatOverlay open onOpenChange={onOpenChange} onClose={onClose} title="Assistant">
        Body
      </ChatOverlay>,
    )
    fireEvent.click(screen.getByLabelText('Close chat overlay'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onClose).toHaveBeenCalled()

    onOpenChange.mockClear()
    onClose.mockClear()
    rerender(
      <ChatOverlay open onOpenChange={onOpenChange} onClose={onClose} title="Assistant">
        Body
      </ChatOverlay>,
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onClose).toHaveBeenCalled()
  })

  it('closes from header control', () => {
    const onOpenChange = vi.fn()
    render(
      <ChatOverlay open onOpenChange={onOpenChange} title="Assistant">
        Body
      </ChatOverlay>,
    )
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
