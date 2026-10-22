import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import { AppProviders } from '../components/app-providers'
import { AppShell } from '../components/app-shell'
import { EditorWorkspace } from '../components/editor-workspace'
import { createLegacyFixtureScene } from '../lib/scene/demo-scene'

vi.mock('next/navigation', () => ({
  usePathname: () => '/editor',
}))

function stubAdminMe() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo) => {
      const url = String(input)
      if (url.includes('/api/me')) {
        return {
          ok: true,
          json: async () => ({ id: 'a1', email: 'admin@example.com', role: 'admin' }),
        }
      }
      return { ok: false, json: async () => ({}) }
    }),
  )
}

describe('app shell contained mode (optional)', () => {
  beforeEach(() => {
    stubAdminMe()
  })

  it('still supports contained frame + stage when requested', () => {
    render(
      <AppProviders>
        <AppShell contained titleKey="pages.kit.title" descriptionKey="pages.kit.lead">
          <div data-testid="kit-child">kit</div>
        </AppShell>
      </AppProviders>,
    )
    expect(document.querySelector('.creation-app-frame--contained')).toBeTruthy()
    expect(document.querySelector('.creation-stage--contained')).toBeTruthy()
    expect(screen.getByTestId('kit-child')).toBeTruthy()
    expect(document.querySelector('.creation-app-frame--editor')).toBeNull()
  })
})

