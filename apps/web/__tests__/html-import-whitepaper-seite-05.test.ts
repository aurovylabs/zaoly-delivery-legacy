import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import type { SceneNode } from '@zaoly/contracts'
import { HTML_IMPORT_MAX_CHARS, htmlToSceneRoot } from '../lib/scene/html-to-scene'

const fixturePath = join(
  dirname(fileURLToPath(import.meta.url)),
  '../lib/fixtures/html-import/whitepaper-seite-05.html',
)

function walk(node: SceneNode, visit: (n: SceneNode) => void) {
  visit(node)
  for (const c of node.children ?? []) walk(c, visit)
}

function collectText(root: SceneNode): string[] {
  const out: string[] = []
  walk(root, (n) => {
    const children = n.props?.children
    if (typeof children === 'string' && children.trim()) out.push(children.trim())
  })
  return out
}

describe('whitepaper Seite 05 Creation HTML fixture', () => {
  it('stays under the import size cap and maps to Site Kit text/links', async () => {
    const html = readFileSync(fixturePath, 'utf8')
    expect(html.length).toBeGreaterThan(1000)
    expect(html.length).toBeLessThan(HTML_IMPORT_MAX_CHARS)
    expect(html).not.toMatch(/<script\b/i)
    expect(html).not.toMatch(/position\s*:\s*(absolute|fixed)/i)
    expect(html).not.toMatch(/data:font\//i)
    expect(html).not.toMatch(/data:image\/png;base64,/i)

    const result = await htmlToSceneRoot(html)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const texts = collectText(result.root).join('\n')
    expect(texts).toContain('Zaoly')
    expect(texts).toMatch(/The handover/)
    expect(texts).toMatch(/comes first/)
    expect(texts).toContain('01 / Lost work')
    expect(texts).toContain('Scope and limits')
    expect(texts).toContain('05')

    let foundLink = false
    walk(result.root, (n) => {
      if (n.type === 'SiteLink' && String(n.props?.href ?? '').includes('doi.org')) {
        foundLink = true
      }
    })
    expect(foundLink).toBe(true)
    expect(result.stats.nodeCount).toBeGreaterThan(20)
  })
})
