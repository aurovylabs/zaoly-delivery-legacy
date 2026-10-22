'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { paths } from '../lib/paths'
import { useUserPrefs } from '../lib/user-prefs'

const ADMIN_LINKS = [
  { href: paths.routes.admin, labelKey: 'admin.navOverview', exact: true },
  { href: paths.routes.adminUsers, labelKey: 'admin.navUsers', exact: false },
  { href: paths.routes.adminMail, labelKey: 'admin.navMail', exact: false },
  { href: paths.routes.adminAudit, labelKey: 'admin.navAudit', exact: false },
  { href: paths.routes.adminSecurity, labelKey: 'admin.navSecurity', exact: false },
] as const

export function AdminSubnav() {
  const pathname = usePathname()
  const { t } = useUserPrefs()

  return (
    <nav className="zaoly-admin-hub__subnav" aria-label={t('admin.subnavAria')} data-testid="zaoly-admin-subnav">
      {ADMIN_LINKS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              active ? 'zaoly-admin-hub__subnav-link is-active' : 'zaoly-admin-hub__subnav-link'
            }
            aria-current={active ? 'page' : undefined}
          >
            {t(item.labelKey)}
          </Link>
        )
      })}
    </nav>
  )
}
