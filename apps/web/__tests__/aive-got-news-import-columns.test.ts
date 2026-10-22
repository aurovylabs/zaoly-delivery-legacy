import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { SceneNode } from '@zaoly/contracts'
import { JSDOM } from 'jsdom'
import {
  parseClassRulesFromDocument,
  stripCssComments,
  styleClassKey,
} from '../lib/scene/html-css-parse'
import { htmlToSceneRoot } from '../lib/scene/html-to-scene'

const html = readFileSync(
  resolve(__dirname, '../lib/fixtures/html-import/aive-got-news/issue-01.html'),
  'utf8',
)

function walk(node: SceneNode, visit: (n: SceneNode) => void) {
  visit(node)
  for (const c of node.children ?? []) walk(c, visit)
}

describe('aive-got-news-import-columns', () => {
  it('stripCssComments keeps selectors after block comments', () => {
    const css = `.a { color: red; }\n/* twin columns */\n.cols { display: grid; grid-template-columns: 1fr 1fr; }`
    expect(stripCssComments(css)).toContain('.cols')
    expect(stripCssComments(css)).not.toContain('/*')
  })

  it('parses .cols as multi-column grid after comments', () => {
    const dom = new JSDOM(html)
    const rules = parseClassRulesFromDocument(dom.window.document)
    const cols = rules.get(styleClassKey('cols'))
    expect(cols?.display).toBe('grid')
    expect(cols?.['grid-template-columns']).toBe('1fr 1fr')
  })

  it('maps bilingual columns to SiteGrid (not collapsed stacks)', async () => {
    const result = await htmlToSceneRoot(html)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    let grids = 0
    let rows = 0
    walk(result.root, (n) => {
      if (n.type === 'SiteGrid' && Number(n.props?.columns ?? 0) >= 2) grids += 1
      if (n.type === 'SiteStack' && n.props?.direction === 'row') rows += 1
    })

    // One EN|DE pair per bilingual block → SiteGrid; other chrome stays flex row
    expect(grids).toBeGreaterThanOrEqual(10)
    expect(rows + grids).toBeGreaterThanOrEqual(20)
    expect(html).toContain('grid-template-columns:1fr 1fr')
    expect(result.warnings.some((w) => w.code === 'mapped-grid-to-sitegrid')).toBe(true)
  })
})
