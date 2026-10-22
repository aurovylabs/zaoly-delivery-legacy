import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = path.resolve(__dirname, '../../..')

describe('library-composition-roundtrip knowledge', () => {
  it('points at canonical library-composition-roundtrip spec and promote kinds', () => {
    const text = readFileSync(
      path.join(repoRoot, 'knowledge/library-composition-roundtrip.md'),
      'utf8',
    )
    expect(text).toContain('specs/domain/library-composition-roundtrip.md')
    expect(text).toContain('rtxcfh4gtxi6yba5l70fu177')
    expect(text).toContain('P1')
    expect(text).toContain('P2')
    expect(text).toContain('P3')
    expect(text).toContain('P4')
    expect(text).toContain('ZAOLY_UI_SOURCE')
    expect(text).toContain('dry-run')
    expect(text).toContain('writesGit')
    expect(text).toContain('POST /api/library/promote')
    expect(text).toContain('promote/')
    expect(text).toContain('githubConfigured')
    expect(text).toContain('insertableCatalogEntries')
    expect(text).toContain('catalogComponent')
    expect(text).toContain('catalog-ssot-p4-smoke.md')
    expect(text).toContain('genericCatalogInspectProps')
    expect(text).toContain('--creation-catalog-fill')
    expect(text).toContain('creation-storybook-test-scenario.md')
    expect(text).toContain('promote-inspect-chrome.md')
    expect(text).toContain('PROMOTE_TOKEN_PATH_TO_CSS_VAR')
    expect(text).toContain('pin/zaoly-ui-')
    expect(text).toContain('is_auto_deploy')
  })

  it('catalog SSOT + P4 smoke covers ChatBlockPanel dry-run', () => {
    const text = readFileSync(path.join(repoRoot, 'knowledge/catalog-ssot-p4-smoke.md'), 'utf8')
    expect(text).toContain('ChatBlockPanel')
    expect(text).toContain('/api/library/promote/dry-run')
    expect(text).toContain('extend-unrepresentable')
    expect(text).toContain('URL_ZAOLY_STAGING')
    expect(text).toContain('generic catalog copy')
    expect(text).toContain('color.action.accent')
    expect(text).toContain('var(--accent)')
    expect(text).toContain('color.status.pipeline.category_queued')
    expect(text).toContain('var(--status-category-queued)')
  })

  it('Creation → Storybook operator scenario names ChatBlockPanel Align and Promoted/Text', () => {
    const text = readFileSync(
      path.join(repoRoot, 'knowledge/creation-storybook-test-scenario.md'),
      'utf8',
    )
    expect(text).toContain('ChatBlockPanel')
    expect(text).toContain('textAlign')
    expect(text).toContain('molecules-chatblockpanel--findings')
    expect(text).toContain('promoted-text--promoted')
    expect(text).toContain('promoted-chatblockpanel--promoted')
    expect(text).toContain('editor-promote-p1')
    expect(text).toContain('var(--accent)')
    expect(text).toContain('promote-inspect-chrome.md')
  })
})
