import { describe, expect, it } from 'vitest'
import {
  tokenPathToCssVar,
  tokenPathToCssVarRef,
  escapeJsxText,
  generateCompositionModule,
  generateCompositionStory,
  compositionStoryTitle,
  jsxPropExpression,
  storyExportName,
  validateCompositionTree,
  validateNamedCompositionVariants,
  compositionVariantStoryName,
  MAX_TREE_DEPTH,
  MAX_TREE_NODES,
} from './index'
import { SITE_KIT_CATALOG } from '../catalog'

describe('composition-codegen identifiers', () => {
  it('normalizes leading-digit variant names to valid exports', () => {
    expect(storyExportName('3-up')).toBe('Up3')
    expect(storyExportName('3col')).toBe('Col3')
  })

  it('handles punctuation-only and unicode labels', () => {
    expect(storyExportName('---')).toBe('Variant')
    expect(storyExportName('café')).toBe('Caf')
  })

  it('avoids composition export collision via Variant suffix', () => {
    expect(compositionVariantStoryName('test', 'Test')).toBe('TestVariant')
    expect(compositionVariantStoryName('3-up', 'Up3')).toBe('Up3Variant')
  })
})

describe('composition-codegen SK-S5 package imports', () => {
  it('aligns import path with compositionScopeKey', async () => {
    const {
      compositionPackageImportPath,
      compositionScopeKey,
      SITE_KIT_PACKAGE_NAME,
      generateCompositionCollectionBarrel,
    } = await import('./index')
    const pid = 'collection-xyz'
    expect(compositionPackageImportPath('Hero', pid)).toBe(
      `${SITE_KIT_PACKAGE_NAME}/c/${compositionScopeKey(pid)}/Hero`,
    )
    expect(generateCompositionCollectionBarrel([])).toContain('export {}')
  })
})

