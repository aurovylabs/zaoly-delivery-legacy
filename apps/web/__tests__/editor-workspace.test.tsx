import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { AppProviders } from '../components/app-providers'
import { EditorWorkspace } from '../components/editor-workspace'
import { EDITOR_AUTOSAVE_DEBOUNCE_MS } from '../lib/editor-autosave'
import { INSPECT_UNSET_PLACEHOLDER, inspectFieldsForType } from '../lib/inspect/field-catalog'
import { paths } from '../lib/paths'
import { PRINT_CHIP_SURFACE_VARS } from '../lib/scene/print-chip-surface'
import { clearSceneExpandCache } from '../lib/scene/expand-cache'
import { createDemoScene, createEmptyArtboardScene, createLegacyFixtureScene } from '../lib/scene/demo-scene'
import { createZaolyDefaultLandingScene } from '../lib/scene/zaoly-default-landing-scene'
import { paletteChildForInsert } from '../lib/scene/ops'
import { resolveCatalogInsertType } from '../lib/scene/catalog-palette'
import { resolveActivePage } from '../lib/scene/scene-pages'
import { resetBreakpointCompareGhostStoreForTests } from '../lib/editor/breakpoint-compare-ghost-store'
import type { CompositionScene } from '@zaoly/contracts'

/** Seed a catalog/print type for inspect/canvas tests (not via editor palette). */
function sceneWithCatalogType(type: string): CompositionScene {
  const scene = createDemoScene()
  const page = resolveActivePage(scene)
  const resolved = resolveCatalogInsertType(type)
  const { child } = paletteChildForInsert(page.root, page.root.id, resolved)
  page.root.children = [...(page.root.children ?? []), child]
  if (scene.root?.id === page.root.id) {
    scene.root = page.root
  }
  return scene
}

function activeCanvasNode(type: string): HTMLElement {
  return document.querySelector(
    `.creation-scene-page-frame--active .creation-scene-page-frame__body [data-node-type="${type}"]`,
  ) as HTMLElement
}

function openLayersTab() {
  fireEvent.click(screen.getByTestId('editor-left-tab-layers'))
}

function openComponentsTab() {
  fireEvent.click(screen.getByTestId('editor-left-tab-components'))
}

beforeEach(() => {
  try {
    sessionStorage.removeItem('creation-editor-left-tab')
    sessionStorage.removeItem('creation-editor-panel-chrome')
    sessionStorage.removeItem('creation-editor-inspect-collapsed')
    localStorage.removeItem(paths.breakpointCompareStorageKey)
  } catch {
    /* ignore */
  }
  MockEventSource.instances = []
  clearSceneExpandCache()
  resetBreakpointCompareGhostStoreForTests()
  // Real EventSource against relative /api/scenes/.../events starves jsdom under
  // parallel vitest workers (5s render timeouts). Always stub for this file.
  vi.stubGlobal('EventSource', MockEventSource as unknown as typeof EventSource)
})

function inspectLiteralInput(inspector: HTMLElement, label: string): HTMLInputElement {
  const input = within(inspector).getByLabelText(label, { selector: 'input' })
  expect(input).toBeInstanceOf(HTMLInputElement)
  const el = input as HTMLInputElement
  expect(el.disabled).toBe(false)
  expect(el.readOnly).toBe(false)
  expect(el.placeholder).toBe(INSPECT_UNSET_PLACEHOLDER)
  return el
}

/** P76: many TokenPickers make userEvent.type too slow under the 5s default. */
function setInspectLiteral(input: HTMLInputElement, value: string) {
  fireEvent.change(input, { target: { value } })
  fireEvent.blur(input)
}

class MockEventSource {
  static instances: MockEventSource[] = []

  onerror: ((this: EventSource, ev: Event) => unknown) | null = null
  readonly listeners = new Map<string, Set<(event: MessageEvent<string>) => void>>()

  constructor(public readonly url: string) {
    MockEventSource.instances.push(this)
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    const set = this.listeners.get(type) ?? new Set<(event: MessageEvent<string>) => void>()
    const fn =
      typeof listener === 'function'
        ? (listener as (event: MessageEvent<string>) => void)
        : (event: MessageEvent<string>) => listener.handleEvent(event)
    set.add(fn)
    this.listeners.set(type, set)
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    const set = this.listeners.get(type)
    if (!set) return
    const fn =
      typeof listener === 'function'
        ? (listener as (event: MessageEvent<string>) => void)
        : (event: MessageEvent<string>) => listener.handleEvent(event)
    set.delete(fn)
  }

  close() {}

  emit(type: string, data: unknown) {
    const event = { data: JSON.stringify(data) } as MessageEvent<string>
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event)
    }
  }
}

