import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const srcDir = path.dirname(fileURLToPath(import.meta.url))
const uiPkg = path.resolve(srcDir, '..')
const repoRoot = path.resolve(uiPkg, '../..')
const localMap = path.join(repoRoot, 'knowledge/ds-deposit-component-semantic-map.json')
const brandionCanonical = path.join(
  repoRoot,
  '../brandion-v3/knowledge/ds-deposit-component-semantic-map.json',
)

const MDX_REQUIRED: Array<{ file: string; needles: string[] }> = [
  {
    file: 'src/components/Button.mdx',
    needles: ['Tokens consumed', 'color.action.primary', 'color.status.danger', 'color.muted'],
  },
  {
    file: 'src/components/Badge.mdx',
    needles: ['Tokens consumed', 'color.action.primary', 'color.status.ok', 'color.status.warn'],
  },
  {
    file: 'src/components/Alert.mdx',
    needles: ['Tokens consumed', 'color.status.ok', 'color.status.danger', 'color.muted'],
  },
  {
    file: 'src/components/Chip.mdx',
    needles: ['Tokens consumed', 'color.action.primary'],
  },
  {
    file: 'src/components/Panel.mdx',
    needles: ['Tokens consumed', 'radius.panel'],
  },
  {
    file: 'src/components/Field.mdx',
    needles: ['Tokens consumed', 'color.action.primary', 'color.status.danger'],
  },
  {
    file: 'src/components/Avatar.mdx',
    needles: ['Tokens consumed', 'color.ink', 'color.field', 'radius.pill'],
  },
  {
    file: 'src/components/FilterRow.mdx',
    needles: ['Tokens consumed', 'color.muted', 'color.line'],
  },
  {
    file: 'src/components/FloatingPanel.mdx',
    needles: ['Tokens consumed', 'color.surface.base', 'color.line'],
  },
  {
    file: 'src/components/ChatAlertBlock.mdx',
    needles: ['Tokens consumed', 'color.status.ok', 'color.status.danger'],
  },
]

describe('DS-DEPOSIT D5 Storybook consume citations', () => {
  it('MDX documents Brandion consume paths', () => {
    for (const row of MDX_REQUIRED) {
      const text = readFileSync(path.join(uiPkg, row.file), 'utf8')
      for (const needle of row.needles) {
        expect(text, `${row.file} missing ${needle}`).toContain(needle)
      }
    }
  })

  it('copied JSON matches brandion canonical when sibling exists', () => {
    expect(existsSync(localMap)).toBe(true)
    if (!existsSync(brandionCanonical)) return
    expect(readFileSync(localMap, 'utf8')).toBe(readFileSync(brandionCanonical, 'utf8'))
  })

  it('P72 tokens.css declares success/warning/bad as Layer 0 aliases', () => {
    const css = readFileSync(path.join(uiPkg, 'src/css/tokens.css'), 'utf8')
    expect(css).toMatch(/--success:\s*var\(--ok\)/)
    expect(css).toMatch(/--warning:\s*var\(--warn\)/)
    expect(css).toMatch(/--bad:\s*var\(--danger\)/)
  })

  it('Button primary CSS still uses --accent (map is not guessed)', () => {
    const css = readFileSync(path.join(uiPkg, 'src/css/button.css'), 'utf8')
    expect(css).toMatch(/\.ds-btn--primary\s*\{[^}]*background:\s*var\(--accent\)/s)
    expect(css).toContain('#1a150c')
    expect(css).toMatch(/\.ds-btn--ghost\s*\{[^}]*color:\s*var\(--muted\)/s)
    expect(css).toMatch(/\.ds-btn--danger\s*\{[^}]*color:\s*var\(--danger\)/s)
  })
})
