/**
 * Zaoly must not wire suite distillate hooks into product API routes.
 * Legacy inventory: knowledge/distillate-call-sites.md (CREATION history).
 */
import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = path.join(__dirname, '../../..')

const ZAOLY_ROUTES_WITHOUT_DISTILLATE = [
  'apps/web/app/api/scenes/[id]/import-html/route.ts',
  'apps/web/app/api/scenes/[id]/client-shares/[shareId]/route.ts',
] as const

const FORBIDDEN_NEEDLES = ['scheduleCollectionActivityDistillate', 'scheduleSuiteAuditEvent'] as const

describe('distillate call sites (Zaoly standalone)', () => {
  it('product routes do not schedule Plexon distillate', () => {
    for (const rel of ZAOLY_ROUTES_WITHOUT_DISTILLATE) {
      const abs = path.join(root, rel)
      expect(existsSync(abs), `missing ${rel}`).toBe(true)
      const src = readFileSync(abs, 'utf8')
      for (const needle of FORBIDDEN_NEEDLES) {
        expect(src, `${rel} must not reference ${needle}`).not.toContain(needle)
      }
    }
  })
})
