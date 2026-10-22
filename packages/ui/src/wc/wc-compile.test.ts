import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { CATALOG } from '../storybook/catalog'
import {
  catalogIdToTag,
  compileWcManifest,
  parseCatalogSource,
} from './compile'
import { defineZaolyCatalogElements } from './define'
import { WC_MANIFEST } from './generated/manifest'

const repoRoot = path.resolve(__dirname, '../../../..')

describe('wc compile (catalog → Custom Elements)', () => {
  it('emits exactly one unique zaoly- tag per catalog id', () => {
    const compiled = compileWcManifest(CATALOG)
    expect(compiled.length).toBe(CATALOG.length)
    expect(compiled.length).toBeGreaterThan(10)
    const tags = compiled.map((e) => e.tagName)
    expect(new Set(tags).size).toBe(tags.length)
    expect(catalogIdToTag('PrintCover')).toBe('zaoly-print-cover')
    expect(compiled.every((e) => e.tagName.startsWith('zaoly-'))).toBe(true)
  })

  it('generated manifest matches CATALOG compile (run pnpm wc:compile if this fails)', () => {
    expect(WC_MANIFEST).toEqual(compileWcManifest(CATALOG))
  })

  it('catalog.ts parse used by wc:compile matches CATALOG ids', () => {
    const source = readFileSync(
      path.join(repoRoot, 'packages/ui/src/storybook/catalog.ts'),
      'utf8',
    )
    const parsed = parseCatalogSource(source)
    expect(parsed.map((e) => e.id)).toEqual(CATALOG.map((e) => e.id))
  })

  it('defineZaolyCatalogElements registers tags without a CREATION catalog', () => {
    defineZaolyCatalogElements(WC_MANIFEST.slice(0, 3))
    expect(customElements.get(WC_MANIFEST[0]!.tagName)).toBeTruthy()
    const el = document.createElement(WC_MANIFEST[0]!.tagName)
    expect(el.shadowRoot).toBeTruthy()
    expect(el.shadowRoot?.querySelector('slot')).toBeTruthy()
  })

  it('spec forbids CREATION as WC SSOT', () => {
    const spec = readFileSync(path.join(repoRoot, 'specs/domain/wc-compile.md'), 'utf8')
    expect(existsSync(path.join(repoRoot, 'specs/domain/wc-compile.md'))).toBe(true)
    expect(spec).toContain('CREATION MUST NOT')
    expect(spec).toContain('pnpm wc:compile')
    expect(spec).toContain('@zaoly/ui/wc')
    const roundtrip = readFileSync(
      path.join(repoRoot, 'specs/domain/library-composition-roundtrip.md'),
      'utf8',
    )
    expect(roundtrip).toContain('Phase 5')
    expect(roundtrip).toContain('pnpm wc:compile')
  })
})
