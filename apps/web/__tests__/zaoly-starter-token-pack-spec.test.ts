import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const repoRoot = path.join(__dirname, '../../..')

describe('zaoly-starter-token-pack spec', () => {
  const domain = readFileSync(
    path.join(repoRoot, 'specs/domain/zaoly-starter-token-pack.md'),
    'utf8',
  )
  const knowledge = readFileSync(
    path.join(repoRoot, 'knowledge/zaoly-starter-token-pack.md'),
    'utf8',
  )

  it('exists and is linked from token studio + paths', () => {
    expect(existsSync(path.join(repoRoot, 'specs/domain/zaoly-starter-token-pack.md'))).toBe(
      true,
    )
    expect(existsSync(path.join(repoRoot, 'knowledge/zaoly-starter-token-pack.md'))).toBe(true)
    const studio = readFileSync(path.join(repoRoot, 'specs/domain/zaoly-token-studio.md'), 'utf8')
    expect(studio).toMatch(/zaoly-starter-token-pack/)
    const pathsDoc = readFileSync(path.join(repoRoot, 'knowledge/paths.md'), 'utf8')
    expect(pathsDoc).toMatch(/zaoly-starter-token-pack/)
  })

  it('requires a complete pack for Site Kit atoms', () => {
    expect(domain).toMatch(/complete/)
    expect(domain).toMatch(/Site Kit atom coverage/)
    expect(domain).toMatch(/Button/)
    expect(domain).toMatch(/Chart/)
    expect(domain).toMatch(/Gauge/)
    expect(domain).toMatch(/primaryForeground/)
    expect(domain).toMatch(/color\.chart\.1/)
    expect(domain).toMatch(/spacing\.static\.0/)
    expect(domain).toMatch(/typography\.display/)
    expect(domain).toMatch(/shadow\.elevation/)
    expect(domain).toMatch(/motion\.fast/)
    expect(domain).toMatch(/radius\.none/)
    expect(domain).toMatch(/MUST NOT/)
    expect(domain).toMatch(/corporate-design/)
  })

  it('documents CD mapping and atom checklist in knowledge', () => {
    expect(knowledge).toMatch(/#F3EEE4|#1F44FF/)
    expect(knowledge).toMatch(/Atom → bind checklist/)
    expect(knowledge).toMatch(/defaultSiteKitTokenBindings/)
    expect(knowledge).toMatch(/defaultSiteKitInteractiveStates/)
    expect(knowledge).toMatch(/starterPackLeavesForTheme/)
    expect(knowledge).toMatch(/ZAOLY_STARTER_MAG_PRINT_REQUIRED_PATHS/)
    expect(knowledge).toMatch(/zaoly-starter-pack\.ts/)
  })

  it('documents Mag print + theme-aware Kit CSS', () => {
    expect(domain).toMatch(/Mag-critical print/)
    expect(domain).toMatch(/Theme-aware Kit CSS/)
    expect(domain).toMatch(/printCssForLeaf/)
    expect(domain).toMatch(/Starter named Master variants/)
    expect(knowledge).toMatch(/buildTokenPackRootCss/)
    expect(knowledge).toMatch(/softFillStarterMasterVariants/)
    expect(knowledge).toMatch(/DEFAULT_SITE_LAYOUT_BINDINGS/)
    expect(knowledge).toMatch(/editor-tokens-as-properties/)
  })

  it('lists every Site Kit barrel component in coverage table', () => {
    const atoms = [
      'Button',
      'Link',
      'Text',
      'Badge',
      'Input',
      'Textarea',
      'Select',
      'Checkbox',
      'Divider',
      'Stack',
      'Container',
      'Grid',
      'Table',
      'Chart',
      'Gauge',
      'Image',
      'Svg',
      'Shape',
    ]
    for (const atom of atoms) {
      expect(domain).toContain(atom)
    }
  })
})
