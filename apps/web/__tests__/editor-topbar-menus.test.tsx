/** @vitest-environment jsdom */
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import type { SceneHistory } from '../lib/scene/history'
import {
  EditorTopbarChrome,
  type EditorToolbarProps,
} from '../components/editor/editor-toolbar'

function historyStub(): SceneHistory {
  return {
    past: [],
    present: { id: 's1', name: 'Scene', root: { id: 'r', type: 'SiteStack', name: 'Root' } },
    future: [],
  } as unknown as SceneHistory
}

function baseProps(overrides: Partial<EditorToolbarProps> = {}): EditorToolbarProps {
  return {
    t: (key) => key,
    history: historyStub(),
    saveState: 'idle',
    dirty: false,
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onSave: vi.fn(),
    pdfBusy: false,
    exportBusy: false,
    onDownloadPdf: vi.fn(),
    onSurfaceExport: vi.fn(),
    onHtmlPreviewOpen: vi.fn(),
    onCodeExportOpen: vi.fn(),
    onAssetLibraryOpen: vi.fn(),
    linterOpen: false,
    onLinterToggle: vi.fn(),
    commentsOpen: false,
    onCommentsToggle: vi.fn(),
    publishBusy: false,
    pullableMasterCount: 2,
    publishableMasterCount: 1,
    onPullFromSiteKit: vi.fn(),
    onPublishToStorybook: vi.fn(),
    onShareInvite: vi.fn(),
    shareInviteBusy: false,
    onOpenClientShare: vi.fn(),
    siteKitStorybook: 'https://site-kit-storybook.test',
    activeBreakpoint: 'desktop',
    breakpointLabels: {
      mobile: 'Mobile',
      tablet: 'Tablet',
      desktop: 'Desktop',
      print: 'Print',
    },
    onBreakpointChange: vi.fn(),
    activePrintPreset: 'a4-portrait',
    onPrintPresetChange: vi.fn(),
    zoom: 1,
    onZoomIn: vi.fn(),
    onZoomOut: vi.fn(),
    onZoomReset: vi.fn(),
    onFitCanvas: vi.fn(),
    collectionBound: true,
    ...overrides,
  }
}

