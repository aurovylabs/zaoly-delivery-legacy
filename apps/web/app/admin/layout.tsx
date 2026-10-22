import { Suspense, type ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { paths } from '../../lib/paths'
import { isAdminUser, requireAdminUser } from '../../lib/users/require-admin'

/** Server staff gate for `/admin/*` · `zaoly-admin-hardening.md` */
async function AdminGate({ children }: { children: ReactNode }) {
  const access = await requireAdminUser()
  if (!isAdminUser(access)) {
    if (access.status === 401) {
      redirect(`${paths.routes.login}?redirect=${encodeURIComponent(paths.routes.admin)}`)
    }
    redirect(paths.routes.home)
  }
  return children
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  // Staff auth + redirects + nested AppShell (usePathname) under Suspense.
  return (
    <Suspense fallback={null}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  )
}