describe('composition-codegen generate', () => {
  it('escapes braces and script-like text in JSX', () => {
    const src = generateCompositionModule('BraceTest', {
      type: 'SiteText',
      props: { children: '{token} </script> &' },
    }, SITE_KIT_CATALOG)
    expect(src).toContain('&#123;token&#125;')
    expect(src).toContain('&lt;/script&gt;')
    expect(src).toContain('&amp;')
  })

  it('emits valid JSX for array props', () => {
    expect(jsxPropExpression([{ label: 'A', value: 'a' }])).toBe(
      '[{"label":"A","value":"a"}]',
    )
    const src = generateCompositionModule('SelectDemo', {
      type: 'SiteSelect',
      props: {
        name: 'size',
        options: [
          { label: 'S', value: 's' },
          { label: 'M', value: 'm' },
        ],
      },
    }, SITE_KIT_CATALOG)
    expect(src).toContain('options={')
    expect(src).toContain('"label": "S"')
    expect(src).toContain('"value": "s"')
    expect(src).not.toContain('options={{')
  })

  it('pretty-prints multi-prop and multi-key style across lines', () => {
    const src = generateCompositionModule(
      'Hero',
      {
        type: 'SiteStack',
        props: { gap: 16 },
        style: { padding: '24px', background: 'var(--surface)' },
        children: [
          {
            type: 'SiteText',
            props: { role: 'title', children: 'Hello' },
          },
        ],
      },
      SITE_KIT_CATALOG,
    )
    expect(src).toMatch(/<Stack\n/)
    expect(src).toMatch(/^\s+gap=\{16\}$/m)
    expect(src).toMatch(/^\s+style=\{\{$/m)
    expect(src).toMatch(/^\s+padding: "24px",$/m)
    expect(src).toMatch(/^\s+background: "var\(--surface\)",$/m)
    expect(src).toContain('Hello')
  })

  it('keeps short single-attribute tags on one line', () => {
    const src = generateCompositionModule(
      'Short',
      {
        type: 'SiteButton',
        props: { variant: 'primary', children: 'Go' },
      },
      SITE_KIT_CATALOG,
    )
    expect(src).toContain('<Button variant={"primary"}>Go</Button>')
    expect(src).not.toMatch(/<Button\n/)
  })

  it('maps tokenBindings to var(--ds-*) style and exports tokenBindings map (SK-V13)', () => {
    expect(tokenPathToCssVar('color.action.primary')).toBe('--ds-color-action-primary')
    expect(tokenPathToCssVarRef('spacing.static.medium')).toBe(
      'var(--ds-spacing-static-medium)',
    )

    const src = generateCompositionModule(
      'Hero',
      {
        type: 'SiteStack',
        style: { gap: '16px', padding: '24px' },
        tokenBindings: {
          gap: 'spacing.static.medium',
          color: 'color.action.primary',
        },
        children: [
          {
            type: 'SiteButton',
            props: { children: 'Go' },
            style: { color: '#ff0000' },
            tokenBindings: { color: 'color.action.primary' },
          },
        ],
      },
      SITE_KIT_CATALOG,
    )
    expect(src).toContain('export const tokenBindings')
    expect(src).toContain('"root"')
    expect(src).toContain('"gap": "spacing.static.medium"')
    expect(src).toContain('"root/0"')
    expect(src).toContain('var(--ds-spacing-static-medium)')
    expect(src).toContain('var(--ds-color-action-primary)')
    expect(src).not.toContain('gap: "16px"')
    expect(src).not.toContain('color: "#ff0000"')
    expect(src).toContain('padding: "24px"')
  })

  it('omits tokenBindings export when tree has no bindings', () => {
    const src = generateCompositionModule(
      'Plain',
      { type: 'SiteButton', props: { children: 'Go' } },
      SITE_KIT_CATALOG,
    )
    expect(src).not.toContain('export const tokenBindings')
  })

  it('rejects dangerous props during validation', () => {
    const bad = validateCompositionTree(
      {
        type: 'SiteText',
        props: { children: 'x', dangerouslySetInnerHTML: '<img>' },
      },
      SITE_KIT_CATALOG,
    )
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(bad.error).toContain('dangerouslySetInnerHTML')
  })

  it('rejects unknown props and nested objects', () => {
    const unknown = validateCompositionTree(
      { type: 'SiteButton', props: { children: 'Go', onClick: 'noop' } },
      SITE_KIT_CATALOG,
    )
    expect(unknown.ok).toBe(false)

    const objectProp = validateCompositionTree(
      { type: 'SiteButton', props: { children: 'Go', variant: { evil: true } } },
      SITE_KIT_CATALOG,
    )
    expect(objectProp.ok).toBe(false)
  })

  it('treats rowGap/columnGap as paint keys (not SiteStack contract props)', () => {
    const rowGap = validateCompositionTree(
      { type: 'SiteStack', props: { rowGap: '16px' } },
      SITE_KIT_CATALOG,
    )
    expect(rowGap.ok).toBe(false)
    if (!rowGap.ok) expect(rowGap.error).toContain('paint key')

    const ok = validateCompositionTree(
      { type: 'SiteStack', props: {}, style: { rowGap: '16px' } },
      SITE_KIT_CATALOG,
    )
    expect(ok.ok).toBe(true)
  })

  it('treats zIndex as a paint key', () => {
    const z = validateCompositionTree(
      { type: 'SiteStack', props: { zIndex: '2' } },
      SITE_KIT_CATALOG,
    )
    expect(z.ok).toBe(false)
    if (!z.ok) expect(z.error).toMatch(/paint key|zIndex/)
  })
})

describe('composition-codegen tree limits', () => {
  function chain(depth: number): { type: string; props: Record<string, unknown>; children?: unknown[] } {
    if (depth <= 1) return { type: 'SiteText', props: { children: 'leaf' } }
    return {
      type: 'SiteStack',
      props: {},
      children: [chain(depth - 1)],
    }
  }

  it(`accepts trees up to ${MAX_TREE_NODES} nodes`, () => {
    const children = Array.from({ length: MAX_TREE_NODES - 1 }, () => ({
      type: 'SiteText',
      props: { children: 'x' },
    }))
    const ok = validateCompositionTree(
      { type: 'SiteStack', props: {}, children },
      SITE_KIT_CATALOG,
    )
    expect(ok.ok).toBe(true)
  })

  it(`rejects depth ${MAX_TREE_DEPTH + 1}`, () => {
    const bad = validateCompositionTree(chain(MAX_TREE_DEPTH + 1), SITE_KIT_CATALOG)
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(bad.error).toContain('depth')
  })
})

describe('composition-codegen variants', () => {
  it('rejects duplicate normalized variant story names', () => {
    const bad = validateNamedCompositionVariants(
      [
        { id: 'v1', name: 'Hover', composition: { type: 'SiteButton', props: {} } },
        { id: 'v2', name: 'hover', composition: { type: 'SiteButton', props: {} } },
      ],
      'CardSet',
    )
    expect(bad.ok).toBe(false)
  })
})

describe('catalog parity', () => {
  it('includes SiteImage for hydration scripts', () => {
    expect(SITE_KIT_CATALOG.some((e) => e.id === 'SiteImage')).toBe(true)
  })

  it('includes SiteSvg for hydration scripts', () => {
    expect(SITE_KIT_CATALOG.some((e) => e.id === 'SiteSvg')).toBe(true)
  })
})

describe('escapeJsxText', () => {
  it('escapes multiline content', () => {
    expect(escapeJsxText('line1\n{brace}')).toBe('line1\n&#123;brace&#125;')
  })
})

describe('composition story titles', () => {
  it('emits Collection-scoped CSF titles', () => {
    expect(compositionStoryTitle('Hero', null)).toBe('Compositions/Shared/Hero')
    expect(compositionStoryTitle('Hero', 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee')).toBe(
      'Compositions/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee/Hero',
    )
    const src = generateCompositionStory('Hero', SITE_KIT_CATALOG, undefined, {
      platformProjectId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    })
    expect(src).toContain(
      'title: "Compositions/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee/Hero"',
    )
  })

  it('emits Component Set axis controls on composition CSF', () => {
    const src = generateCompositionStory(
      'Hero',
      SITE_KIT_CATALOG,
      [
        {
          id: 'v1',
          name: 'Default',
          combination: { 'axis-variant': 'Default' },
          composition: { type: 'SiteStack', props: {} },
        },
        {
          id: 'v2',
          name: 'Alt',
          combination: { 'axis-variant': 'Alt' },
          composition: { type: 'SiteStack', props: {} },
        },
      ],
      {
        componentId: 'Composition~scope~Hero',
        axes: [{ id: 'axis-variant', name: 'Variant', values: ['Default', 'Alt'] }],
      },
    )
    expect(src).toContain('component-set')
    expect(src).toContain('"axis-variant"')
    expect(src).toContain('Master Component Set axis')
  })
})
