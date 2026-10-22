import { Suspense } from 'react'
import { AppShell } from '../../../components/app-shell'
import { AdminSubnav } from '../../../components/admin-subnav'
import { AdminMfaPage } from '../../../components/admin-mfa-page'

function AdminSecurityBody() {
  return (
    <AppShell titleKey="pages.adminSecurity.title" descriptionKey="pages.adminSecurity.lead">
      <AdminSubnav />
      <AdminMfaPage />
    </AppShell>
  )
}

export default function AdminSecurityRoute() {
  // AppShell uses usePathname — under Suspense for Cache Components (Wave F).
  return (
    <Suspense fallback={null}>
      <AdminSecurityBody />
    </Suspense>
  )
}
