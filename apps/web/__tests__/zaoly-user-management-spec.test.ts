import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { paths } from '../lib/paths'

const repoRoot = path.resolve(__dirname, '../../..')

describe('zaoly user management specs + paths', () => {
  it('domain + api specs exist', () => {
    for (const rel of [
      'specs/domain/zaoly-user-management.md',
      'specs/api/zaoly-users.md',
      'specs/domain/zaoly-scene-share.md',
      'specs/api/zaoly-scene-members.md',
    ]) {
      const p = path.join(repoRoot, rel)
      expect(existsSync(p)).toBe(true)
      expect(readFileSync(p, 'utf8').length).toBeGreaterThan(100)
    }
  })

  it('exposes admin + me + invite + register routes', () => {
    expect(paths.routes.apiMe).toBe('/api/me')
    expect(paths.routes.apiAdminUsers).toBe('/api/admin/users')
    expect(paths.routes.apiAdminUsersInvite).toBe('/api/admin/users/invite')
    expect(paths.routes.apiInvitesAccept).toBe('/api/invites/accept')
    expect(paths.routes.apiRegister).toBe('/api/register')
    expect(paths.routes.register).toBe('/register')
    expect(paths.routes.settingsUsers).toBe('/settings/users')
    expect(paths.routes.adminUsers).toBe('/admin/users')
    expect(paths.envZaolyBootstrapAdminEmail).toBe('ZAOLY_BOOTSTRAP_ADMIN_EMAIL')
    expect(paths.envAuthGoogleId).toBe('AUTH_GOOGLE_ID')
    expect(paths.envZaolyPublicSignup).toBe('ZAOLY_PUBLIC_SIGNUP')
    expect(paths.routes.apiSceneMembers('s1')).toBe('/api/scenes/s1/members')
  })

  it('ops knowledge documents public signup + Google env', () => {
    const p = path.join(repoRoot, 'knowledge/zaoly-user-management.md')
    expect(existsSync(p)).toBe(true)
    const text = readFileSync(p, 'utf8')
    expect(text).toContain('ZAOLY_BOOTSTRAP_ADMIN_EMAIL')
    expect(text).toContain('/admin/users')
    expect(text).toContain('/settings/users')
    expect(text).toContain('AUTH_GOOGLE_ID')
    expect(text).toContain('/register')
    expect(text).toContain('ensureStarterLandingForUser')
  })

  it('provisions a personal starter landing for new accounts', () => {
    const domain = readFileSync(
      path.join(repoRoot, 'specs/domain/zaoly-user-management.md'),
      'utf8',
    )
    expect(domain).toContain('ensureStarterLandingForUser')
    expect(domain).toContain('Starter scene')
    const starter = readFileSync(
      path.join(repoRoot, 'apps/web/lib/scene/user-starter-scene.ts'),
      'utf8',
    )
    expect(starter).toContain('createZaolyDefaultLandingScene')
    expect(starter).toContain('ownerUserId')
    const register = readFileSync(
      path.join(repoRoot, 'apps/web/app/api/register/route.ts'),
      'utf8',
    )
    expect(register).toContain('voidEnsureStarterLandingForUser')
  })
})
