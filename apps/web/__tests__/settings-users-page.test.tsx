// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { render, screen } from '@testing-library/react'
import { AppProviders } from '../components/app-providers'
import { SettingsUsersPage } from '../components/settings-users-page'

describe('SettingsUsersPage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo) => {
        const url = String(input)
        if (url.includes('/api/admin/smtp')) {
          return {
            ok: true,
            json: async () => ({
              configured: false,
              source: 'none',
              host: null,
              port: 587,
              user: null,
              from: null,
              fromName: 'Zaoly',
              tls: 'starttls',
              passwordSet: false,
              dbEnabled: false,
            }),
          }
        }
        if (url.includes('/api/admin/users') && !url.includes('invite')) {
          return {
            ok: true,
            json: async () => ({
              users: [
                {
                  id: 'u1',
                  email: 'admin@example.com',
                  name: 'Ada',
                  role: 'admin',
                  disabled: false,
                  createdAt: '2026-01-01T00:00:00.000Z',
                  lastLoginAt: null,
                  hasPassword: true,
                  hasGoogle: false,
                  ownedSceneCount: 2,
                  lastLoginAt: '2026-10-01T12:00:00.000Z',
                },
              ],
              nextCursor: null,
            }),
          }
        }
        if (url.includes('force-password-reset')) {
          return { ok: true, json: async () => ({ ok: true, emailSent: true }) }
        }
        return { ok: false, json: async () => ({ error: 'nope' }) }
      }),
    )
  })

  it('lists users from the admin API in Zaoly hub chrome', async () => {
    render(
      <AppProviders>
        <SettingsUsersPage />
      </AppProviders>,
    )
    expect(await screen.findByText('Ada')).toBeInTheDocument()
    expect(screen.getByText(/admin@example.com/)).toBeInTheDocument()
    expect(screen.getByText(/Scenes: 2/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Invite' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset password' })).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Search' })).toBeInTheDocument()
    expect(screen.getByTestId('zaoly-users-hub')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Users' })).toBeNull()
  })

  it('uses the DS barrel and CD tokens, not raw @zaoly/ui or --zaoly-* vars', () => {
    const src = readFileSync(path.join(__dirname, '../components/settings-users-page.tsx'), 'utf8')
    expect(src).toContain("from '../lib/zaoly-ui'")
    expect(src).not.toMatch(/from ['"]@zaoly\/ui['"]/)
    expect(src).not.toContain('--zaoly-')
    expect(src).toContain('zaoly-users-hub')
  })
})