describe('editor workspace', { timeout: 20_000 }, () => {

  it('starts with Site Kit pattern demo blocks on scene board', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createDemoScene()} />
      </AppProviders>,
    )
    expect(screen.getByTestId('creation-editor-workspace')).toBeInTheDocument()
    expect(screen.queryByTestId('editor-page-tabs')).not.toBeInTheDocument()
    openLayersTab()
    expect(screen.getByTestId('editor-pages-list')).toBeInTheDocument()
    expect(screen.getByTestId('editor-page-row-page-home')).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByText('CREATION Editor')).not.toBeInTheDocument()
    expect(screen.queryByText('Primary action')).not.toBeInTheDocument()
    expect(screen.getByText('Compose faster with Zaoly')).toBeInTheDocument()
    expect(screen.getByText('Editorial split')).toBeInTheDocument()
    expect(screen.getByText('Why Site Kit')).toBeInTheDocument()
    // Full board paint: inactive artboards stay mounted with content.
    expect(screen.getByText('Stay in touch')).toBeInTheDocument()
    expect(screen.getByText('Zaoly · Site Kit demo')).toBeInTheDocument()
    expect(screen.getByText('Get started')).toBeInTheDocument()
    expect(document.querySelector('[data-node-id="pattern-zaoly-nav"]')).toBeTruthy()
    expect(document.querySelector('[data-node-type="SiteStack"]')).toBeTruthy()
    expect(document.querySelector('[data-node-id="page-home-root"]')).toBeTruthy()
    expect(document.querySelector('[data-node-id="page-contact-root"]')).toBeTruthy()
    expect(document.querySelector('[data-page-id="page-contact"][data-page-frame-active="false"]')).toBeTruthy()
    expect(document.querySelector('[data-node-id="pattern-hero"]')).toBeTruthy()
    expect(document.querySelector('[data-node-id="pattern-editorial-split"]')).toBeTruthy()
    expect(document.querySelector('[data-node-id="pattern-features"]')).toBeTruthy()
    expect(document.querySelector('[data-node-id="pattern-form"]')).toBeTruthy()
    expect(document.querySelector('[data-node-id="pattern-footer"]')).toBeTruthy()
    expect(document.querySelector('[data-node-id="inst-hero-headline"]')).toBeTruthy()
    // Working root is a SiteStack — Flex/Appearance only (no Typography dump from generic catalog).
    expect(screen.getByText('Flex layout')).toBeInTheDocument()
    expect(screen.getByText('Appearance')).toBeInTheDocument()
    expect(screen.queryByText('Typography')).not.toBeInTheDocument()

    fireEvent.click(screen.getByTestId('editor-page-row-page-contact'))
    expect(screen.getByTestId('editor-page-row-page-contact')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Stay in touch')).toBeInTheDocument()
    expect(document.querySelector('[data-node-id="pattern-form"]')).toBeTruthy()
    expect(document.querySelector('[data-node-id="pattern-hero"]')).toBeTruthy()
    expect(document.querySelector('[data-page-id="page-home"][data-page-frame-active="false"]')).toBeTruthy()
    expect(document.querySelector('[data-page-id="page-contact"][data-page-frame-active="true"]')).toBeTruthy()

    const pad = screen.getByTestId('creation-editor-artboard-pad')
    expect(pad.className).toContain('creation-editor-canvas__pad--board')
  })

  it('paints artboard pad from root Fill literal', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createEmptyArtboardScene()} />
      </AppProviders>,
    )
    const inspector = screen.getByTestId('creation-editor-inspector')
    const fill = within(inspector).getByTestId('inspect-literal-background') as HTMLInputElement
    setInspectLiteral(fill, '#112233')
    const stack = document.querySelector(
      '.creation-scene-page-frame--active .site-stack',
    ) as HTMLElement
    expect(stack.style.backgroundColor).toBe('rgb(17, 34, 51)')
  })

  it('renders canvas Top-N and updates inspect text', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    expect(screen.getByTestId('creation-editor-workspace')).toBeInTheDocument()
    expect(screen.queryByTestId('editor-back')).toBeNull()
    expect(screen.queryByTestId('editor-collection-switcher')).toBeNull()
    expect(screen.getByLabelText(/Undo/i)).toBeInTheDocument()
    expect(screen.getByText('CREATION Editor')).toBeInTheDocument()
    expect(screen.queryByTestId('editor-promote-p1')).toBeNull()
    expect(screen.queryByTestId('editor-promote-p2')).toBeNull()
    expect(screen.queryByTestId('breakpoint-switcher')).toBeNull()
    // Default selection is title Text → sectioned inspect with typography + appearance
    expect(screen.getByDisplayValue('CREATION Editor')).toBeInTheDocument()
    expect(screen.getByText('Typography')).toBeInTheDocument()
    expect(screen.getByText('Appearance')).toBeInTheDocument()
    expect(screen.getByText('Radius')).toBeInTheDocument()
    expect(screen.getByText('Role')).toBeInTheDocument()
    expect(screen.getByText('Headline')).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /radius.lg/ })).toBeNull()
    const inspector = screen.getByTestId('creation-editor-inspector')
    // Identity strip shows Type; Id remains hidden for Top-N selection.
    expect(within(inspector).getByText('Type')).toBeInTheDocument()
    expect(within(inspector).queryByText('Id')).toBeNull()
    const helloInput = screen.getByDisplayValue('CREATION Editor')
    fireEvent.change(helloInput, {
      target: { value: 'Hello scene' },
    })
    fireEvent.blur(helloInput)
    expect(screen.getByText('Hello scene')).toBeInTheDocument()
  })

  it('shows Stack auto-layout section when root Stack is selected', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    fireEvent.click(document.querySelector('[data-node-id="root"]') as HTMLElement)
    expect(screen.getByText('Flex layout')).toBeInTheDocument()
    expect(screen.getByTestId('inspect-layout-flow')).toBeInTheDocument()
    expect(screen.getByTestId('inspect-align-bar')).toBeInTheDocument()
    expect(screen.getByTestId('inspect-gap-group')).toBeInTheDocument()
    expect(screen.getByTestId('inspect-box-model-padding')).toBeInTheDocument()
    expect(screen.queryByText('Padding top')).not.toBeInTheDocument()
    // Min/max sit behind size-box expand (compact labels minW/maxW).
    fireEvent.click(screen.getByTestId('inspect-size-box-toggle'))
    expect(screen.getByText('minW')).toBeInTheDocument()
  })

  it('shows Input placeholder field when Input node is selected', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    fireEvent.click(screen.getByPlaceholderText('email@example.com'))
    expect(screen.getByDisplayValue('email@example.com')).toBeInTheDocument()
    expect(screen.getByText('Placeholder')).toBeInTheDocument()
  })

  it('palette lists Site Kit atoms only and can add Button', async () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    const palette = screen.getByLabelText('Component palette')
    expect(within(palette).getByText('Site Kit')).toBeInTheDocument()
    expect(within(palette).queryByText('Atoms')).toBeNull()
    expect(within(palette).queryByText('Molecules')).toBeNull()
    expect(within(palette).queryByText('Organisms')).toBeNull()
    expect(within(palette).queryByText('Print')).toBeNull()
    expect(within(palette).queryByText('Mag')).toBeNull()
    expect(within(palette).getByRole('button', { name: /^Image$/i })).toBeInTheDocument()
    fireEvent.click(within(palette).getByRole('button', { name: /^Button$/i }))
    await waitFor(() => {
      expect(document.querySelector('[data-node-type="SiteButton"]')).toBeTruthy()
    })
  })

  it('palette can add SiteImage', async () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    const palette = screen.getByLabelText('Component palette')
    fireEvent.click(within(palette).getByRole('button', { name: /^Image$/i }))
    await waitFor(() => {
      expect(document.querySelector('[data-node-type="SiteImage"]')).toBeTruthy()
    })
    const img = document.querySelector('[data-node-type="SiteImage"] img') as HTMLImageElement
    expect(img?.alt).toBe('Image')
  })

  it('palette can add SiteSvg', async () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    const palette = screen.getByLabelText('Component palette')
    fireEvent.click(within(palette).getByRole('button', { name: /^Svg$/i }))
    await waitFor(() => {
      expect(document.querySelector('[data-node-type="SiteSvg"]')).toBeTruthy()
    })
    const host = document.querySelector('[data-node-type="SiteSvg"] .site-svg') as HTMLElement
    expect(host?.getAttribute('aria-label')).toBe('Graphic')
    expect(host?.innerHTML).toMatch(/<svg/i)
  })

  it('SiteSvg inspect exposes color and Promote to currentColor', async () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    const palette = screen.getByLabelText('Component palette')
    fireEvent.click(within(palette).getByRole('button', { name: /^Svg$/i }))
    await waitFor(() => {
      expect(document.querySelector('[data-node-type="SiteSvg"]')).toBeTruthy()
    })
    fireEvent.click(document.querySelector('[data-node-type="SiteSvg"]')!)
    await waitFor(() => {
      expect(screen.getByTestId('inspect-site-svg-promote-color')).toBeInTheDocument()
    })
    expect(screen.getByTestId('inspect-site-svg-edit-markup')).toBeInTheDocument()
    expect(inspectFieldsForType('SiteSvg').some((f) => f.name === 'color')).toBe(true)
    expect(inspectFieldsForType('SiteSvg').some((f) => f.name === 'mark')).toBe(true)

    fireEvent.click(screen.getByTestId('inspect-site-svg-edit-markup'))
    await waitFor(() => {
      expect(screen.getByTestId('site-svg-deep-edit-dialog')).toBeInTheDocument()
    })
    // Parseable seed SVG opens on Draw; Markup holds the textarea escape hatch.
    fireEvent.click(screen.getByRole('tab', { name: /markup/i }))
    const textarea = await screen.findByTestId('site-svg-deep-edit-textarea')
    expect((textarea as HTMLTextAreaElement).value).toMatch(/<svg/i)
    fireEvent.change(textarea, {
      target: {
        value:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="currentColor"/></svg>',
      },
    })
    fireEvent.click(screen.getByTestId('site-svg-deep-edit-apply'))
    await waitFor(() => {
      const host = document.querySelector('[data-node-type="SiteSvg"] .site-svg') as HTMLElement
      expect(host?.innerHTML).toMatch(/circle/i)
    })
  })

  it('palette Button hydrate appears in Components → In this scene', async () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    const palette = screen.getByLabelText('Component palette')
    fireEvent.click(within(palette).getByRole('button', { name: /^Button$/i }))
    await waitFor(() => {
      expect(document.querySelector('[data-node-type="SiteButton"]')).toBeTruthy()
    })
    openComponentsTab()
    const masters = await screen.findByTestId('creation-editor-masters')
    expect(within(masters).queryByText(/No Masters yet|Noch keine Masters/i)).toBeNull()
    expect(within(masters).getByText('Button')).toBeInTheDocument()
    expect(within(masters).getByText('SiteButton')).toBeInTheDocument()
  })

  it('canvas renders Chip when seeded (catalog not in palette)', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('Chip')} />
      </AppProviders>,
    )
    const digital = document.querySelector('[data-node-type="Chip"]')
    expect(digital).toBeTruthy()
    const copy = digital?.querySelector('[data-node-type="Text"]')
    expect(copy).toBeTruthy()
    expect(copy?.textContent).toMatch(/^Chip$/i)
    const palette = screen.getByLabelText('Component palette')
    expect(within(palette).queryByRole('button', { name: /^Chip$/i })).toBeNull()
  })

  it('palette can add Alert from composition list', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('Alert')} />
      </AppProviders>,
    )
    expect(document.querySelector('[data-node-type="Alert"]')).toBeTruthy()
  })

  it('palette generic catalog type ChatBlockPanel renders with alignment inspect fields', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('ChatBlockPanel')} />
      </AppProviders>,
    )
    const node = document.querySelector('[data-node-type="ChatBlockPanel"]') as HTMLElement
    expect(node).toBeTruthy()
    expect(node?.querySelector('[data-zaoly-chat-block]')).toBeTruthy()
    expect(screen.queryByTestId('scene-node-unsupported')).toBeNull()
    fireEvent.click(node)
    expect(screen.queryByTestId('editor-inspect-catalog-generic')).toBeNull()
    expect(inspectFieldsForType('ChatBlockPanel').some((f) => f.name === 'textAlign')).toBe(true)
  })

  it('palette can add Lede from molecules list', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('Lede')} />
      </AppProviders>,
    )
    expect(document.querySelector('[data-node-type="Lede"]')).toBeTruthy()
    expect(screen.getByText('42')).toBeTruthy()
    expect(screen.getAllByText('%').length).toBeGreaterThan(0)
  })

  it('palette can add PrintDonut from print types', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('PrintDonut')} />
      </AppProviders>,
    )
    expect(document.querySelector('[data-node-type="PrintDonut"]')).toBeTruthy()
    expect(screen.getByText('GEO')).toBeTruthy()
    expect(screen.getByText('72')).toBeTruthy()
    fireEvent.click(screen.getByText('GEO'))
    expect(screen.getByText('GEO').closest('[data-node-type="Text"]')).toHaveClass(
      'creation-scene-node--selected',
    )
    expect(screen.getByText('A')).toBeTruthy()
    fireEvent.click(screen.getByText('A'))
    expect(screen.getByText('A').closest('[data-node-type="Text"]')).toHaveClass(
      'creation-scene-node--selected',
    )
    expect(document.querySelector('[data-node-type="PrintDonut"]')).not.toHaveClass(
      'creation-scene-node--selected',
    )
  })

  it('palette can add KpiStrip from list layout types', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('KpiStrip')} />
      </AppProviders>,
    )
    expect(document.querySelector('[data-node-type="KpiStrip"]')).toBeTruthy()
    expect(screen.getByText('KPI A')).toBeTruthy()
    fireEvent.click(screen.getByText('KPI A'))
    expect(screen.getByText('KPI A').closest('[data-node-type="Text"]')).toHaveClass(
      'creation-scene-node--selected',
    )
  })

  it('palette can add PrintRankedList with inspectable row copy', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('PrintRankedList')} />
      </AppProviders>,
    )
    expect(document.querySelector('[data-node-type="PrintRankedList"]')).toBeTruthy()
    expect(screen.getByText('Item A')).toBeTruthy()
    fireEvent.click(screen.getByText('Item A'))
    expect(screen.getByText('Item A').closest('[data-node-type="Text"]')).toHaveClass(
      'creation-scene-node--selected',
    )
  })

  it('palette can add PrintLedger with inspectable row copy', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('PrintLedger')} />
      </AppProviders>,
    )
    expect(document.querySelector('[data-node-type="PrintLedger"]')).toBeTruthy()
    expect(screen.getByText('Strong')).toBeTruthy()
  })

  it('palette can add PrintTraitBars with inspectable trait copy', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('PrintTraitBars')} />
      </AppProviders>,
    )
    expect(document.querySelector('[data-node-type="PrintTraitBars"]')).toBeTruthy()
    expect(screen.getByText('Trust')).toBeTruthy()
    fireEvent.click(screen.getByText('Trust'))
    expect(screen.getByText('Trust').closest('[data-node-type="Text"]')).toHaveClass(
      'creation-scene-node--selected',
    )
  })

  it('palette can add DivergingBar with inspectable bar copy', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('DivergingBar')} />
      </AppProviders>,
    )
    expect(document.querySelector('[data-node-type="DivergingBar"]')).toBeTruthy()
    expect(screen.getByText('+40')).toBeTruthy()
  })

  it('palette can add PrintPage with slotted folio copy', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('PrintPage')} />
      </AppProviders>,
    )
    expect(document.querySelector('[data-node-type="PrintPage"]')).toBeTruthy()
    expect(screen.getByText('beispiel.de')).toBeTruthy()
    fireEvent.click(screen.getByText('beispiel.de'))
    expect(screen.getByText('beispiel.de').closest('[data-node-type="Text"]')).toHaveClass(
      'creation-scene-node--selected',
    )
  })

  it('palette can add PrintPullQuote from print types', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('PrintPullQuote')} />
      </AppProviders>,
    )
    expect(document.querySelector('[data-node-type="PrintPullQuote"]')).toBeTruthy()
    expect(screen.getByText('Print pull quote.')).toBeTruthy()
    expect(screen.getByText('Fazit')).toBeTruthy()
    fireEvent.click(screen.getByText('Print pull quote.'))
    expect(screen.getByText('Print pull quote.').closest('[data-node-type="Text"]')).toHaveClass(
      'creation-scene-node--selected',
    )
  })

  it('palette can add PrintPersonaGrid with inspectable card copy', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('PrintPersonaGrid')} />
      </AppProviders>,
    )
    expect(document.querySelector('[data-node-type="PrintPersonaGrid"]')).toBeTruthy()
    expect(screen.getByText('Alex Rivera')).toBeTruthy()
  })

  it('palette can add PrintCover with inspectable KPI copy', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('PrintCover')} />
      </AppProviders>,
    )
    expect(document.querySelector('[data-node-type="PrintCover"]')).toBeTruthy()
    expect(screen.getByText('GEO')).toBeTruthy()
    expect(screen.getByText('Print cover')).toBeTruthy()
    fireEvent.click(screen.getByText('Print cover'))
    expect(screen.getByText('Print cover').closest('[data-node-type="Text"]')).toHaveClass(
      'creation-scene-node--selected',
    )
    fireEvent.click(screen.getByText('Quick Check'))
    expect(screen.getByText('Quick Check').closest('[data-node-type="Text"]')).toHaveClass(
      'creation-scene-node--selected',
    )
  })

  it('palette can add PrintChapter with selectable identity copy', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('PrintChapter')} />
      </AppProviders>,
    )
    expect(document.querySelector('[data-node-type="PrintChapter"]')).toBeTruthy()
    expect(screen.getByText('Print chapter')).toBeTruthy()
    fireEvent.click(screen.getByText('Print chapter'))
    expect(screen.getByText('Print chapter').closest('[data-node-type="Text"]')).toHaveClass(
      'creation-scene-node--selected',
    )
  })

  it('palette can add PrintScoreRing with selectable digit Text', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('PrintScoreRing')} />
      </AppProviders>,
    )
    expect(document.querySelector('[data-node-type="PrintScoreRing"]')).toBeTruthy()
    const ring = document.querySelector('[data-node-type="PrintScoreRing"]') as HTMLElement
    expect(ring).toBeTruthy()
    const digit = within(ring).getByText('72')
    expect(digit.closest('.zaoly-print-ring__value')).toBeTruthy()
    fireEvent.click(digit)
    expect(digit.closest('[data-node-type="Text"]')).toHaveClass('creation-scene-node--selected')
    expect(ring).not.toHaveClass('creation-scene-node--selected')
  })

  it('palette can add PrintChip with selectable label copy', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('PrintChip')} />
      </AppProviders>,
    )
    expect(document.querySelector('[data-node-type="PrintChip"]')).toBeTruthy()
    expect(screen.getByText('Print chip')).toBeTruthy()
    fireEvent.click(screen.getByText('Print chip'))
    expect(screen.getByText('Print chip').closest('[data-node-type="Text"]')).toHaveClass(
      'creation-scene-node--selected',
    )
    const shell = document.querySelector('[data-node-type="PrintChip"]') as HTMLElement
    fireEvent.click(shell)
    expect(shell).toHaveClass('creation-scene-node--selected')
    const inspector = screen.getByTestId('creation-editor-inspector')
    expect(within(inspector).getByDisplayValue('Print chip')).toBeInTheDocument()
    fireEvent.change(within(inspector).getByDisplayValue('Print chip'), {
      target: { value: 'GEO chip' },
    })
    fireEvent.blur(within(inspector).getByDisplayValue('GEO chip'))
    expect(screen.getByText('GEO chip')).toBeInTheDocument()
  })

  it('P59 double-click Text opens inline edit that writes children', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('PrintChip')} />
      </AppProviders>,
    )
    const label = screen.getByText('Print chip')
    fireEvent.doubleClick(label)
    const editor = screen.getByTestId('creation-inline-edit')
    editor.textContent = 'GEO chip'
    fireEvent.blur(editor)
    expect(screen.getByText('GEO chip')).toBeInTheDocument()
  })

  it('double-click SiteText opens inline edit that writes children', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('SiteText')} />
      </AppProviders>,
    )
    const leaf = activeCanvasNode('SiteText')
    expect(leaf).toBeTruthy()
    fireEvent.doubleClick(leaf)
    const editor = screen.getByTestId('creation-inline-edit')
    editor.textContent = 'Canvas SiteText'
    fireEvent.blur(editor)
    expect(screen.getByText('Canvas SiteText')).toBeInTheDocument()
  })

  it('double-click SiteButton opens inline edit that writes children label', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('SiteButton')} />
      </AppProviders>,
    )
    const btn = activeCanvasNode('SiteButton')
    expect(btn).toBeTruthy()
    fireEvent.doubleClick(btn)
    const editor = screen.getByTestId('creation-inline-edit')
    editor.textContent = 'Canvas Button'
    fireEvent.blur(editor)
    expect(screen.getByText('Canvas Button')).toBeInTheDocument()
  })

  it('double-click Link opens inline edit that writes children', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('Link')} />
      </AppProviders>,
    )
    const leaf = activeCanvasNode('Link')
    expect(leaf).toBeTruthy()
    fireEvent.doubleClick(leaf)
    const editor = screen.getByTestId('creation-inline-edit')
    editor.textContent = 'Canvas Link'
    fireEvent.blur(editor)
    expect(screen.getByText('Canvas Link')).toBeInTheDocument()
  })

  it('double-click SiteLink opens inline edit that writes children', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('SiteLink')} />
      </AppProviders>,
    )
    const leaf = activeCanvasNode('SiteLink')
    expect(leaf).toBeTruthy()
    fireEvent.doubleClick(leaf)
    const editor = screen.getByTestId('creation-inline-edit')
    editor.textContent = 'Canvas SiteLink'
    fireEvent.blur(editor)
    expect(screen.getByText('Canvas SiteLink')).toBeInTheDocument()
  })

  it('double-click nested landing Instance text commits via expand-id descendants', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createZaolyDefaultLandingScene()} />
      </AppProviders>,
    )
    const headline = screen.getByText(/Compose product pages from kit atoms and tokens/i)
    fireEvent.doubleClick(headline)
    const editor = screen.getByTestId('creation-inline-edit')
    editor.textContent = 'Page-only canvas headline'
    fireEvent.blur(editor)
    expect(screen.getByText('Page-only canvas headline')).toBeInTheDocument()
    expect(screen.queryByText(/Compose product pages from kit atoms and tokens/i)).toBeNull()
  })

  it('inserts SiteTable with structure controls that add a row', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('SiteTable')} />
      </AppProviders>,
    )
    const table = activeCanvasNode('SiteTable')
    expect(table).toBeTruthy()
    fireEvent.click(table)
    expect(table).toHaveClass('creation-scene-node--selected')
    const controls = screen.getByTestId('inspect-site-table-controls')
    expect(controls).toBeInTheDocument()
    expect(controls.querySelector('svg')).toBeTruthy()
    const before = table.querySelectorAll('[data-node-type="SiteTableRow"]').length
    fireEvent.click(screen.getByTestId('inspect-site-table-add-row'))
    expect(table.querySelectorAll('[data-node-type="SiteTableRow"]').length).toBe(before + 1)
    fireEvent.click(screen.getByTestId('hud-slot-table_add_row'))
    expect(table.querySelectorAll('[data-node-type="SiteTableRow"]').length).toBe(before + 2)
    fireEvent.click(screen.getByTestId('hud-slot-table_add_column'))
    const rows = table.querySelectorAll('[data-node-type="SiteTableRow"]')
    const cellsInFirst = rows[0]?.querySelectorAll('[data-node-type="SiteTableCell"]').length ?? 0
    expect(cellsInFirst).toBeGreaterThanOrEqual(4)
  })

  it(
    'P57 types PrintChip Width and Radius as DESIGN literals (not token-only dashes)',
    () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('PrintChip')} />
      </AppProviders>,
    )
    const shell = document.querySelector('[data-node-type="PrintChip"]') as HTMLElement
    fireEvent.click(shell)
    expect(shell).toHaveClass('creation-scene-node--selected')

    const inspector = screen.getByTestId('creation-editor-inspector')
    // Size box compact label → TokenPicker aria "W token" (testid is stable).
    expect(within(inspector).getByTestId('inspect-token-width')).toBeInTheDocument()
    expect(within(inspector).getByRole('button', { name: 'Radius token' })).toBeInTheDocument()

    const width = within(inspector).getByTestId('inspect-literal-width') as HTMLInputElement
    setInspectLiteral(width, '120')
    expect(width.value).toBe('120')
    expect(shell.style.width).toBe('120px')
    expect(shell).toHaveAttribute('data-print-surface-size', 'true')
    const chip = shell.querySelector('.zaoly-print-chip') as HTMLElement
    expect(chip).toBeTruthy()
    expect(chip.style.width === '120px' || shell.style.width === '120px').toBe(true)

    const radius = inspectLiteralInput(inspector, 'Radius')
    setInspectLiteral(radius, '8')
    expect(radius.value).toBe('8')
    expect(shell).toHaveAttribute('data-print-surface-radius', 'true')
    expect(shell.style.getPropertyValue(PRINT_CHIP_SURFACE_VARS.radius)).toBe('8px')

    // borderWidth lives in the expanded Fill group (compact label "Width").
    fireEvent.click(within(inspector).getByTestId('inspect-fill-toggle'))
    expect(within(inspector).getByTestId('inspect-literal-borderWidth')).toBeInTheDocument()
    expect(within(inspector).getByTestId('inspect-fill-group')).toBeInTheDocument()
    expect(within(inspector).getAllByText('Color').length).toBeGreaterThan(0)
    expect(within(inspector).getByText('Align')).toBeInTheDocument()
    expect(inspectLiteralInput(inspector, 'Padding block')).toBeTruthy()

    const layerName = within(inspector).getByPlaceholderText('Layer name')
    expect(layerName).toBeInstanceOf(HTMLInputElement)
    expect((layerName as HTMLInputElement).readOnly).toBe(false)
    fireEvent.change(layerName, { target: { value: 'Hero chip' } })
    fireEvent.blur(layerName)
    expect((layerName as HTMLInputElement).value).toBe('Hero chip')
    const palette = screen.getByLabelText('Component palette')
    expect(within(palette).queryByText('Hero chip')).toBeNull()
    openLayersTab()
    const layers = screen.getByTestId('creation-editor-layers')
    expect(within(layers).getByText('Hero chip')).toBeInTheDocument()
  },
    15_000,
  )

  it(
    'P76 binds PrintChip Padding and Radius via TokenPicker recommendations',
    async () => {
    const user = userEvent.setup()
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('PrintChip')} />
      </AppProviders>,
    )
    const shell = document.querySelector('[data-node-type="PrintChip"]') as HTMLElement
    fireEvent.click(shell)
    expect(shell).toHaveClass('creation-scene-node--selected')

    const inspector = screen.getByTestId('creation-editor-inspector')
    const radiusTrigger = within(inspector).getByRole('button', { name: 'Radius token' })
    await user.click(radiusTrigger)
    // P77: browser list is portaled to document.body
    expect(screen.getByTestId('token-picker-search')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Suggested' })).toBeInTheDocument()
    // Starter pack radius.control.md is sharp brand `0` (not 8px).
    const radiusOption = await screen.findByRole('option', {
      name: /0(?:px)? · control\.md/i,
    })
    await user.click(radiusOption)
    const radiusStrip = within(inspector).getByTestId('inspect-literal-radius') as HTMLInputElement
    expect(radiusStrip.value).toMatch(/0(?:px)? · control\.md/i)
    expect(shell).toHaveAttribute('data-print-surface-radius', 'true')
    const radiusCss = shell.style.getPropertyValue(PRINT_CHIP_SURFACE_VARS.radius)
    expect(radiusCss === '0' || radiusCss === '0px' || radiusCss === '0mm').toBe(true)

    const paddingTrigger = within(inspector).getByRole('button', { name: 'Padding block token' })
    await user.click(paddingTrigger)
    const paddingOption = await screen.findByRole('option', {
      name: /0\.5rem · padding\.sm/i,
    })
    await user.click(paddingOption)
    const paddingStrip = within(inspector).getByTestId('inspect-literal-paddingBlock') as HTMLInputElement
    expect(paddingStrip.value).toMatch(/0\.5rem · padding\.sm/i)
  },
    15_000,
  )

  it(
    'P77 Radius TokenPicker browser cycles and keeps literal type-in',
    async () => {
    const user = userEvent.setup()
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('PrintChip')} />
      </AppProviders>,
    )
    const shell = document.querySelector('[data-node-type="PrintChip"]') as HTMLElement
    fireEvent.click(shell)

    const inspector = screen.getByTestId('creation-editor-inspector')
    const radiusTrigger = within(inspector).getByRole('button', { name: 'Radius token' })
    await user.click(radiusTrigger)
    expect(screen.getByTestId('token-picker-search')).toBeInTheDocument()
    expect(screen.getByTestId('token-picker-drag-header')).toBeInTheDocument()
    const option = await screen.findByRole('option', { name: /0(?:px)? · control\.md/i })
    await user.click(option)
    const radiusStrip = within(inspector).getByTestId('inspect-literal-radius') as HTMLInputElement
    expect(radiusStrip.value).toMatch(/0(?:px)? · control\.md/i)

    const radiusPicker = radiusTrigger.closest('.ds-token-picker') as HTMLElement
    fireEvent.mouseOver(radiusPicker)
    await user.click(within(radiusPicker).getByRole('button', { name: 'Next token' }))
    expect(radiusStrip.value).not.toMatch(/0(?:px)? · control\.md/i)

    const radiusLiteral = inspectLiteralInput(inspector, 'Radius')
    setInspectLiteral(radiusLiteral, '12')
    expect(radiusLiteral.value).toBe('12')
  },
    15_000,
  )

  it(
    'P58 types Stack Width as a DESIGN literal and paints wrap size',
    () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('Stack')} />
      </AppProviders>,
    )
    const shell = activeCanvasNode('Stack')
    fireEvent.click(shell)
    expect(shell).toHaveClass('creation-scene-node--selected')

    const inspector = screen.getByTestId('creation-editor-inspector')
    expect(within(inspector).getByTestId('inspect-token-width')).toBeInTheDocument()
    const width = within(inspector).getByTestId('inspect-literal-width') as HTMLInputElement
    setInspectLiteral(width, '160')
    expect(width.value).toBe('160')
    expect(shell.style.width).toBe('160px')
    expect(inspectLiteralInput(inspector, 'Fill')).toBeTruthy()
    expect(within(inspector).getByText('Color')).toBeInTheDocument()
    expect(within(inspector).getByText('Align self')).toBeInTheDocument()
    expect(within(inspector).queryByText('Align items')).toBeNull()
  },
    15_000,
  )

  it(
    'P58 types PrintCover Width as a DESIGN literal and paints wrap size',
    () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('PrintCover')} />
      </AppProviders>,
    )
    const shell = document.querySelector('[data-node-type="PrintCover"]') as HTMLElement
    fireEvent.click(shell)
    expect(shell).toHaveClass('creation-scene-node--selected')

    const inspector = screen.getByTestId('creation-editor-inspector')
    expect(within(inspector).getByTestId('inspect-token-width')).toBeInTheDocument()
    const width = within(inspector).getByTestId('inspect-literal-width') as HTMLInputElement
    setInspectLiteral(width, '240')
    expect(width.value).toBe('240')
    expect(shell.style.width).toBe('240px')
    // Justify/Align are a matrix bar (no standalone "Justify" label).
    const alignBar = within(inspector).getByTestId('inspect-align-bar')
    expect(within(alignBar).getByTestId('inspect-align-matrix')).toBeInTheDocument()
    expect(within(inspector).queryByRole('button', { name: /variant/i })).toBeNull()
  },
    15_000,
  )

  it('palette can add PrintTable with inspectable row copy', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('PrintTable')} />
      </AppProviders>,
    )
    expect(document.querySelector('[data-node-type="PrintTable"]')).toBeTruthy()
    expect(screen.getByText('GEO')).toBeTruthy()
    expect(screen.getByText('Metric')).toBeTruthy()
    fireEvent.click(screen.getByText('Metric'))
    expect(screen.getByText('Metric').closest('[data-node-type="Text"]')).toHaveClass(
      'creation-scene-node--selected',
    )
  })

  it('palette can add PrintPersonaCard from print types', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('PrintPersonaCard')} />
      </AppProviders>,
    )
    expect(document.querySelector('[data-node-type="PrintPersonaCard"]')).toBeTruthy()
    expect(document.querySelector('[data-node-type="PrintPage"]')).toBeTruthy()
    expect(document.querySelector('.zaoly-print-page')).toBeTruthy()
    expect(screen.getByText('Alex Rivera')).toBeTruthy()
    expect(screen.getByText('Trust')).toBeTruthy()
    expect(screen.getByText('Find reliable answers')).toBeTruthy()
    expect(screen.getByText('Ziele')).toBeTruthy()
    expect(screen.getByText('Pain Points')).toBeTruthy()
    fireEvent.click(screen.getByText('Trust'))
    expect(screen.getByText('Trust').closest('[data-node-type="Text"]')).toHaveClass(
      'creation-scene-node--selected',
    )
    fireEvent.click(screen.getByText('Find reliable answers'))
    expect(screen.getByText('Find reliable answers').closest('[data-node-type="Text"]')).toHaveClass(
      'creation-scene-node--selected',
    )
    fireEvent.click(screen.getByText('Ziele'))
    expect(screen.getByText('Ziele').closest('[data-node-type="Text"]')).toHaveClass(
      'creation-scene-node--selected',
    )
  })

  it('palette can add RankedList from list layout types', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('RankedList')} />
      </AppProviders>,
    )
    expect(document.querySelector('[data-node-type="RankedList"]')).toBeTruthy()
  })

  it('palette can add EntityCard from list layout types', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('EntityCard')} />
      </AppProviders>,
    )
    expect(document.querySelector('[data-node-type="EntityCard"]')).toBeTruthy()
    expect(document.querySelector('.ds-entity-card')).toBeTruthy()
    expect(screen.getByText('Catalog')).toBeTruthy()
    expect(screen.getByText('Entity')).toBeTruthy()
    expect(screen.getAllByRole('slider').length).toBeGreaterThan(0)
  })

  it('palette Field chrome is a selectable label child with an Input control', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('Field')} />
      </AppProviders>,
    )
    expect(document.querySelector('[data-node-type="Field"]')).toBeTruthy()
    expect(screen.getByPlaceholderText('Input')).toBeTruthy()
  })

  it('palette search filters Site Kit types by name', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    const search = screen.getByLabelText('Find component')
    fireEvent.change(search, { target: { value: 'Badge' } })
    const palette = screen.getByLabelText('Component palette')
    expect(within(palette).getByRole('button', { name: /^Badge$/i })).toBeInTheDocument()
    expect(within(palette).queryByRole('button', { name: /^Button$/i })).toBeNull()
    expect(within(palette).getByText('Site Kit')).toBeInTheDocument()
    expect(within(palette).queryByText('Molecules')).toBeNull()
    expect(within(palette).queryByText('Atoms')).toBeNull()
    expect(within(palette).queryByText('Print')).toBeNull()
  })

  it('palette can add Checkbox from forms list', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={sceneWithCatalogType('Checkbox')} />
      </AppProviders>,
    )
    expect(document.querySelector('[data-node-type="Checkbox"]')).toBeTruthy()
  })

  it('drops a Site Kit palette type onto a canvas container', async () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    const card = document.querySelector('[data-node-id="card-1"]') as HTMLElement
    expect(card).toBeTruthy()
    fireEvent.drop(card, {
      dataTransfer: {
        types: ['application/x-zaoly-component-palette-type'],
        getData: (type: string) =>
          type.includes('component-palette') || type === 'text/plain' ? 'SiteButton' : '',
        dropEffect: 'copy',
      },
    })
    await waitFor(() => {
      expect(document.querySelector('[data-node-type="SiteButton"]')).toBeTruthy()
    })
  })

  it('shows layers tree and selects from it', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    openLayersTab()
    expect(screen.getByTestId('creation-editor-layers')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('layers-panel-item-email'))
    expect(screen.getByDisplayValue('email@example.com')).toBeInTheDocument()
  })

  it('undo restores prior text after inspect edit', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    const titleInput = screen.getByDisplayValue('CREATION Editor')
    fireEvent.change(titleInput, { target: { value: 'Changed title' } })
    fireEvent.blur(titleInput)
    expect(screen.getByText('Changed title')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('editor-undo'))
    expect(screen.getByText('CREATION Editor')).toBeInTheDocument()
  })

  it('exposes Site Kit palette atoms without topbar breakpoint switcher', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    const palette = screen.getByLabelText('Component palette')
    expect(within(palette).getByRole('button', { name: /^Button$/i })).toBeInTheDocument()
    expect(within(palette).getByRole('button', { name: /^Grid$/i })).toBeInTheDocument()
    expect(within(palette).getByRole('button', { name: /^Link$/i })).toBeInTheDocument()
    expect(within(palette).getByRole('button', { name: /^Badge$/i })).toBeInTheDocument()
    expect(within(palette).getByRole('button', { name: /^Checkbox$/i })).toBeInTheDocument()
    expect(within(palette).getByRole('button', { name: /^Select$/i })).toBeInTheDocument()
    expect(within(palette).getByRole('button', { name: /^Textarea$/i })).toBeInTheDocument()
    expect(within(palette).queryByRole('button', { name: /^Heading$/i })).toBeNull()
    expect(within(palette).queryByRole('button', { name: /^Spacer$/i })).toBeNull()
    expect(within(palette).queryByRole('button', { name: /^Switch$/i })).toBeNull()
    expect(within(palette).queryByRole('button', { name: /^ChatBlockPanel$/i })).toBeNull()
    expect(screen.queryByTestId('breakpoint-switcher')).toBeNull()
  })

  it('renders selection handles for the selected node', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    expect(screen.getByTestId('selection-handles')).toBeInTheDocument()
  })

  it('exposes Design and CSS inspect tabs', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    expect(screen.getByTestId('editor-inspect-tabs')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('inspect-tab-css'))
    expect(screen.getByTestId('editor-inspect-css')).toBeInTheDocument()
    expect(screen.getByText('Resolved styles')).toBeInTheDocument()
  })

  it('creates a mobile page with 390px artboard frame', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    openLayersTab()
    fireEvent.click(screen.getByTestId('editor-page-add'))
    fireEvent.click(screen.getByTestId('editor-add-page-preset-mobile'))
    fireEvent.click(screen.getByTestId('editor-add-page-confirm'))
    const activeFrame = document.querySelector(
      '[data-page-frame-chrome="true"][data-page-frame-active="true"]',
    ) as HTMLElement | null
    expect(activeFrame).toBeTruthy()
    expect(activeFrame?.style.width).toBe('390px')
  })

  it('omits Legacy Zaoly CTA from the editor toolbar', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    expect(screen.queryByRole('button', { name: /Legacy Zaoly/i })).toBeNull()
  })

  it('deletes selection with Backspace and Escape returns to root', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    expect(screen.getByText('CREATION Editor')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Backspace' })
    expect(screen.queryByText('CREATION Editor')).not.toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.getByText('Flex layout')).toBeInTheDocument()
  })

  it('duplicates selection with Meta+D', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    fireEvent.keyDown(window, { key: 'd', metaKey: true })
    expect(screen.getAllByText('CREATION Editor').length).toBeGreaterThanOrEqual(2)
  })

  it('copies and pastes selection with Meta+C / Meta+V', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    fireEvent.keyDown(window, { key: 'c', metaKey: true })
    fireEvent.keyDown(window, { key: 'v', metaKey: true })
    expect(screen.getAllByText('CREATION Editor').length).toBeGreaterThanOrEqual(2)
  })

  it('cuts selection with Meta+X', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    expect(screen.getByText('CREATION Editor')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'x', metaKey: true })
    expect(screen.queryByText('CREATION Editor')).not.toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'v', metaKey: true })
    expect(screen.getByText('CREATION Editor')).toBeInTheDocument()
  })

  it('wraps selection with Meta+G and unwraps with Meta+Shift+G', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    expect(screen.queryByTestId('editor-wrap-stack')).toBeNull()
    expect(screen.queryByTestId('editor-wrap-grid')).toBeNull()
    expect(screen.queryByTestId('editor-unwrap')).toBeNull()
    fireEvent.keyDown(window, { key: 'g', metaKey: true })
    fireEvent.contextMenu(screen.getByTestId('creation-editor-canvas'))
    const menu = screen.getByRole('menu', { name: /context menu|kontextmenü/i })
    const unwrapItem = within(menu).getByRole('menuitem', { name: /unwrap|auspacken/i })
    expect(unwrapItem).not.toBeDisabled()
    fireEvent.click(unwrapItem)
    fireEvent.keyDown(window, { key: 'g', metaKey: true })
    fireEvent.keyDown(window, { key: 'g', metaKey: true, shiftKey: true })
    expect(screen.getByText('CREATION Editor')).toBeInTheDocument()
  })

  it('P98: opens code export dialog on Command+E keyboard shortcut', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    expect(screen.queryByTestId('editor-code-export-dialog')).toBeNull()
    fireEvent.keyDown(window, { key: 'e', metaKey: true })
    expect(screen.getByTestId('editor-code-export-dialog')).toBeInTheDocument()
  })

  it('P28: opens context menu on canvas right-click with wrap grid', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    const title = screen.getByText('CREATION Editor')
    fireEvent.contextMenu(title)
    const menu = screen.getByRole('menu', { name: /context menu|kontextmenü/i })
    expect(menu).toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: /wrap in stack|in stack wrappen/i })).toBeInTheDocument()
    const wrapGrid = within(menu).getByRole('menuitem', { name: /wrap in grid|in grid wrappen/i })
    expect(wrapGrid).not.toBeDisabled()
    fireEvent.click(wrapGrid)
    fireEvent.contextMenu(screen.getByTestId('creation-editor-canvas'))
    const menuAfter = screen.getByRole('menu', { name: /context menu|kontextmenü/i })
    expect(within(menuAfter).getByRole('menuitem', { name: /unwrap|auspacken/i })).not.toBeDisabled()
  })

  it('P28: opens context menu from layers row', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    openLayersTab()
    fireEvent.contextMenu(screen.getByTestId('layers-panel-item-title'))
    expect(screen.getByRole('menu', { name: /context menu|kontextmenü/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /wrap in stack|in stack wrappen/i })).toBeInTheDocument()
  })

  it('reorders layers with move down', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    openLayersTab()
    const moveDown = screen.getByTestId('layers-panel-move-down-title')
    expect(moveDown).not.toBeDisabled()
    fireEvent.click(moveDown)
    expect(screen.getByDisplayValue('CREATION Editor')).toBeInTheDocument()
  })

  it('P62: hub-facing demo copy has no beta', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    expect(screen.getByText('CREATION Editor')).toBeInTheDocument()
    expect(screen.queryByText(/beta/i)).toBeNull()
  })

  it('P62: marks dirty on edit and clears after save', async () => {
    const scene = createLegacyFixtureScene()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        if (url.includes('/api/scenes') && init?.method === 'PUT') {
          const body = JSON.parse(String(init.body))
          return {
            ok: true,
            json: async () => ({ scene: body }),
          }
        }
        return { ok: true, status: 204, json: async () => null }
      }),
    )
    render(
      <AppProviders>
        <EditorWorkspace initialScene={scene} />
      </AppProviders>,
    )
    expect(screen.getByTestId('editor-save-status')).toHaveAttribute('data-dirty', 'false')
    const dirtyInput = screen.getByDisplayValue('CREATION Editor')
    fireEvent.change(dirtyInput, { target: { value: 'Dirty scene' } })
    fireEvent.blur(dirtyInput)
    expect(screen.getByTestId('editor-save-status')).toHaveAttribute('data-dirty', 'true')
    fireEvent.click(screen.getByTestId('editor-save'))
    await waitFor(() => {
      expect(screen.getByTestId('editor-save-status')).toHaveAttribute('data-save-state', 'saved')
      expect(screen.getByTestId('editor-save-status')).toHaveAttribute('data-dirty', 'false')
    })
    await waitFor(() => {
      expect(document.querySelector('.ds-toast--ok .ds-toast-message')?.textContent).toMatch(
        /Scene saved\.|Szene gespeichert\./,
      )
    })
    vi.unstubAllGlobals()
  })

  it('P69: does not render scene name input in toolbar', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    expect(screen.queryByTestId('editor-scene-name')).toBeNull()
    expect(document.querySelector('.creation-editor-toolbar__name')).toBeNull()
    expect(screen.getByTestId('editor-topbar-tools')).toBeInTheDocument()
    expect(screen.getByTestId('editor-topbar-actions')).toBeInTheDocument()
  })

  it('P62/P75: left rail tabs switch palette, layers, and tokens', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    expect(screen.getByTestId('editor-left-tabs')).toBeInTheDocument()
    expect(screen.getByTestId('creation-editor-palette')).toBeInTheDocument()
    expect(screen.queryByTestId('creation-editor-layers')).toBeNull()
    openLayersTab()
    expect(screen.getByTestId('creation-editor-layers')).toBeInTheDocument()
    expect(screen.queryByTestId('creation-editor-palette')).toBeNull()
    fireEvent.click(screen.getByTestId('editor-left-tab-tokens'))
    expect(screen.getByTestId('creation-editor-token-studio')).toBeInTheDocument()
    expect(screen.getByTestId('token-studio-status').textContent).toMatch(/read-only|nur lesen/i)
  })

  it('P64: left palette search subtracts horizontal margins from width:100%', () => {
    const css = readFileSync(path.resolve(__dirname, '../app/globals.css'), 'utf8')
    expect(css).toMatch(
      /\.creation-editor-palette\s+\.search-input\s*\{[^}]*width:\s*calc\(100%\s*-\s*1\.5rem\)/s,
    )
    expect(css).toMatch(
      /\.creation-editor-components\s*\{[^}]*overflow-x:\s*hidden/s,
    )
  })

  it('P62: pages + token studio row type match layers label density', () => {
    const css = readFileSync(path.resolve(__dirname, '../app/globals.css'), 'utf8')
    expect(css).toMatch(
      /\.creation-editor-layers\.ds-layers-panel\s+\.ds-layers-panel__label\s*\{[^}]*font-size:\s*0\.6875rem/s,
    )
    expect(css).toMatch(
      /\.creation-editor-pages-list__row\s*\{[^}]*font-size:\s*0\.6875rem/s,
    )
    expect(css).toMatch(
      /\.creation-editor-token-studio__path\s*\{[^}]*font-size:\s*0\.6875rem/s,
    )
    expect(css).toMatch(
      /\.creation-editor-token-studio__preview,\s*\n\.creation-editor-token-studio__typo-summary\s*\{[^}]*font-size:\s*0\.5625rem/s,
    )
  })

  it('P62: layers multi-select marks secondary ids', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    const title = document.querySelector('[data-node-id="title"]') as HTMLElement
    const email = document.querySelector('[data-node-id="email"]') as HTMLElement
    fireEvent.click(title)
    fireEvent.click(email, { shiftKey: true })
    openLayersTab()
    // Primary is last toggled (email); title is secondary multi highlight.
    expect(screen.getByTestId('layers-panel-item-title')).toHaveAttribute('data-multi-selected', 'true')
    expect(screen.getByTestId('layers-panel-item-title')).toHaveClass('ds-layers-panel__btn--multi-selected')
    expect(screen.getByTestId('layers-panel-item-email')).not.toHaveAttribute('data-multi-selected')
    expect(screen.getByTestId('layers-panel-item-email')).toHaveClass('ds-layers-panel__btn--selected')
  })

  it('P63: autosave fires after dirty debounce and clears dirty', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/api/scenes') && init?.method === 'PUT') {
        const body = JSON.parse(String(init.body))
        return {
          ok: true,
          json: async () => ({ scene: body }),
        }
      }
      return { ok: true, status: 204, json: async () => null }
    })
    vi.stubGlobal('fetch', fetchMock)
    try {
      render(
        <AppProviders>
          <EditorWorkspace initialScene={createLegacyFixtureScene()} />
        </AppProviders>,
      )
      const autosaveInput = screen.getByDisplayValue('CREATION Editor')
      fireEvent.change(autosaveInput, { target: { value: 'Autosave scene' } })
      fireEvent.blur(autosaveInput)
      expect(screen.getByTestId('editor-save-status')).toHaveAttribute('data-dirty', 'true')
      const putCalls = () =>
        fetchMock.mock.calls.filter(
          ([input, init]) => String(input).includes('/api/scenes') && init?.method === 'PUT',
        )
      expect(putCalls()).toHaveLength(0)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(EDITOR_AUTOSAVE_DEBOUNCE_MS)
      })
      await act(async () => {
        await Promise.resolve()
      })
      expect(putCalls().length).toBeGreaterThan(0)
      expect(screen.getByTestId('editor-save-status')).toHaveAttribute('data-dirty', 'false')
      expect(screen.getByTestId('editor-save-status')).toHaveAttribute('data-save-state', 'saved')
    } finally {
      vi.useRealTimers()
      vi.unstubAllGlobals()
    }
  })

  it('P63: ⌘S still saves while dirty without waiting for autosave', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/api/scenes') && init?.method === 'PUT') {
        const body = JSON.parse(String(init.body))
        return {
          ok: true,
          json: async () => ({ scene: body }),
        }
      }
      return { ok: true, status: 204, json: async () => null }
    })
    vi.stubGlobal('fetch', fetchMock)
    const putCalls = () =>
      fetchMock.mock.calls.filter(
        ([input, init]) => String(input).includes('/api/scenes') && init?.method === 'PUT',
      )
    try {
      render(
        <AppProviders>
          <EditorWorkspace initialScene={createLegacyFixtureScene()} />
        </AppProviders>,
      )
      const manualInput = screen.getByDisplayValue('CREATION Editor')
      fireEvent.change(manualInput, { target: { value: 'Manual save scene' } })
      fireEvent.blur(manualInput)
      fireEvent.keyDown(window, { key: 's', metaKey: true })
      await act(async () => {
        await Promise.resolve()
      })
      expect(putCalls()).toHaveLength(1)
      expect(screen.getByTestId('editor-save-status')).toHaveAttribute('data-dirty', 'false')
      await act(async () => {
        await vi.advanceTimersByTimeAsync(EDITOR_AUTOSAVE_DEBOUNCE_MS + 50)
      })
      expect(putCalls()).toHaveLength(1)
    } finally {
      vi.useRealTimers()
      vi.unstubAllGlobals()
    }
  })

  it('WS-2: trailing autosave runs after slow in-flight save when still dirty', async () => {
    vi.useFakeTimers()
    let releaseFirstSave: (() => void) | undefined
    const firstSaveGate = new Promise<void>((resolve) => {
      releaseFirstSave = resolve
    })
    let putCount = 0
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.includes('/api/scenes') && init?.method === 'PUT') {
        putCount += 1
        const body = JSON.parse(String(init.body))
        if (putCount === 1) {
          await firstSaveGate
        }
        return {
          ok: true,
          json: async () => ({ scene: body }),
        }
      }
      return { ok: true, status: 204, json: async () => null }
    })
    vi.stubGlobal('fetch', fetchMock)
    try {
      render(
        <AppProviders>
          <EditorWorkspace initialScene={createLegacyFixtureScene()} />
        </AppProviders>,
      )
      const textInput = screen.getByDisplayValue('CREATION Editor')
      fireEvent.change(textInput, { target: { value: 'First revision' } })
      fireEvent.blur(textInput)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(EDITOR_AUTOSAVE_DEBOUNCE_MS)
      })
      expect(putCount).toBe(1)
      fireEvent.change(textInput, { target: { value: 'Second revision during save' } })
      fireEvent.blur(textInput)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(EDITOR_AUTOSAVE_DEBOUNCE_MS)
      })
      expect(putCount).toBe(1)
      await act(async () => {
        releaseFirstSave?.()
        await Promise.resolve()
        await Promise.resolve()
        await Promise.resolve()
      })
      expect(putCount).toBeGreaterThanOrEqual(2)
      const lastCall = fetchMock.mock.calls.filter(
        ([input, init]) => String(input).includes('/api/scenes') && init?.method === 'PUT',
      ).at(-1)
      const lastBody = JSON.parse(String(lastCall?.[1]?.body))
      expect(JSON.stringify(lastBody)).toContain('Second revision during save')
      expect(screen.getByTestId('editor-save-status')).toHaveAttribute('data-dirty', 'false')
    } finally {
      vi.useRealTimers()
      vi.unstubAllGlobals()
    }
  })

  it('P63: palette drag-over paints drop label and validity attrs', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    const root = document.querySelector('[data-node-id="root"]') as HTMLElement
    expect(root).toBeTruthy()
    const dt = {
      types: ['application/x-zaoly-component-palette-type'],
      dropEffect: 'none',
      effectAllowed: 'copy',
      getData: () => 'SiteButton',
      setData: () => undefined,
    }
    fireEvent.dragOver(root, { dataTransfer: dt as unknown as DataTransfer })
    expect(root).toHaveAttribute('data-drop-edge')
    expect(root).toHaveAttribute('data-drop-valid', 'true')
    expect(root.getAttribute('data-drop-label')).toMatch(/Drop /)
  })

  it('P62: toolbar exposes shortcut titles and fit control (no hand-tool button)', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    // P104: ChromeTip uses Tooltip + aria-label (native title stripped).
    expect(screen.getByTestId('editor-undo')).toHaveAttribute('aria-label', expect.stringMatching(/⌘|Ctrl/))
    expect(screen.getByTestId('editor-save')).toHaveAttribute('aria-label', expect.stringMatching(/⌘|Ctrl/))
    expect(screen.getByTestId('editor-fit-view')).toBeInTheDocument()
    expect(screen.queryByTestId('editor-hand-tool')).toBeNull()
  })

  it('P62: shows breakpoint override banner on tablet page', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    expect(screen.queryByTestId('editor-bp-override-banner')).toBeNull()
    openLayersTab()
    fireEvent.click(screen.getByTestId('editor-page-add'))
    fireEvent.click(screen.getByTestId('editor-add-page-preset-tablet'))
    fireEvent.click(screen.getByTestId('editor-add-page-confirm'))
    expect(screen.getByTestId('editor-bp-override-banner')).toBeInTheDocument()
  })

  it('P62: inspect sections collapse and filter', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    expect(screen.getByTestId('editor-inspect-filter')).toBeInTheDocument()
    const appearance = screen.getByTestId('editor-inspect-section-appearance')
    expect(appearance).toHaveAttribute('data-open', 'true')
    fireEvent.click(within(appearance).getByRole('button', { name: /Appearance/i }))
    expect(appearance).toHaveAttribute('data-open', 'false')
    fireEvent.click(within(appearance).getByRole('button', { name: /Appearance/i }))
    fireEvent.change(screen.getByTestId('editor-inspect-filter'), { target: { value: 'radius' } })
    expect(screen.getByText('Radius')).toBeInTheDocument()
    expect(screen.queryByText('Role')).toBeNull()
  })

  it('P62: CSS peek empty copy is readable', async () => {
    const user = userEvent.setup()
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    await user.click(screen.getByRole('tab', { name: /^CSS$/i }))
    expect(screen.getByTestId('editor-inspect-css')).toBeInTheDocument()
    // Demo title has token bindings so may have content; empty path still covered by locale string presence
    const emptyOrCopy =
      screen.queryByTestId('editor-inspect-css-empty') || screen.queryByTestId('editor-inspect-css-copy')
    expect(emptyOrCopy).toBeTruthy()
  })

  it('P64: undock left rail sets data-rail-mode floating and persists chrome', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    const left = screen.getByTestId('creation-editor-left')
    expect(left).toHaveAttribute('data-rail-mode', 'docked')
    fireEvent.click(screen.getByTestId('editor-rail-undock-left'))
    const floating = screen.getByTestId('creation-editor-left')
    expect(floating).toHaveAttribute('data-rail-mode', 'floating')
    expect(screen.getByTestId('editor-rail-minimize-left')).toBeInTheDocument()
    expect(screen.queryByTestId('editor-rail-dock-left')).toBeNull()
    const stored = sessionStorage.getItem('creation-editor-panel-chrome')
    expect(stored).toBeTruthy()
    expect(JSON.parse(stored!).leftMode).toBe('floating')
    fireEvent.keyDown(window, { key: '[' })
    expect(screen.getByTestId('creation-editor-left')).toHaveAttribute('data-rail-mode', 'docked')
  })

  it('P64: floating minimize collapses body and persists', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    fireEvent.click(screen.getByTestId('editor-rail-undock-left'))
    const floating = screen.getByTestId('creation-editor-left')
    expect(floating).toHaveAttribute('data-minimized', 'false')
    fireEvent.click(screen.getByTestId('editor-rail-minimize-left'))
    expect(screen.getByTestId('creation-editor-left')).toHaveAttribute('data-minimized', 'true')
    expect(screen.getByTestId('creation-editor-left').querySelector('.creation-editor-rail__body')).toBeNull()
    expect(screen.queryByTestId('editor-rail-resize-left-e')).toBeNull()
    expect(JSON.parse(sessionStorage.getItem('creation-editor-panel-chrome')!).leftMinimized).toBe(true)
    fireEvent.click(screen.getByTestId('editor-rail-minimize-left'))
    expect(screen.getByTestId('creation-editor-left')).toHaveAttribute('data-minimized', 'false')
    expect(screen.getByTestId('creation-editor-left').querySelector('.creation-editor-rail__body')).toBeTruthy()
  })

  it('P65: docked left rail exposes resize handle and persists size', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    const left = screen.getByTestId('creation-editor-left')
    expect(screen.getByTestId('editor-rail-resize-left-e')).toBeInTheDocument()
    expect(left.style.getPropertyValue('--rail-dock-size')).toBe('256px')
    const handle = screen.getByTestId('editor-rail-resize-left-e')
    fireEvent.pointerDown(handle, { button: 0, clientX: 256, clientY: 200, pointerId: 7 })
    fireEvent.pointerMove(handle, { clientX: 336, clientY: 200, pointerId: 7 })
    fireEvent.pointerUp(handle, { pointerId: 7 })
    const stored = sessionStorage.getItem('creation-editor-panel-chrome')
    expect(stored).toBeTruthy()
    // jsdom body width is often 0 so clamp hits widthMin; still proves resize write path.
    expect(typeof JSON.parse(stored!).leftSize).toBe('number')
    expect(JSON.parse(stored!).leftSize).not.toBe(256)
  })

  it('P65: floating left rail exposes resize handles on all edges and corners', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    fireEvent.click(screen.getByTestId('editor-rail-undock-left'))
    expect(screen.getByTestId('creation-editor-left')).toHaveAttribute('data-rail-mode', 'floating')
    for (const axis of ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw'] as const) {
      expect(screen.getByTestId(`editor-rail-resize-left-${axis}`)).toBeInTheDocument()
    }
  })

  it('P66: legacy top edge session chrome migrates to home left', () => {
    sessionStorage.setItem(
      'creation-editor-panel-chrome',
      JSON.stringify({
        leftMode: 'docked',
        rightMode: 'docked',
        leftEdge: 'top',
        rightEdge: 'right',
        leftFloat: null,
        rightFloat: null,
        leftSize: 220,
        rightSize: 320,
        leftMinimized: false,
        rightMinimized: false,
      }),
    )
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    const left = screen.getByTestId('creation-editor-left')
    expect(left).toHaveAttribute('data-rail-mode', 'docked')
    expect(left).toHaveAttribute('data-rail-edge', 'left')
    expect(screen.queryByTestId('editor-dock-top')).toBeNull()
    expect(screen.queryByTestId('editor-dock-bottom')).toBeNull()
  })

  it('P74: [ toggles left rail undock/redock and persists chrome', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    fireEvent.keyDown(window, { key: '[' })
    const floating = screen.getByTestId('creation-editor-left')
    expect(floating).toHaveAttribute('data-rail-mode', 'floating')
    expect(JSON.parse(sessionStorage.getItem('creation-editor-panel-chrome')!).leftMode).toBe(
      'floating',
    )
    fireEvent.keyDown(window, { key: '[' })
    expect(screen.getByTestId('creation-editor-left')).toHaveAttribute('data-rail-mode', 'docked')
  })

  it('P74: \\ redocks both floating rails', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    fireEvent.keyDown(window, { key: '[' })
    fireEvent.keyDown(window, { key: ']' })
    expect(screen.getByTestId('creation-editor-left')).toHaveAttribute('data-rail-mode', 'floating')
    expect(screen.getByTestId('creation-editor-right')).toHaveAttribute('data-rail-mode', 'floating')
    fireEvent.keyDown(window, { key: '\\' })
    expect(screen.getByTestId('creation-editor-left')).toHaveAttribute('data-rail-mode', 'docked')
    expect(screen.getByTestId('creation-editor-right')).toHaveAttribute('data-rail-mode', 'docked')
  })

  it('P64: inspect section collapse persists in sessionStorage', () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    const appearance = screen.getByTestId('editor-inspect-section-appearance')
    expect(appearance).toHaveAttribute('data-open', 'true')
    fireEvent.click(within(appearance).getByRole('button', { name: /Appearance/i }))
    expect(appearance).toHaveAttribute('data-open', 'false')
    const raw = sessionStorage.getItem('creation-editor-inspect-collapsed')
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw!).appearance).toBe(true)
  })

  it('shows Components left tab with Insert + In this scene Masters', async () => {
    render(
      <AppProviders>
        <EditorWorkspace initialScene={createLegacyFixtureScene()} />
      </AppProviders>,
    )
    expect(screen.getByTestId('editor-left-tab-components')).toBeInTheDocument()
    expect(screen.queryByTestId('editor-left-tab-palette')).toBeNull()
    expect(screen.queryByTestId('editor-left-tab-masters')).toBeNull()
    openComponentsTab()
    expect(screen.getByTestId('creation-editor-components')).toBeInTheDocument()
    expect(screen.getByTestId('creation-editor-components-insert')).toBeInTheDocument()
    expect(screen.getByTestId('creation-editor-components-scene')).toBeInTheDocument()
    const masters = screen.getByTestId('creation-editor-masters')
    expect(masters).toBeInTheDocument()
    expect(within(masters).queryByText(/No Masters yet|Noch keine Masters/i)).toBeNull()
    expect(within(masters).getByText('SiteButton')).toBeInTheDocument()
    expect(within(masters).getByText('Button')).toBeInTheDocument()

    const card = document.querySelector('[data-node-id="card-1"]') as HTMLElement
    expect(card).toBeTruthy()
    fireEvent.click(card)
    expect(screen.getByTestId('editor-create-master-btn')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('editor-create-master-btn'))

    openComponentsTab()
    expect(screen.getByTestId('creation-editor-masters')).toBeInTheDocument()
    expect(screen.queryByText(/No Masters yet|Noch keine Masters/i)).toBeNull()

    fireEvent.click(document.querySelector('[data-node-id="card-1"]') as HTMLElement)
    expect(screen.getByTestId('editor-instance-banner')).toBeInTheDocument()
    expect(screen.getByTestId('editor-detach-instance-btn')).toBeInTheDocument()
  })

  it('shows pages list and switches active page (P81 board)', () => {
    const demo = createLegacyFixtureScene()
    const contactRoot = { ...demo.root, id: 'page-contact-root', name: 'Contact' }
    const scene = {
      ...demo,
      pages: [
        { id: 'page-home', name: 'Home', root: demo.root },
        { id: 'page-contact', name: 'Contact', root: contactRoot },
      ],
      activePageId: 'page-home',
      root: demo.root,
    }
    render(
      <AppProviders>
        <EditorWorkspace initialScene={scene} />
      </AppProviders>,
    )
    openLayersTab()
    expect(screen.getByTestId('editor-pages-list')).toBeInTheDocument()
    expect(screen.getByTestId('editor-page-row-page-home')).toHaveAttribute('aria-selected', 'true')
    expect(document.querySelector('[data-node-id="page-contact-root"]')).toBeTruthy()
    fireEvent.click(screen.getByTestId('editor-page-row-page-contact'))
    expect(screen.getByTestId('editor-page-row-page-contact')).toHaveAttribute('aria-selected', 'true')
    expect(document.querySelector('[data-node-id="page-contact-root"]')).toBeTruthy()
  })

  it('reloads clean editor state on remote scene-updated event', async () => {
    const remoteScene = structuredClone(createLegacyFixtureScene())
    remoteScene.updatedAt = '2026-08-24T09:00:00.000Z'
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/presence')) {
        return {
          ok: true,
          json: async () => ({ ok: true, users: [], selfUserId: 'test-user' }),
        }
      }
      if (url.includes('/api/scenes/') && !url.includes('/ops') && !url.includes('/events')) {
        return { ok: true, json: async () => ({ scene: remoteScene }) }
      }
      return { ok: true, status: 204, json: async () => null }
    })
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('EventSource', MockEventSource as unknown as typeof EventSource)
    try {
      render(
        <AppProviders>
          <EditorWorkspace initialScene={createLegacyFixtureScene()} />
        </AppProviders>,
      )
      const es = MockEventSource.instances.find((instance) =>
        instance.listeners.has('scene-updated'),
      )
      expect(es?.url).toContain('/api/scenes/')
      remoteScene.root.children = remoteScene.root.children?.map((child) =>
        child.id === 'title'
          ? { ...child, props: { ...(child.props ?? {}), children: 'Remote sync title' } }
          : child,
      ) ?? []
      act(() => {
        es!.emit('scene-updated', {
          type: 'scene-updated',
          sceneId: remoteScene.id,
          updatedAt: remoteScene.updatedAt,
          platformProjectId: null,
          source: 'scene_ops',
        })
      })
      await waitFor(() => {
        expect(screen.getByText('Remote sync title')).toBeInTheDocument()
      })
      expect(screen.queryByTestId('editor-remote-update-notice')).toBeNull()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('shows reload notice instead of overwriting dirty local state on remote scene-updated', async () => {
    const initial = createLegacyFixtureScene()
    const remoteScene = {
      ...initial,
      updatedAt: '2026-08-24T09:05:00.000Z',
    }
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/presence')) {
        return {
          ok: true,
          json: async () => ({ ok: true, users: [], selfUserId: 'test-user' }),
        }
      }
      if (url.includes('/api/scenes/') && !url.includes('/ops') && !url.includes('/events')) {
        return { ok: true, json: async () => ({ scene: remoteScene }) }
      }
      return { ok: true, status: 204, json: async () => null }
    })
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('EventSource', MockEventSource as unknown as typeof EventSource)
    try {
      render(
        <AppProviders>
          <EditorWorkspace initialScene={initial} />
        </AppProviders>,
      )
      const input = screen.getByDisplayValue('CREATION Editor')
      fireEvent.change(input, { target: { value: 'Dirty local title' } })
      fireEvent.blur(input)
      const es = MockEventSource.instances.find((instance) =>
        instance.listeners.has('scene-updated'),
      )
      act(() => {
        es!.emit('scene-updated', {
          type: 'scene-updated',
          sceneId: initial.id,
          updatedAt: remoteScene.updatedAt,
          platformProjectId: null,
          source: 'scene_put',
        })
      })
      expect(await screen.findByTestId('editor-remote-update-notice')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Dirty local title')).toBeInTheDocument()
      const sceneFetchCalls = fetchMock.mock.calls.filter(
        ([input]) =>
          String(input).includes('/api/scenes/') &&
          !String(input).includes('/ops') &&
          !String(input).includes('/presence') &&
          !String(input).includes('/events'),
      )
      expect(sceneFetchCalls).toHaveLength(0)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

