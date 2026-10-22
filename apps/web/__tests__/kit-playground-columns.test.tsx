import { describe, expect, it, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
  applyEditorPreviewSplit,
  applySidebarResize,
  clampKitColumnLayout,
  kitColumnCssVars,
  KIT_COLUMN_DEFAULTS,
  maxSidebarForBody,
  readKitColumnLayout,
  writeKitColumnLayout,
} from '../lib/site-kit/kit-playground-columns'
import { paths } from '../lib/paths'
import { KitPlayground } from '../components/kit-playground/kit-playground'

vi.mock('next/dynamic', () => ({
  default: () => {
    function MockMonaco() {
      return <pre data-testid="kit-monaco-mock" />
    }
    return MockMonaco
  },
}))

vi.mock('../lib/user-prefs', () => ({
  useUserPrefs: () => ({
    t: (key: string) => key,
    locale: 'en',
  }),
}))

vi.mock('@zaoly/site-kit', async () => {
  const actual = await vi.importActual<typeof import('@zaoly/site-kit')>(
    '@zaoly/site-kit',
  )
  return {
    ...actual,
    CompositionPreview: () => <div data-testid="kit-composition-preview-inner" />,
  }
})

describe('kit playground columns (SK-V21)', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/api/site-kit/compositions')) {
          return { ok: true, json: async () => ({ compositions: [] }) }
        }
        if (url.includes('/api/tokens')) {
          return {
            ok: true,
            json: async () => ({
              source: 'local',
              tokens: [],
              origins: {},
              canWrite: true,
            }),
          }
        }
        return { ok: false, json: async () => ({}) }
      }),
    )
  })

  it('clamps sidebar against body width so panes still fit', () => {
    expect(maxSidebarForBody(800)).toBeLessThanOrEqual(800 - 12 - 400)
    const squeezed = clampKitColumnLayout({ sidebarPx: 420, editorShare: 0.5 }, 700)
    expect(squeezed.sidebarPx + 12 + 400).toBeLessThanOrEqual(700)
    expect(applySidebarResize({ sidebarPx: 200, editorShare: 0.5 }, 2000, 900).sidebarPx).toBe(
      maxSidebarForBody(900),
    )
  })

  it('persists layout in sessionStorage', () => {
    writeKitColumnLayout({ sidebarPx: 300, editorShare: 0.4 })
    expect(sessionStorage.getItem(paths.kitPlaygroundColumnsStorageKey)).toContain('300')
    expect(readKitColumnLayout()).toEqual({ sidebarPx: 300, editorShare: 0.4 })
    expect(paths.kitPlaygroundColumnsStorageKey).toBe('zaoly.kit.playground.columns.v1')
  })

  it('applies sidebar and split resize math', () => {
    const base = { ...KIT_COLUMN_DEFAULTS }
    expect(applySidebarResize(base, 40, 1200).sidebarPx).toBe(base.sidebarPx + 40)
    const split = applyEditorPreviewSplit(base, base.sidebarPx + 6 + 400, 1200)
    expect(split.editorShare).toBeGreaterThan(0.2)
    expect(split.editorShare).toBeLessThan(0.8)
  })

  it('emits CSS vars for flex columns', () => {
    const vars = kitColumnCssVars({ sidebarPx: 240, editorShare: 0.6 })
    expect(vars['--kit-col-sidebar']).toBe('240px')
    expect(vars['--kit-col-editor-fr']).toBe('0.6')
    expect(vars['--kit-col-preview-fr']).toBe('0.4')
  })

  it('renders resize handles and updates sidebar on drag', async () => {
    sessionStorage.setItem(
      paths.kitPlaygroundColumnsStorageKey,
      JSON.stringify({ sidebarPx: 200, editorShare: 0.5 }),
    )
    render(<KitPlayground inAppEditor projects={[]} />)
    await waitFor(() => {
      expect(screen.getByTestId('kit-resize-sidebar')).toBeTruthy()
      expect(screen.getByTestId('kit-resize-split')).toBeTruthy()
    })
    const body = screen.getByTestId('kit-playground-body')
    Object.defineProperty(body, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        width: 1200,
        left: 0,
        top: 0,
        right: 1200,
        bottom: 800,
        height: 800,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }),
    })
    const handle = screen.getByTestId('kit-resize-sidebar')
    fireEvent.pointerDown(handle, { button: 0, clientX: 200, pointerId: 1 })
    fireEvent.pointerMove(handle, { button: 0, clientX: 260, pointerId: 1 })
    fireEvent.pointerUp(handle, { button: 0, clientX: 260, pointerId: 1 })
    await waitFor(() => {
      expect(body.getAttribute('style') || '').toContain('--kit-col-sidebar: 260px')
    })
    expect(readKitColumnLayout().sidebarPx).toBe(260)
  })

  it('stage and preview frame styles keep kit within container', () => {
    const cssPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../app/globals.css')
    const css = readFileSync(cssPath, 'utf8')
    expect(css).toMatch(/\.creation-stage\s*\{[^}]*max-width:\s*100%/s)
    expect(css).toMatch(/\.creation-stage\s*\{[^}]*min-width:\s*0/s)
    expect(css).toMatch(/\.creation-kit-preview-frame\s*\{[^}]*max-width:\s*100%/s)
    expect(css).toMatch(/\.creation-kit-playground__preview\s*\{[^}]*overflow-y:\s*auto/s)
  })

  it('SK-V23 kit body uses min-height 1200 and no Collection picker', async () => {
    expect(paths.kitPlaygroundBodyMinHeightPx).toBe(1200)
    const cssPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../app/globals.css')
    const css = readFileSync(cssPath, 'utf8')
    expect(css).toMatch(
      /\.creation-kit-playground__body\s*\{[^}]*min-height:\s*var\(--kit-body-min-height/s,
    )
    const pagePath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../app/kit/page.tsx')
    const page = readFileSync(pagePath, 'utf8')
    expect(page).not.toMatch(/contained/)
    render(<KitPlayground inAppEditor projects={[]} />)
    await waitFor(() => {
      expect(screen.getByTestId('kit-playground')).toBeTruthy()
    })
    expect(screen.queryByTestId('kit-collection-select')).toBeNull()
    const root = screen.getByTestId('kit-playground')
    expect(root.getAttribute('style') || '').toContain('--kit-body-min-height: 1200px')
  })
})
