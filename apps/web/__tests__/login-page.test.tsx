// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoginPage } from '../components/login-page'
import { AuthScreenLayout } from '../components/auth-screen-layout'
import { paths } from '../lib/paths'

vi.mock('../lib/user-prefs', () => ({
  useUserPrefs: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

describe('LoginPage', () => {
  it('renders credentials form when auth store is configured', () => {
    render(<LoginPage authConfigured />)
    expect(screen.getByLabelText('login.email')).toBeInTheDocument()
    expect(screen.getByLabelText('login.password')).toBeInTheDocument()
  })

  it('links to register and shows Google when enabled', () => {
    const { container } = render(<LoginPage authConfigured signupEnabled googleEnabled />)
    expect(screen.getByText('login.continueWithGoogle')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'login.register' })).toHaveAttribute(
      'href',
      paths.routes.register,
    )
    expect(container.querySelector('.creation-login__footer')).toBeTruthy()
    const { readFileSync } = require('node:fs') as typeof import('node:fs')
    const { join } = require('node:path') as typeof import('node:path')
    const css = readFileSync(join(__dirname, '../app/globals.css'), 'utf8')
    expect(css).toMatch(/\.creation-login__footer\s*\{[^}]*font-size:\s*0\.9375rem/s)
  })

  it('links to forgot-password', () => {
    render(<LoginPage authConfigured />)
    expect(screen.getByRole('link', { name: 'login.forgotPassword' })).toHaveAttribute(
      'href',
      paths.routes.forgotPassword,
    )
  })

  it('places the enlarged brand and form in a viewport-wide split layout', () => {
    const { container } = render(<LoginPage authConfigured />)
    const mark = screen.getByTestId('login-brand-mark')
    expect(mark).toBeInTheDocument()
    expect(mark.querySelector('.zaoly-seal-mark')).toBeTruthy()
    const seal = mark.querySelector('.zaoly-seal-mark') as HTMLElement
    expect(seal.style.width).toBe(`${paths.loginSplitSealSizePx}px`)
    expect(paths.loginSplitSealSizePx).toBeLessThan(160)
    expect(mark.querySelector('.creation-login__wordmark')).toHaveTextContent(paths.brandLabel)
    expect(mark.nextElementSibling).toHaveClass('creation-login__panel')
    expect(container.querySelector('.creation-login--landscape')).toBeTruthy()

    const { readFileSync } = require('node:fs') as typeof import('node:fs')
    const { join } = require('node:path') as typeof import('node:path')
    const css = readFileSync(join(__dirname, '../app/globals.css'), 'utf8')
    expect(css).toMatch(/\.creation-login--landscape\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s)
    expect(css).toMatch(
      /\.creation-login--landscape \.creation-login__wordmark\s*\{[^}]*background:\s*none;[^}]*color:\s*var\(--editor-accent/s,
    )
    expect(css).toMatch(/\.creation-login__panel \.section-chrome-title\s*\{[^}]*font-size:\s*clamp/s)
    expect(container.querySelector('.section-chrome-meta')).toBeNull()
  })

  it('renders animated vector layers only on the login layout', () => {
    const { container } = render(<LoginPage authConfigured />)
    const landscape = container.querySelector('.creation-login__landscape')
    const svg = landscape?.querySelector('svg')
    expect(container.querySelector('.creation-login--landscape')).toBeTruthy()
    expect(landscape).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('viewBox', '0 0 1600 900')
    expect(landscape?.querySelector('img')).toBeNull()
    for (const layer of ['light', 'mountain--far', 'mountain--middle', 'mist--upper', 'reflection--light', 'ripples']) {
      expect(svg?.querySelector(`.login-landscape__${layer}`)).toBeTruthy()
    }
    expect(svg?.querySelectorAll('.login-landscape__bird')).toHaveLength(3)
    expect(svg?.querySelector('.login-landscape__fish')).toBeTruthy()
    expect(svg?.querySelectorAll('.login-landscape__splash')).toHaveLength(2)

    const { readFileSync } = require('node:fs') as typeof import('node:fs')
    const { join } = require('node:path') as typeof import('node:path')
    const css = readFileSync(join(__dirname, '../app/globals.css'), 'utf8')
    expect(css).toMatch(/\.login-landscape__ripples\s*\{\s*animation:/)
    expect(css).toMatch(/\.login-landscape__birds\s*\{[\s\S]*animation: login-birds-cross/)
    expect(css).toMatch(/\.login-landscape__fish\s*\{[\s\S]*animation: login-fish-leap/)
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*\.creation-login__landscape-svg > g[\s\S]*animation: none/)

    const plain = render(<AuthScreenLayout><span>Other auth screen</span></AuthScreenLayout>)
    expect(plain.container.querySelector('.creation-login__landscape')).toBeNull()
    const registerLayout = render(
      <AuthScreenLayout landscape>
        <span>Register</span>
      </AuthScreenLayout>,
    )
    expect(registerLayout.container.querySelector('.creation-login--landscape')).toBeTruthy()
    expect((plain.container.querySelector('.zaoly-seal-mark') as HTMLElement).style.width).toBe(`${paths.loginSealSizePx}px`)
  })

  it('uses a compact lede without relying on panel top border chrome', () => {
    const { container } = render(<LoginPage authConfigured />)
    expect(container.querySelector('.creation-login__lede')).toBeTruthy()
    expect(container.querySelector('.creation-login__lede')?.textContent).toContain(
      'login.localBody',
    )
    const { readFileSync } = require('node:fs') as typeof import('node:fs')
    const { join } = require('node:path') as typeof import('node:path')
    const css = readFileSync(join(__dirname, '../app/globals.css'), 'utf8')
    expect(css).toMatch(/\.creation-login__panel[\s\S]*border-top:\s*0/)
  })

  it('keeps white label on cobalt primary submit', () => {
    const { readFileSync } = require('node:fs') as typeof import('node:fs')
    const { join } = require('node:path') as typeof import('node:path')
    const corporate = readFileSync(join(__dirname, '../css/zaoly-corporate.css'), 'utf8')
    expect(corporate).toMatch(
      /\.creation-login\s+\.ds-btn--primary[\s\S]*--editor-accent-ink/i,
    )
  })

  it('styles auth inputs as underline-only', () => {
    const { readFileSync } = require('node:fs') as typeof import('node:fs')
    const { join } = require('node:path') as typeof import('node:path')
    const css = readFileSync(join(__dirname, '../app/globals.css'), 'utf8')
    expect(css).toMatch(
      /\.creation-login\s+\.ds-input[\s\S]*border-color:\s*transparent[\s\S]*border-bottom-width:\s*1px/,
    )
    expect(css).toMatch(
      /\.creation-login\s+\.ds-input:focus-visible[\s\S]*border-bottom-color:\s*var\(--editor-accent/,
    )
  })

  it('explains bootstrap when auth store is missing', () => {
    render(<LoginPage authConfigured={false} />)
    expect(screen.getByText(/ZAOLY_DATABASE_URL/)).toBeInTheDocument()
  })
})