describe('app shell immersive editor (P69)', () => {
  beforeEach(() => {
    stubAdminMe()
  })

  it('keeps shell corners and labeled hub nav bar without BrandCorner or magazine title', async () => {
    render(
      <AppProviders>
        <AppShell immersive title="Editor" description="should hide">
          <div>workspace</div>
        </AppShell>
      </AppProviders>,
    )
    expect(screen.getByText('workspace')).toBeInTheDocument()
    expect(screen.queryByTestId('brand-corner')).toBeNull()
    expect(screen.queryByTestId('creation-topbar-brand')).toBeNull()
    expect(screen.queryByTestId('product-brand')).toBeNull()
    const chrome = screen.getByTestId('zaoly-hub-chrome')
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    expect(chrome).toContainElement(nav)
    expect(screen.getByTestId('shell-corners')).toBeInTheDocument()
    expect(nav).toHaveAttribute('data-nav-labels', 'true')
    expect(nav).toHaveAttribute('data-nav-variant', 'bar')
    expect(nav).toHaveClass('creation-top-nav--bar')
    expect(screen.getByTestId('zaoly-hub-brand').querySelector('.zaoly-hub-chrome__wordmark')).toHaveTextContent(
      'Zaoly',
    )
    expect(screen.getByRole('link', { name: 'Editor' }).querySelector('.creation-top-nav__label')).toHaveTextContent(
      'Editor',
    )
    expect(screen.getByRole('link', { name: 'Compositions' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Settings' }).querySelector('.creation-top-nav__label')).toBeTruthy()
    expect(await screen.findByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin')
    expect(screen.queryByRole('heading', { name: 'Editor' })).toBeNull()
    expect(screen.queryByText('should hide')).toBeNull()
    expect(document.querySelector('.nav-rail')).toBeNull()
    expect(document.querySelector('.platform-assistant-fab')).toBeNull()
  })

  it('portals editor tools and actions into the topbar trail without a lower toolbar', () => {
    render(
      <AppProviders>
        <AppShell immersive>
          <EditorWorkspace initialScene={createLegacyFixtureScene()} />
        </AppShell>
      </AppProviders>,
    )

    const trail = screen.getByTestId('creation-topbar-trail')
    const chrome = screen.getByTestId('editor-topbar-chrome')
    const tools = screen.getByTestId('editor-topbar-tools')
    const actions = screen.getByTestId('editor-topbar-actions')
    expect(trail.contains(chrome)).toBe(true)
    expect(chrome.contains(tools)).toBe(true)
    expect(chrome.contains(actions)).toBe(true)
    expect(screen.queryByTestId('breakpoint-switcher')).toBeNull()
    expect(trail.contains(screen.getByTestId('editor-breakpoint-compare'))).toBe(true)
    expect(trail.contains(screen.getByTestId('editor-zoom-in'))).toBe(true)
    expect(trail.contains(screen.getByTestId('editor-fit-view'))).toBe(true)
    expect(trail.contains(screen.getByTestId('editor-undo'))).toBe(true)
    expect(trail.contains(screen.getByTestId('editor-save'))).toBe(true)
    expect(trail.contains(screen.getByTestId('editor-topbar-menu-export'))).toBe(true)
    expect(trail.contains(screen.getByTestId('editor-topbar-menu-review'))).toBe(true)
    expect(trail.contains(screen.getByTestId('editor-topbar-menu-site-kit'))).toBe(true)

    expect(document.querySelector('.creation-editor-toolbar')).toBeNull()
    expect(screen.queryByTestId('editor-scene-name')).toBeNull()
  })

  it('opens Site Kit Center from the topbar Site Kit menu', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_KIT_STORYBOOK', 'https://site-kit-storybook.test')
    render(
      <AppProviders>
        <AppShell immersive>
          <EditorWorkspace initialScene={createLegacyFixtureScene()} />
        </AppShell>
      </AppProviders>,
    )

    fireEvent.click(screen.getByTestId('editor-topbar-menu-site-kit'))
    const open = screen.getByTestId('editor-open-storybook')
    expect(open).toBeInTheDocument()
    expect(open).not.toBeDisabled()
    fireEvent.click(open)
    expect(screen.getByTestId('editor-storybook-dialog')).toBeInTheDocument()
    vi.unstubAllEnvs()
  })

  it('P70: topbar chrome stays single-line (nowrap + compact height)', () => {
    render(
      <AppProviders>
        <AppShell immersive>
          <EditorWorkspace initialScene={createLegacyFixtureScene()} />
        </AppShell>
      </AppProviders>,
    )

    const chrome = screen.getByTestId('editor-topbar-chrome')
    expect(chrome).toHaveClass('creation-editor-topbar-chrome')
    expect(chrome).toContainElement(screen.getByTestId('editor-topbar-tools'))
    expect(chrome).toContainElement(screen.getByTestId('editor-topbar-actions'))

    const globals = readFileSync(
      path.join(__dirname, '../app/globals.css'),
      'utf8',
    )
    expect(globals).toMatch(
      /\.creation-editor-topbar-chrome\s*\{[^}]*flex-wrap:\s*nowrap/s,
    )
    expect(globals).toMatch(
      /\.creation-editor-toolbar__tools,\s*\n\.creation-editor-toolbar__actions,\s*\n\.creation-editor-toolbar__zoom-cluster\s*\{[^}]*flex-wrap:\s*nowrap/s,
    )
    expect(globals).not.toMatch(
      /\.creation-editor-toolbar__tools::after/,
    )
    // Base chrome class still documents pill language; editor mode flattens to full-width bar.
    expect(globals).toMatch(
      /\.creation-editor-topbar-chrome\s*\{[^}]*border-radius:\s*9999px/s,
    )
    expect(globals).toMatch(
      /\.app-frame\.creation-app-frame--editor \.creation-topbar-trail\s*\{[^}]*position:\s*static/s,
    )
    expect(globals).toMatch(
      /\.app-frame\.creation-app-frame--editor \.creation-topbar-trail\s*\{[^}]*flex:\s*1 1 auto/s,
    )
  })

  it('P101: editor tool strip is full-width under hub nav bar', () => {
    const globals = readFileSync(
      path.join(__dirname, '../app/globals.css'),
      'utf8',
    )
    expect(globals).toMatch(
      /\.app-frame\.creation-app-frame--editor \.topbar\s*\{[^}]*top:\s*var\(--zaoly-hub-bar-h/s,
    )
    expect(globals).toMatch(
      /\.app-frame\.creation-app-frame--editor \.topbar\s*\{[^}]*--creation-editor-toolbar-h,\s*40px/s,
    )
    expect(globals).toMatch(
      /\.app-frame\.creation-app-frame--editor \.creation-topbar-trail__bundle\s*\{[^}]*width:\s*100%/s,
    )
    expect(globals).toMatch(
      /\.app-frame\.creation-app-frame--editor \.creation-editor-topbar-chrome\s*\{[^}]*flex:\s*1 1 auto/s,
    )
    expect(globals).toMatch(
      /\.creation-canvas-floating-hud\s*\{[^}]*border-radius:\s*9999px/s,
    )
  })

  it('P102: immersive editor topbar overlays full-bleed canvas', () => {
    const globals = readFileSync(
      path.join(__dirname, '../app/globals.css'),
      'utf8',
    )
    expect(globals).toMatch(
      /\.app-frame\.creation-app-frame--editor \.topbar\s*\{[^}]*position:\s*absolute/s,
    )
    expect(globals).toMatch(
      /\.app-frame\.creation-app-frame--editor \.topbar\s*\{[^}]*pointer-events:\s*auto/s,
    )
    expect(globals).toMatch(
      /\.app-frame\.creation-app-frame--editor \.page-body\s*\{[^}]*height:\s*100%/s,
    )
    expect(globals).toMatch(
      /--creation-editor-chrome-inset:\s*calc\(\s*var\(--zaoly-hub-bar-h/,
    )
    expect(globals).toMatch(
      /\.creation-editor-rail--docked\.creation-editor-rail--dock-left[\s\S]*?margin-top:\s*var\(--creation-editor-chrome-inset\)/,
    )
  })

  it('P105: full-width editor topbar trail is not clipped', () => {
    const globals = readFileSync(
      path.join(__dirname, '../app/globals.css'),
      'utf8',
    )
    expect(globals).toMatch(
      /\.creation-editor-topbar-chrome\s*\{[^}]*overflow:\s*visible/s,
    )
    expect(globals).toMatch(
      /\.creation-editor-topbar-chrome__row\s*\{[^}]*overflow-x:\s*auto/s,
    )
    expect(globals).toMatch(
      /\.app-frame\.creation-app-frame--editor \.creation-topbar-trail\s*\{[^}]*overflow:\s*visible/s,
    )
    expect(globals).toMatch(
      /\.app-frame\.creation-app-frame--editor \.topbar\s*\{[^}]*border-bottom:\s*1px solid/s,
    )
  })
})
