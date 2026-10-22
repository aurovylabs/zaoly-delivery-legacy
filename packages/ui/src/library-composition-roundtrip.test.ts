import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const root = path.resolve(__dirname, '../../..')

describe('library-composition-roundtrip spec', () => {
  it('locks git SSOT, promote kinds, and Storybook Coolify fan-out', () => {
    const spec = path.join(root, 'specs/domain/library-composition-roundtrip.md')
    expect(existsSync(spec)).toBe(true)
    const text = readFileSync(spec, 'utf8')
    expect(text).toContain('Write SSOT = `zaoly-ui` git')
    expect(text).toContain('rtxcfh4gtxi6yba5l70fu177')
    expect(text).toContain('P1 — Instance override')
    expect(text).toContain('P2 — Composition → catalog Template story')
    expect(text).toContain('P3 — New primitive')
    expect(text).toContain('P4 — Extend primitive API')
    expect(text).toContain('pnpm ds:add')
    expect(text).toContain('ZAOLY_UI_SOURCE')
    expect(text).toContain('never a Coolify write')
    expect(text).toContain('**Status:** Accepted')
    expect(text).toContain('writesGit: false')
    expect(text).toContain('POST /api/library/promote/dry-run')
    expect(text).toContain('POST /api/library/promote')
    expect(text).toContain('Phase 4')
    expect(text).toContain('Phase 5')
    expect(text).toContain('Phase 6')
    expect(text).toContain('Phase 7')
    expect(text).toContain('Phase 8')
    expect(text).toContain('--status-*')
    expect(text).toContain('color.status.pipeline.')
    expect(text).toContain('is_auto_deploy_enabled')
    expect(text).toContain('catalogComponent')
    expect(text).toContain('pnpm wc:compile')
  })

  it('tokens.css exposes pipeline status vars matching zaolyStatus for Creation Promote', () => {
    const css = readFileSync(
      path.join(root, 'packages/ui/src/css/tokens.css'),
      'utf8',
    )
    const status = readFileSync(
      path.join(root, 'packages/ui/src/tokens/status.ts'),
      'utf8',
    )
    expect(css).toContain('--status-category-queued: #fef14d')
    expect(css).toContain('--status-completed:')
    expect(css).toContain('--status-failed-enrich:')
    expect(status).toContain('CATEGORY_QUEUED')
    expect(status).toContain('zaolyBrand.yellow')
  })

  it('pin-bump workflow opens a HITL PR and never auto-merges', () => {
    const workflow = readFileSync(path.join(root, '.github/workflows/pin-bump-creation.yml'), 'utf8')
    expect(workflow).toContain('aurovylabs/zaoly-delivery')
    expect(workflow).toContain('pin/zaoly-ui-')
    expect(workflow).toContain('ZAOLY_GITHUB_TOKEN')
    expect(workflow).toContain('peter-evans/create-pull-request@v8')
    expect(workflow).toContain('Never auto-merge')
    expect(workflow).not.toContain('gh pr merge')
    expect(workflow).not.toContain('enable-auto-merge')
    expect(workflow).not.toContain('merge-method')
  })
})
