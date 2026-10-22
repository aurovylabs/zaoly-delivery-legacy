import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { SceneNode } from '@zaoly/contracts'
import { htmlToSceneRoot } from '../lib/scene/html-to-scene'

const html = readFileSync(
  resolve(__dirname, '../lib/fixtures/html-import/aive-got-news/issue-01.html'),
  'utf8',
)

function walk(node: SceneNode, visit: (n: SceneNode) => void) {
  visit(node)
  for (const c of node.children ?? []) walk(c, visit)
}

describe('aive-got-news-import-svgs', () => {
  it('editorial graphics import as full-width SiteSvg (logo stays hug)', async () => {
    const result = await htmlToSceneRoot(html)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const svgs: SceneNode[] = []
    walk(result.root, (n) => {
      if (n.type === 'SiteSvg') svgs.push(n)
    })

    expect(svgs.length).toBeGreaterThanOrEqual(3)

    const logo = svgs.find((n) => String(n.props?.alt ?? '').includes('Zaoly'))
    expect(logo?.style?.width).toBe(18)

    const graphics = svgs.filter((n) => n !== logo)
    expect(graphics.length).toBeGreaterThanOrEqual(2)
    for (const g of graphics) {
      expect(g.style?.width).toBe('100%')
      expect(String(g.props?.viewBox ?? '')).toMatch(/^0 0 740 /)
    }

    expect(html).toContain('id="graphic-debate"')
    expect(html).toContain('id="graphic-pipeline"')
    expect(html).not.toContain('flex: 0 0 260px')
  })
})
