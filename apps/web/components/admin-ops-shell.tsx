import { Suspense, type ReactNode } from 'react'
import { AppShell } from './app-shell'
import { AdminSubnav } from './admin-subnav'
import { redirectIfMfaEnrollmentRequired } from '../lib/users/mfa-admin-gate'
import { isAdminUser, requireAdminUser } from '../lib/users/require-admin'

type AdminOpsShellProps = {
  titleKey: string
  descriptionKey: string
  children: ReactNode
}

/**
 * Admin pages that require MFA enrollment when env-enforced (not `/admin/security`).
 * Sync shell + Suspense: `requireAdminUser` / cookies must not block the page Instant shell
 * (Wave F · `cache-components-adoption.md`).
 */
export function AdminOpsShell(props: AdminOpsShellProps) {
  return (
    <Suspense fallback={null}>
      <AdminOpsShellBody {...props} />
    </Suspense>
  )
}

async function AdminOpsShellBody({
  titleKey,
  descriptionKey,
  children,
}: AdminOpsShellProps) {
  const access = await requireAdminUser()
  if (isAdminUser(access)) {
    await redirectIfMfaEnrollmentRequired(access.user)
  }
  return (
    <AppShell titleKey={titleKey} descriptionKey={descriptionKey}>
      <AdminSubnav />
      {children}
    </AppShell>
  )
}
