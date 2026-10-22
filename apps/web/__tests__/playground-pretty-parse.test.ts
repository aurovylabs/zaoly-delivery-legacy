import { describe, expect, it } from 'vitest'
import { generateCompositionModule } from '@zaoly/site-kit/composition-codegen'
import { SITE_KIT_CATALOG } from '../lib/site-kit/site-kit-catalog'
import { parsePlaygroundTsxToComposition } from '../lib/site-kit/playground-parse'
import { buildAtomPlaygroundSeed } from '../lib/site-kit/playground-source'

describe('playground pretty-print parse round-trip', () => {
  it('parses SVG markup that contains > inside string attrs', () => {
    const src = generateCompositionModule(
      'Mark',
      {
        type: 'SiteSvg',
        props: {
          markup: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>',
          alt: 'mark',
        },
      },
      SITE_KIT_CATALOG,
      { componentsImportPath: '@zaoly/site-kit' },
    )
    const parsed = parsePlaygroundTsxToComposition(src)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.composition.type).toBe('SiteSvg')
      expect(String(parsed.composition.props?.markup)).toContain('<path')
      expect(parsed.composition.props?.alt).toBe('mark')
    }
  })

  it('parses pretty multi-line style and nested children', () => {
    const src = generateCompositionModule(
      'Hero',
      {
        type: 'SiteStack',
        props: { gap: 16 },
        style: { padding: '24px', background: 'var(--surface)' },
        children: [
          { type: 'SiteText', props: { role: 'title', children: 'Hello' } },
          {
            type: 'SiteSvg',
            props: { markup: '<svg><circle r="1"/></svg>', alt: 'dot' },
          },
        ],
      },
      SITE_KIT_CATALOG,
      { componentsImportPath: '@zaoly/site-kit' },
    )
    const parsed = parsePlaygroundTsxToComposition(src)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.composition.style?.padding).toBe('24px')
      expect(parsed.composition.style?.background).toBe('var(--surface)')
      expect(parsed.composition.children?.length).toBe(2)
      expect(parsed.composition.children?.[1]?.type).toBe('SiteSvg')
    }
  })

  it('parses pretty-printed Select options arrays', () => {
    const src = generateCompositionModule(
      'SelectDemo',
      {
        type: 'SiteSelect',
        props: {
          name: 'size',
          options: [
            { label: 'S', value: 's' },
            { label: 'M', value: 'm' },
          ],
        },
      },
      SITE_KIT_CATALOG,
      { componentsImportPath: '@zaoly/site-kit' },
    )
    const parsed = parsePlaygroundTsxToComposition(src)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.composition.props?.options).toEqual([
        { label: 'S', value: 's' },
        { label: 'M', value: 'm' },
      ])
    }
  })

  it('still parses every atom seed', () => {
    for (const entry of SITE_KIT_CATALOG) {
      const seed = buildAtomPlaygroundSeed(entry.id, null)
      if (!seed) continue
      const parsed = parsePlaygroundTsxToComposition(seed.source)
      expect(parsed.ok, entry.id).toBe(true)
    }
  })
})
