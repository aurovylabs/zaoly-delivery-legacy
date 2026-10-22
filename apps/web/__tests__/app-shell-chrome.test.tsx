import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { render, screen } from '@testing-library/react'
import { AppProviders } from '../components/app-providers'
import { AppShell } from '../components/app-shell'

vi.mock('next/navigation', () => ({
  usePathname: () => '/settings',
}))

describe('app shell magazine chrome (P68)', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo) => {
        const url = String(input)
        if (url.includes('/api/me')) {
          return {
            ok: true,
            json: async () => ({
              id: 'a1',
              email: 'admin@example.com',
              role: 'admin',
            }),
          }
        }
        return { ok: false, json: async () => ({}) }
      }),
    )
  })

  it('puts blue seal + thin wordmark inside full-width theme nav bar', async () => {
    render(
      <AppProviders>
        <AppShell title="Settings">
          <div>hub</div>
        </AppShell>
      </AppProviders>,
    )
    expect(screen.getByText('hub')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.queryByTestId('creation-topbar-brand')).toBeNull()
    expect(screen.queryByTestId('product-brand')).toBeNull()
    expect(screen.queryByTestId('brand-corner')).toBeNull()

    const chrome = screen.getByTestId('zaoly-hub-chrome')
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    const brand = screen.getByTestId('zaoly-hub-brand')
    expect(chrome).toContainElement(nav)
    expect(nav).toContainElement(brand)
    expect(nav).toHaveAttribute('data-nav-variant', 'bar')
    expect(nav).toHaveClass('creation-top-nav--bar')
    expect(brand.querySelector('.zaoly-seal-mark')).toBeTruthy()
    expect(brand.querySelector('.zaoly-hub-chrome__wordmark')).toHaveTextContent('Zaoly')

    const editor = screen.getByRole('link', { name: 'Editor' })
    expect(editor).toHaveAttribute('href', '/editor')
    expect(editor.querySelector('.creation-top-nav__icon')).toBeNull()
    expect(editor.querySelector('.creation-top-nav__label')).toHaveTextContent('Editor')
    expect(screen.getByRole('link', { name: 'Settings' }).querySelector('.creation-top-nav__label')).toBeTruthy()
    const admin = await screen.findByRole('link', { name: 'Admin' })
    expect(admin).toHaveAttribute('href', '/admin')
    expect(admin.querySelector('.creation-top-nav__label')).toHaveTextContent('Admin')
    expect(admin).not.toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('aria-current', 'page')

    expect(document.querySelector('.nav-rail')).toBeNull()
    expect(screen.getByTestId('creation-topbar-trail').childElementCount).toBe(0)
    expect(document.querySelector('.platform-assistant-fab')).toBeNull()
  })

  it('primary nav pill matches editor topbar chrome sizing language', () => {
    const globals = readFileSync(path.join(__dirname, '../app/globals.css'), 'utf8')
    expect(globals).toMatch(
      /\.creation-top-nav\s*\{[^}]*min-height:\s*2\.75rem/s,
    )
    expect(globals).toMatch(
      /\.creation-top-nav\s*\{[^}]*padding:\s*6px 10px/s,
    )
    expect(globals).toMatch(
      /\.creation-editor-topbar-chrome\s*\{[^}]*min-height:\s*2\.75rem/s,
    )
    expect(globals).toMatch(
      /\.creation-editor-topbar-chrome__row\s*\{[^}]*padding:\s*6px 10px/s,
    )
  })

  it('P103: chrome elevation uses black-based shadows, not ink glow', () => {
    const globals = readFileSync(path.join(__dirname, '../app/globals.css'), 'utf8')
    const corporate = readFileSync(path.join(__dirname, '../css/zaoly-corporate.css'), 'utf8')
    expect(corporate).toMatch(/--creation-elevation-shadow:\s*var\(--editor-shadow\)|--editor-shadow:\s*0 22px 44px/)
    expect(corporate).toMatch(/--editor-shadow:\s*0 22px 44px -20px rgba\(0, 0, 0/)
    expect(globals).toMatch(/zaoly-corporate\.css/)
    expect(globals).toMatch(
      /\.creation-top-nav\s*\{[^}]*box-shadow:\s*var\(--creation-elevation-shadow\)/s,
    )
    expect(globals).toMatch(
      /\.creation-editor-topbar-chrome\s*\{[^}]*box-shadow:\s*var\(--creation-elevation-shadow\)/s,
    )
    expect(globals).toMatch(
      /\.creation-editor-rail--floating\s*\{[^}]*box-shadow:\s*var\(--creation-elevation-shadow-soft\)/s,
    )
    expect(globals).toMatch(
      /\.creation-canvas-floating-hud\s*\{[^}]*box-shadow:\s*var\(--creation-elevation-shadow\)/s,
    )
    expect(globals).not.toMatch(
      /\.creation-top-nav\s*\{[^}]*box-shadow:[^}]*var\(--ink\)/s,
    )
    expect(globals).not.toMatch(
      /\.creation-editor-topbar-chrome\s*\{[^}]*box-shadow:[^}]*var\(--ink\)/s,
    )
    expect(globals).not.toMatch(
      /\.creation-editor-rail--floating\s*\{[^}]*box-shadow:[^}]*var\(--ink\)/s,
    )
  })
})
