import { paths } from './paths'

/** Standalone Zaoly: editor-first. Suite hubs demoted (still routable). Admin is a first-class tab. */
export const PRIMARY_NAV = [
  {
    id: 'editor',
    href: paths.routes.editor,
    labelKey: 'nav.editor',
  },
  {
    id: 'compositions',
    href: paths.routes.compositions,
    labelKey: 'nav.compositions',
  },
  {
    id: 'library',
    href: paths.routes.library,
    labelKey: 'nav.library',
  },
  {
    id: 'kit',
    href: paths.routes.kit,
    labelKey: 'nav.kit',
  },
  {
    id: 'tokens',
    href: paths.routes.tokens,
    labelKey: 'nav.tokens',
  },
  {
    id: 'admin',
    href: paths.routes.admin,
    labelKey: 'nav.admin',
  },
] as const

/**
 * Settings stays trailing.
 * `/admin/*` and legacy `/settings/users` belong to the Admin tab, not Settings.
 */
export function primaryNavActive(pathname: string, href: string): boolean {
  if (href === paths.routes.settings) {
    if (pathname === paths.routes.settings) return true
    if (!pathname.startsWith(`${paths.routes.settings}/`)) return false
    return !pathname.startsWith(paths.routes.settingsUsers)
  }
  if (href === paths.routes.admin) {
    if (pathname === paths.routes.admin || pathname.startsWith(`${paths.routes.admin}/`)) {
      return true
    }
    return pathname === paths.routes.settingsUsers || pathname.startsWith(`${paths.routes.settingsUsers}/`)
  }
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}
