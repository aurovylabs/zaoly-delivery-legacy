import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { paths } from '../lib/paths'

const repoRoot = path.resolve(__dirname, '../../..')

describe('zaoly platform admin specs + paths', () => {
  it('domain + api + knowledge exist', () => {
    for (const rel of [
      'specs/domain/zaoly-platform-admin.md',
      'specs/api/zaoly-platform-admin.md',
      'knowledge/zaoly-platform-admin.md',
      'knowledge/zaoly-admin-hardening.md',
    ]) {
      const p = path.join(repoRoot, rel)
      expect(existsSync(p)).toBe(true)
      expect(readFileSync(p, 'utf8').length).toBeGreaterThan(100)
    }
  })

  it('exposes admin console routes in paths SSOT', () => {
    expect(paths.routes.admin).toBe('/admin')
    expect(paths.routes.adminUsers).toBe('/admin/users')
    expect(paths.routes.adminMail).toBe('/admin/mail')
    expect(paths.routes.adminAudit).toBe('/admin/audit')
    expect(paths.routes.settingsUsers).toBe('/settings/users')
    expect(paths.routes.apiAdminOverview).toBe('/api/admin/overview')
    expect(paths.routes.apiAdminUsers).toBe('/api/admin/users')
    expect(paths.routes.apiAdminAudit).toBe('/api/admin/audit')
    expect(paths.routes.apiAdminUserForcePasswordReset('u1')).toBe(
      '/api/admin/users/u1/force-password-reset',
    )
    expect(paths.routes.apiAdminSmtp).toBe('/api/admin/smtp')
  })

  it('documents phase-1 hub and no second-repo split', () => {
    const domain = readFileSync(
      path.join(repoRoot, 'specs/domain/zaoly-platform-admin.md'),
      'utf8',
    )
    expect(domain).toContain('/admin/users')
    expect(domain).toContain('/settings/users')
    expect(domain).toContain('MUST NOT')
    expect(domain).toContain('second product repository')

    const knowledge = readFileSync(
      path.join(repoRoot, 'knowledge/zaoly-platform-admin.md'),
      'utf8',
    )
    expect(knowledge).toContain('Phase 1')
    expect(knowledge).toContain('zaoly.app')
    expect(knowledge).toContain('Self-host')

    const matrix = readFileSync(
      path.join(repoRoot, 'knowledge/zaoly-hosted-vs-self-host.md'),
      'utf8',
    )
    expect(matrix).toContain('zaoly-platform-admin.md')
    expect(matrix).toContain('/admin')
  })

  it('ships phase-1 admin routes and overview API', () => {
    expect(
      existsSync(path.join(repoRoot, 'apps/web/app/admin/page.tsx')),
    ).toBe(true)
    expect(
      existsSync(path.join(repoRoot, 'apps/web/app/admin/users/page.tsx')),
    ).toBe(true)
    expect(
      existsSync(path.join(repoRoot, 'apps/web/app/admin/mail/page.tsx')),
    ).toBe(true)
    expect(
      existsSync(path.join(repoRoot, 'apps/web/app/api/admin/overview/route.ts')),
    ).toBe(true)
    const redirect = readFileSync(
      path.join(repoRoot, 'apps/web/app/settings/users/page.tsx'),
      'utf8',
    )
    expect(redirect).toContain('adminUsers')
  })

  it('ships phase-2a force-reset + audit', () => {
    expect(
      existsSync(
        path.join(
          repoRoot,
          'apps/web/app/api/admin/users/[id]/force-password-reset/route.ts',
        ),
      ),
    ).toBe(true)
    expect(
      existsSync(path.join(repoRoot, 'apps/web/app/api/admin/audit/route.ts')),
    ).toBe(true)
    expect(
      existsSync(path.join(repoRoot, 'apps/web/app/admin/audit/page.tsx')),
    ).toBe(true)
    expect(
      existsSync(path.join(repoRoot, 'apps/web/lib/users/admin-audit.ts')),
    ).toBe(true)
    const api = readFileSync(
      path.join(repoRoot, 'specs/api/zaoly-platform-admin.md'),
      'utf8',
    )
    expect(api).toContain('Phase 2a')
    expect(api).toContain('force-password-reset')
  })

  it('ships phase-2b elevated ops', () => {
    expect(paths.hostedBootstrapAdminEmail).toBe('admin@zaoly.app')
    expect(paths.envZaolyPlatformAdminEmails).toBe('ZAOLY_PLATFORM_ADMIN_EMAILS')
    expect(paths.envZaolyPlatformAdminImpersonation).toBe(
      'ZAOLY_PLATFORM_ADMIN_IMPERSONATION',
    )
    expect(paths.routes.apiAdminUserAnonymize('u1')).toBe(
      '/api/admin/users/u1/anonymize',
    )
    expect(paths.routes.apiAdminImpersonate).toBe('/api/admin/impersonate')
    expect(paths.routes.apiAdminImpersonateStop).toBe('/api/admin/impersonate/stop')
    expect(
      existsSync(
        path.join(repoRoot, 'apps/web/app/api/admin/users/[id]/anonymize/route.ts'),
      ),
    ).toBe(true)
    expect(
      existsSync(path.join(repoRoot, 'apps/web/app/api/admin/impersonate/route.ts')),
    ).toBe(true)
    expect(
      existsSync(path.join(repoRoot, 'apps/web/lib/users/impersonation.ts')),
    ).toBe(true)
    const api = readFileSync(
      path.join(repoRoot, 'specs/api/zaoly-platform-admin.md'),
      'utf8',
    )
    expect(api).toContain('Phase 2b')
    expect(api).toContain('anonymize')
    expect(api).toContain('impersonate')
    expect(api).toContain('reason')
    expect(paths.impersonationTtlSeconds).toBe(30 * 60)
    expect(paths.impersonationReasonMinLength).toBe(8)
  })

  it('ships P0 hardening: admin layout + rate-limit + mutation lock', () => {
    expect(
      existsSync(path.join(repoRoot, 'apps/web/app/admin/layout.tsx')),
    ).toBe(true)
    expect(
      existsSync(path.join(repoRoot, 'apps/web/lib/rate-limit.ts')),
    ).toBe(true)
    const layout = readFileSync(
      path.join(repoRoot, 'apps/web/app/admin/layout.tsx'),
      'utf8',
    )
    expect(layout).toContain('requireAdminUser')
    const hardening = readFileSync(
      path.join(repoRoot, 'knowledge/zaoly-admin-hardening.md'),
      'utf8',
    )
    expect(hardening).toContain('rate-limit')
    expect(hardening).toContain('impersonating')
    const requireAdmin = readFileSync(
      path.join(repoRoot, 'apps/web/lib/users/require-admin.ts'),
      'utf8',
    )
    expect(requireAdmin).toContain('requireAdminUserNotImpersonating')
    const proxy = readFileSync(path.join(repoRoot, 'apps/web/proxy.ts'), 'utf8')
    expect(proxy).toContain('rateLimitAuthLoginMax')
  })

  it('ships P4 WebAuthn passkeys for platform_admin', () => {
    expect(
      existsSync(
        path.join(
          repoRoot,
          'apps/web/app/api/admin/webauthn/register/options/route.ts',
        ),
      ),
    ).toBe(true)
    expect(
      existsSync(
        path.join(repoRoot, 'apps/web/app/api/auth/webauthn/login/verify/route.ts'),
      ),
    ).toBe(true)
    expect(paths.routes.apiAuthWebAuthnLoginOptions).toBe(
      '/api/auth/webauthn/login/options',
    )
    const hardening = readFileSync(
      path.join(repoRoot, 'knowledge/zaoly-admin-hardening.md'),
      'utf8',
    )
    expect(hardening).toContain('Platform admin passkeys')
    const login = readFileSync(
      path.join(repoRoot, 'apps/web/components/login-page.tsx'),
      'utf8',
    )
    expect(login).toContain('startAuthentication')
    const security = readFileSync(
      path.join(repoRoot, 'apps/web/components/admin-mfa-page.tsx'),
      'utf8',
    )
    expect(security).toContain('startRegistration')
  })

  it('ships P3 MFA for platform_admin', () => {
    expect(
      existsSync(path.join(repoRoot, 'apps/web/app/admin/security/page.tsx')),
    ).toBe(true)
    expect(
      existsSync(path.join(repoRoot, 'apps/web/lib/users/mfa-store.ts')),
    ).toBe(true)
    expect(paths.routes.adminSecurity).toBe('/admin/security')
    expect(paths.routes.apiAdminMfaConfirm).toBe('/api/admin/mfa/confirm')
    const hardening = readFileSync(
      path.join(repoRoot, 'knowledge/zaoly-admin-hardening.md'),
      'utf8',
    )
    expect(hardening).toContain('Platform admin TOTP')
    const auth = readFileSync(path.join(repoRoot, 'apps/web/auth.ts'), 'utf8')
    expect(auth).toContain('totp')
    expect(auth).toContain('mfa_required')
  })

  it('ships P2 hardening: read-only impersonation + break-glass', () => {
    expect(
      existsSync(
        path.join(repoRoot, 'apps/web/lib/users/impersonation-readonly.ts'),
      ),
    ).toBe(true)
    const proxy = readFileSync(path.join(repoRoot, 'apps/web/proxy.ts'), 'utf8')
    expect(proxy).toContain('forbidImpersonationWrite')
    const hardening = readFileSync(
      path.join(repoRoot, 'knowledge/zaoly-admin-hardening.md'),
      'utf8',
    )
    expect(hardening).toContain('Read-only view-as')
    expect(hardening).toContain('Break-glass')
    const shell = readFileSync(
      path.join(repoRoot, 'apps/web/components/app-shell.tsx'),
      'utf8',
    )
    expect(shell).toContain('impersonatingReadonly')
    const overview = readFileSync(
      path.join(repoRoot, 'apps/web/components/admin-overview-page.tsx'),
      'utf8',
    )
    expect(overview).not.toContain('bootstrapBreakGlass')
    expect(overview).not.toContain('zaoly-admin-break-glass')
  })

  it('ships P1 hardening: session revoke + auth.denied + patch before/after', () => {
    expect(
      existsSync(path.join(repoRoot, 'apps/web/lib/users/session-revoke.ts')),
    ).toBe(true)
    const auth = readFileSync(path.join(repoRoot, 'apps/web/auth.ts'), 'utf8')
    expect(auth).toContain('enforceActiveJwt')
    const audit = readFileSync(
      path.join(repoRoot, 'apps/web/lib/users/admin-audit.ts'),
      'utf8',
    )
    expect(audit).toContain('auth.denied')
    const patch = readFileSync(
      path.join(repoRoot, 'apps/web/app/api/admin/users/[id]/route.ts'),
      'utf8',
    )
    expect(patch).toContain('before')
    expect(patch).toContain('after')
    const hardening = readFileSync(
      path.join(repoRoot, 'knowledge/zaoly-admin-hardening.md'),
      'utf8',
    )
    expect(hardening).toContain('Session revoke')
    const domain = readFileSync(
      path.join(repoRoot, 'specs/domain/zaoly-platform-admin.md'),
      'utf8',
    )
    expect(domain).toContain('auth.denied')
  })
})


