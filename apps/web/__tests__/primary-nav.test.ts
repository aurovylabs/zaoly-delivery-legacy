import { describe, expect, it } from 'vitest'
import { PRIMARY_NAV, primaryNavActive } from '../lib/primary-nav'
import { paths } from '../lib/paths'

describe('primary nav', () => {
  it('includes Tokens and Admin after Kit', () => {
    expect(PRIMARY_NAV.map((item) => item.id)).toEqual([
      'editor',
      'compositions',
      'library',
      'kit',
      'tokens',
      'admin',
    ])
    expect(PRIMARY_NAV.find((item) => item.id === 'tokens')?.href).toBe(paths.routes.tokens)
    expect(PRIMARY_NAV.find((item) => item.id === 'admin')?.href).toBe(paths.routes.admin)
  })

  it('marks /admin and legacy /settings/users on Admin, not Settings', () => {
    expect(primaryNavActive('/admin', paths.routes.admin)).toBe(true)
    expect(primaryNavActive('/admin/users', paths.routes.admin)).toBe(true)
    expect(primaryNavActive('/admin/mail', paths.routes.admin)).toBe(true)
    expect(primaryNavActive('/settings/users', paths.routes.admin)).toBe(true)
    expect(primaryNavActive('/settings/users', paths.routes.settings)).toBe(false)
    expect(primaryNavActive('/settings', paths.routes.settings)).toBe(true)
    expect(primaryNavActive('/settings', paths.routes.admin)).toBe(false)
    expect(primaryNavActive('/editor', paths.routes.editor)).toBe(true)
    expect(primaryNavActive('/tokens', paths.routes.tokens)).toBe(true)
    expect(primaryNavActive('/tokens', paths.routes.settings)).toBe(false)
  })
})
