// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { render, screen } from '@testing-library/react'
import { AppProviders } from '../components/app-providers'
import { AdminOverviewPage } from '../components/admin-overview-page'
import { AdminSubnav } from '../components/admin-subnav'
import { paths } from '../lib/paths'

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
}))

describe('platform admin phase-1 UI', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo) => {
        const url = String(input)
        if (url.includes('/api/admin/overview')) {
          return {
            ok: true,
            json: async () => ({
              userCounts: { total: 3, admins: 1, members: 2, disabled: 0 },
              publicSignup: true,
              smtp: { configured: false, managed: false },
              sceneStore: 'postgres',
            }),
          }
        }
        return { ok: false, json: async () => ({ error: 'nope' }) }
      }),
    )
  })

  it('renders overview stats and module tiles', async () => {
    render(
      <AppProviders>
        <AdminOverviewPage />
      </AppProviders>,
    )
    expect(await screen.findByTestId('zaoly-admin-overview')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByTestId('zaoly-admin-tile-users')).toHaveAttribute(
      'href',
      paths.routes.adminUsers,
    )
    expect(screen.getByTestId('zaoly-admin-tile-mail')).toHaveAttribute(
      'href',
      paths.routes.adminMail,
    )
    expect(screen.getByTestId('zaoly-admin-tile-audit')).toHaveAttribute(
      'href',
      paths.routes.adminAudit,
    )
    expect(screen.getByTestId('zaoly-admin-tile-security')).toHaveAttribute(
      'href',
      paths.routes.adminSecurity,
    )
  })

  it('renders admin subnav to overview / users / mail', () => {
    render(
      <AppProviders>
        <AdminSubnav />
      </AppProviders>,
    )
    const nav = screen.getByTestId('zaoly-admin-subnav')
    expect(nav).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute('href', '/admin')
    expect(screen.getByRole('link', { name: 'Users' })).toHaveAttribute('href', '/admin/users')
    expect(screen.getByRole('link', { name: 'Mail' })).toHaveAttribute('href', '/admin/mail')
    expect(screen.getByRole('link', { name: 'Audit' })).toHaveAttribute('href', '/admin/audit')
    expect(screen.getByRole('link', { name: 'Security' })).toHaveAttribute(
      'href',
      '/admin/security',
    )
  })

  it('settings/users route redirects to admin users', () => {
    const src = readFileSync(
      path.join(__dirname, '../app/settings/users/page.tsx'),
      'utf8',
    )
    expect(src).toContain('redirect')
    expect(src).toContain('paths.routes.adminUsers')
  })

  it('admin page routes exist', () => {
    for (const rel of [
      '../app/admin/page.tsx',
      '../app/admin/users/page.tsx',
      '../app/admin/mail/page.tsx',
      '../app/admin/audit/page.tsx',
    ]) {
      expect(readFileSync(path.join(__dirname, rel), 'utf8')).toContain('AdminOpsShell')
    }
    expect(
      readFileSync(path.join(__dirname, '../app/admin/security/page.tsx'), 'utf8'),
    ).toContain('AdminMfaPage')
  })

  it('admin layout server-gates staff', () => {
    const src = readFileSync(path.join(__dirname, '../app/admin/layout.tsx'), 'utf8')
    expect(src).toContain('requireAdminUser')
    expect(src).toContain('redirect')
    expect(src).toContain('paths.routes.login')
  })

  it('AdminOpsShell streams staff gate under Suspense for Instant', () => {
    const src = readFileSync(
      path.join(__dirname, '../components/admin-ops-shell.tsx'),
      'utf8',
    )
    expect(src).toContain('Suspense')
    expect(src).toMatch(/export function AdminOpsShell/)
    expect(src).not.toMatch(/export async function AdminOpsShell/)
    expect(src).toContain('requireAdminUser')
  })

  it('overview omits hosted break-glass banner', async () => {
    render(
      <AppProviders>
        <AdminOverviewPage />
      </AppProviders>,
    )
    expect(await screen.findByTestId('zaoly-admin-overview')).toBeInTheDocument()
    expect(screen.queryByTestId('zaoly-admin-break-glass')).toBeNull()
  })
})

