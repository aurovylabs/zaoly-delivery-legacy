import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ClientShareGuestPins } from '../components/client-page-share/client-share-guest-pins'
import { ClientSharePreviewStage } from '../components/client-page-share/client-share-preview-stage'
import { createGuestComment } from '../lib/client-page-share/guest-comments'

describe('client share spatial guest comments (P7)', () => {
  it('creates guest comments with pin coordinates', () => {
    const made = createGuestComment({
      pageId: 'p1',
      authorName: 'Alex',
      body: 'Move logo',
      allowedPageIds: ['p1'],
      pinX: 120.4,
      pinY: 80.6,
    })
    expect(made.ok).toBe(true)
    if (!made.ok) return
    expect(made.comment.pinX).toBe(120)
    expect(made.comment.pinY).toBe(81)
  })

  it('rejects incomplete pin pairs', () => {
    const made = createGuestComment({
      pageId: 'p1',
      authorName: 'Alex',
      body: 'x',
      allowedPageIds: ['p1'],
      pinX: 10,
    })
    expect(made.ok).toBe(false)
  })

  it('renders pins and posts a new pin draft', () => {
    const onPlace = vi.fn()
    render(
      <div style={{ width: 400, height: 300, position: 'relative' }}>
        <ClientShareGuestPins
          comments={[
            {
              id: 'c1',
              authorName: 'Sam',
              body: 'Hello',
              createdAt: '2026-09-20T00:00:00.000Z',
              pinX: 40,
              pinY: 60,
            },
          ]}
          pinMode
          authorName="Alex"
          onAuthorNameChange={vi.fn()}
          onPlace={onPlace}
          onExitPinMode={vi.fn()}
        />
      </div>,
    )

    expect(screen.getByTestId('client-share-pin-c1')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('client-share-guest-pins'))
    expect(screen.getByTestId('client-share-pin-draft')).toBeInTheDocument()
    fireEvent.change(screen.getByTestId('client-share-pin-body'), {
      target: { value: 'Tighten spacing' },
    })
    fireEvent.click(screen.getByTestId('client-share-pin-submit'))
    expect(onPlace).toHaveBeenCalledWith(
      expect.objectContaining({ body: 'Tighten spacing' }),
    )
  })

  it('opens pin popover on pointerdown without requiring pin mode', () => {
    render(
      <div style={{ width: 400, height: 300, position: 'relative' }}>
        <ClientShareGuestPins
          comments={[
            {
              id: 'c1',
              authorName: 'Sam',
              body: 'Hello from client',
              createdAt: '2026-09-20T00:00:00.000Z',
              pinX: 40,
              pinY: 60,
              replies: [
                {
                  id: 'rep_1',
                  author: 'designer',
                  body: 'Fixed in next pass',
                  createdAt: '2026-09-20T01:00:00.000Z',
                },
              ],
            },
          ]}
          pinMode={false}
          authorName=""
          onAuthorNameChange={vi.fn()}
          onPlace={vi.fn()}
          onExitPinMode={vi.fn()}
        />
      </div>,
    )

    const pin = screen.getByTestId('client-share-pin-c1')
    fireEvent.pointerDown(pin, { button: 0 })
    expect(screen.getByTestId('client-share-pin-popover-c1')).toBeInTheDocument()
    expect(screen.getByText('Hello from client')).toBeInTheDocument()
    expect(screen.getByTestId('client-share-pin-replies-c1')).toBeInTheDocument()
    expect(screen.getByText('Fixed in next pass')).toBeInTheDocument()
    fireEvent.pointerDown(pin, { button: 0 })
    expect(screen.queryByTestId('client-share-pin-popover-c1')).not.toBeInTheDocument()
  })

  it('does not start drag-pan when pointerdown hits a pin bubble', () => {
    render(
      <div style={{ width: 800, height: 600 }}>
        <ClientSharePreviewStage
          htmlSrc="/api/public/client-shares/crs_x/html?pageId=p1"
          pageTitle="Demo"
          artboard={{ width: 1280, height: 800 }}
          comments={[
            {
              id: 'c1',
              authorName: 'Sam',
              body: 'Pinned',
              createdAt: '2026-09-20T00:00:00.000Z',
              pinX: 80,
              pinY: 90,
            },
          ]}
          authorName=""
          onAuthorNameChange={vi.fn()}
          onPlaceComment={vi.fn()}
        />
      </div>,
    )

    const stage = screen.getByTestId('client-share-preview-stage')
    fireEvent.pointerDown(screen.getByTestId('client-share-pin-c1'), {
      button: 0,
      clientX: 120,
      clientY: 140,
    })
    expect(stage).toHaveAttribute('data-dragging', 'false')
    expect(screen.getByTestId('client-share-pin-popover-c1')).toBeInTheDocument()
  })

  it('mounts preview stage with drag-pan camera and pin mode hook', () => {
    const zoomRef = { current: null as null | { togglePinMode: () => void; fit: () => void } }
    render(
      <div style={{ width: 800, height: 600 }}>
        <ClientSharePreviewStage
          htmlSrc="/api/public/client-shares/crs_x/html?pageId=p1"
          pageTitle="Demo"
          artboard={{ width: 1280, height: 800 }}
          comments={[]}
          authorName=""
          onAuthorNameChange={vi.fn()}
          onPlaceComment={vi.fn()}
          zoomControlsRef={zoomRef as never}
        />
      </div>,
    )

    const stage = screen.getByTestId('client-share-preview-stage')
    expect(stage).toHaveClass('creation-share-preview-stage')
    expect(screen.getByTestId('client-share-canvas')).toHaveClass('creation-editor-canvas')
    expect(screen.getByTestId('client-share-frame')).toHaveStyle({ pointerEvents: 'none' })
    expect(zoomRef.current).toBeTruthy()
    expect(typeof zoomRef.current?.togglePinMode).toBe('function')

    fireEvent.pointerDown(screen.getByTestId('client-share-canvas'), {
      button: 0,
      clientX: 100,
      clientY: 100,
    })
    expect(stage).toHaveAttribute('data-dragging', 'true')
  })

  it('preview CSS keeps light DS pad and no dark invert', () => {
    const css = readFileSync(join(__dirname, '../app/globals.css'), 'utf8')
    expect(css).toMatch(
      /\.creation-share-preview-canvas\.ds-canvas-viewport\s+\.ds-canvas-viewport__stage\s*\{[^}]*overflow:\s*hidden/s,
    )
    expect(css).toMatch(
      /\.creation-share-preview-stage\s*\{[^}]*background:\s*var\(--bg0/s,
    )
    expect(css).not.toMatch(
      /\.creation-share-preview-canvas\.ds-canvas-viewport\s*\{[^}]*background-color:\s*#0a0a0b/s,
    )
  })
})