describe('EditorTopbarChrome P101 thematic menus', () => {
  afterEach(() => {
    cleanup()
  })

  it('keeps primary edit + view visible and packs secondary into menus', () => {
    render(<EditorTopbarChrome {...baseProps()} />)

    expect(screen.getByTestId('editor-undo')).toBeInTheDocument()
    expect(screen.getByTestId('editor-save')).toBeInTheDocument()
    expect(screen.queryByTestId('editor-hand-tool')).toBeNull()
    expect(screen.queryByTestId('editor-back')).toBeNull()
    expect(screen.queryByTestId('editor-collection-switcher')).toBeNull()
    expect(screen.getByTestId('editor-topbar-zoom')).toBeInTheDocument()
    expect(screen.getByTestId('editor-zoom-in')).toBeInTheDocument()
    expect(screen.getByTestId('editor-fit-view')).toBeInTheDocument()

    expect(screen.getByTestId('editor-topbar-menu-export')).toBeInTheDocument()
    expect(screen.getByTestId('editor-topbar-menu-review')).toBeInTheDocument()
    expect(screen.getByTestId('editor-topbar-menu-site-kit')).toBeInTheDocument()

    expect(screen.queryByTestId('editor-download-pdf')).toBeNull()
    expect(screen.queryByTestId('editor-open-storybook')).toBeNull()
  })

  it('places Site Kit in tools (start) and Review in actions (end), zoom centered', () => {
    render(<EditorTopbarChrome {...baseProps()} />)
    const tools = screen.getByTestId('editor-topbar-tools')
    const actions = screen.getByTestId('editor-topbar-actions')
    const zoom = screen.getByTestId('editor-topbar-zoom')
    expect(within(tools).getByTestId('editor-topbar-menu-site-kit')).toBeTruthy()
    expect(within(tools).queryByTestId('editor-topbar-menu-review')).toBeNull()
    expect(within(actions).getByTestId('editor-topbar-menu-review')).toBeTruthy()
    expect(within(actions).queryByTestId('editor-topbar-menu-site-kit')).toBeNull()
    expect(within(zoom).getByTestId('editor-zoom-in')).toBeTruthy()
    const row = tools.parentElement
    expect(row?.children[0]).toBe(tools)
    expect(row?.children[1]).toBe(zoom)
    expect(row?.children[2]).toBe(actions)
  })

  it('opens Export menu items with stable test ids', () => {
    const onDownloadPdf = vi.fn()
    const onSurfaceExport = vi.fn()
    const onSavePageAsPattern = vi.fn()
    render(
      <EditorTopbarChrome
        {...baseProps({
          onDownloadPdf,
          onSurfaceExport,
          onSavePageAsPattern,
          collectionBound: true,
        })}
      />,
    )

    fireEvent.click(screen.getByTestId('editor-topbar-menu-export'))
    const menu = screen.getByRole('menu', { name: 'editor.menuExport' })
    expect(menu).toHaveAttribute('data-testid', 'ds-context-menu-portal')
    expect(document.body.contains(menu)).toBe(true)
    expect(screen.getByTestId('editor-export-png')).toBeInTheDocument()
    expect(screen.getByTestId('editor-export-pdf')).toBeInTheDocument()
    // Magazin PDF out of scope for Zaoly web design
    expect(screen.queryByTestId('editor-download-pdf')).toBeNull()
    expect(screen.getByTestId('editor-html-preview-toggle')).toBeInTheDocument()
    expect(screen.getByTestId('editor-code-export-toggle')).toBeInTheDocument()
    expect(screen.getByTestId('editor-save-page-as-pattern')).toBeInTheDocument()
    expect(screen.getByTestId('editor-save-all-pages-as-patterns')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('editor-save-page-as-pattern'))
    expect(onSavePageAsPattern).toHaveBeenCalledOnce()

    fireEvent.click(screen.getByTestId('editor-topbar-menu-export'))
    fireEvent.click(screen.getByTestId('editor-export-png'))
    expect(onSurfaceExport).toHaveBeenCalledWith('png', 'active')

    fireEvent.click(screen.getByTestId('editor-topbar-menu-export'))
    fireEvent.click(screen.getByTestId('editor-export-pdf'))
    expect(onSurfaceExport).toHaveBeenCalledWith('pdf', 'all')
    expect(onDownloadPdf).not.toHaveBeenCalled()
  })

  it('disables Save page as Pattern when Collection is unbound', () => {
    render(
      <EditorTopbarChrome
        {...baseProps({
          onSavePageAsPattern: vi.fn(),
          collectionBound: false,
        })}
      />,
    )
    fireEvent.click(screen.getByTestId('editor-topbar-menu-export'))
    expect(screen.getByTestId('editor-save-page-as-pattern')).toBeDisabled()
  })

  it('opens Site Kit menu with Share / Pull / Reset / Storybook when Collection bound', async () => {
    const onPullFromSiteKit = vi.fn()
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          viewToken: 'view.tok',
          platformProjectId: 'plx-test',
          expiresAt: new Date().toISOString(),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    render(
      <EditorTopbarChrome
        {...baseProps({
          onPullFromSiteKit,
          platformProjectId: 'plx-test',
          collectionBound: true,
        })}
      />,
    )

    fireEvent.click(screen.getByTestId('editor-topbar-menu-site-kit'))
    expect(screen.getByTestId('editor-share-menu')).toBeInTheDocument()
    expect(screen.getByTestId('editor-share-menu')).toHaveTextContent('editor.shareMenuTitle')
    expect(screen.getByTestId('editor-site-kit-pull')).toBeInTheDocument()
    expect(screen.getByTestId('editor-site-kit-reset')).toBeInTheDocument()
    expect(screen.getByTestId('editor-open-kit-playground')).toBeInTheDocument()
    expect(screen.getByTestId('editor-open-storybook')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('editor-site-kit-reset'))
    expect(onPullFromSiteKit).toHaveBeenCalledWith('reset')

    fireEvent.click(screen.getByTestId('editor-topbar-menu-site-kit'))
    fireEvent.click(screen.getByTestId('editor-open-storybook'))
    await vi.waitFor(() => {
      expect(openSpy).toHaveBeenCalled()
    })
    const href = String(openSpy.mock.calls[0]?.[0] ?? '')
    expect(href).toContain('compositions-catalog')
    expect(href).toContain('zaolyViewToken=view.tok')
    expect(href).toContain('platformProjectId=plx-test')
    expect(openSpy.mock.calls[0]?.[1]).toBe('_blank')
    openSpy.mockRestore()
    fetchSpy.mockRestore()
  })

  it('omits Share and disables Publish when Collection is unbound', () => {
    render(
      <EditorTopbarChrome
        {...baseProps({
          collectionBound: false,
          publishableMasterCount: 2,
        })}
      />,
    )
    fireEvent.click(screen.getByTestId('editor-topbar-menu-site-kit'))
    expect(screen.queryByTestId('editor-share-menu')).toBeNull()
    expect(screen.queryByText('editor.shareInviteNeedCollection')).toBeNull()
    expect(screen.getByTestId('editor-site-kit-publish')).toBeDisabled()
    expect(screen.getByTestId('editor-site-kit-pull')).toBeInTheDocument()
    expect(screen.getByTestId('editor-open-kit-playground')).toBeInTheDocument()
  })

  it('marks Review menu active when linter is open', () => {
    render(<EditorTopbarChrome {...baseProps({ linterOpen: true })} />)
    expect(screen.getByTestId('editor-topbar-menu-review')).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })
})
