import { describe, expect, it } from 'vitest'
import { generateCompositionModule } from '@zaoly/site-kit/composition-codegen'
import { SITE_KIT_CATALOG } from '../lib/site-kit/site-kit-catalog'
import { parsePlaygroundTsxToComposition } from '../lib/site-kit/playground-parse'
import { buildAtomPlaygroundSeed } from '../lib/site-kit/playground-source'
import { transpilePlaygroundTsx } from '../lib/site-kit/playground-transpile'
import {
  extractReturnJsxBalanced,
  regeneratePlaygroundSource,
  setRootProp,
} from '../lib/site-kit/playground-draft'
import { kitPlaygroundHref, paths } from '../lib/paths'
import { kitInsertTypeFromSelection } from '../lib/site-kit/kit-insert-type'
import {
  paintPlaygroundComposition,
  paintPlaygroundSceneRoot,
} from '../lib/site-kit/playground-paint'
import { EDITOR_BREAKPOINT_WIDTHS } from '../lib/scene/breakpoints'
import { mergeLivePackIntoCatalog } from '../lib/inspect/token-catalog'
import type { SceneNode } from '@zaoly/contracts'

describe('kit playground source + parse', () => {
  it('seeds SiteButton TSX and round-trips through parse', () => {
    const seed = buildAtomPlaygroundSeed('SiteButton', null)
    expect(seed?.ok).toBe(true)
    expect(seed?.source).toContain('export function Button')
    expect(seed?.source).toContain('@zaoly/site-kit')
    const parsed = parsePlaygroundTsxToComposition(seed!.source)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.composition.type).toBe('SiteButton')
    }
  })

  it('transpile succeeds for generated module', () => {
    const seed = buildAtomPlaygroundSeed('SiteText', null)
    const tr = transpilePlaygroundTsx(seed!.source)
    expect(tr.ok).toBe(true)
  })

  it('transpile fails on broken TSX', () => {
    const tr = transpilePlaygroundTsx('export function X( { return (')
    expect(tr.ok).toBe(false)
  })

  it('parse picks up prop edits in generated JSX', () => {
    const root = {
      type: 'SiteButton',
      props: { children: 'Hello', type: 'button' },
    }
    const source = generateCompositionModule('Button', root, SITE_KIT_CATALOG, {
      componentsImportPath: '@zaoly/site-kit',
    })
    const edited = source.replace('Hello', 'World')
    const parsed = parsePlaygroundTsxToComposition(edited)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.composition.props?.children).toBe('World')
    }
  })

  it('balanced extract handles nested parentheses in JSX attrs', () => {
    const src = `export function Demo() {
  return (
    <Stack style={{ gap: calc(1 + (2)) }}>
      <Text>Hi</Text>
    </Stack>
  )
}`
    const jsx = extractReturnJsxBalanced(src)
    expect(jsx).toContain('<Stack')
    expect(jsx).toContain('</Stack>')
  })

  it('prop pane helper regenerates TSX from root prop edits', () => {
    const seed = buildAtomPlaygroundSeed('SiteButton', null)!
    const next = setRootProp(seed.composition, 'children', 'Polished')
    const tsx = regeneratePlaygroundSource('Button', next)
    expect(tsx).toContain('Polished')
    const parsed = parsePlaygroundTsxToComposition(tsx)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.composition.props?.children).toBe('Polished')
  })

  it('pretty-prints multi-attr playground seeds with newlines', () => {
    const source = generateCompositionModule(
      'Hero',
      {
        type: 'SiteStack',
        props: { gap: 16 },
        style: { padding: '24px', background: 'var(--surface)' },
        children: [{ type: 'SiteText', props: { children: 'Hi' } }],
      },
      SITE_KIT_CATALOG,
      { componentsImportPath: '@zaoly/site-kit' },
    )
    expect(source).toMatch(/<Stack\n/)
    expect(source).toMatch(/padding: "24px"/)
    const parsed = parsePlaygroundTsxToComposition(source)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.composition.type).toBe('SiteStack')
      expect(parsed.composition.style?.padding).toBe('24px')
    }
  })
})

describe('kit playground paths', () => {
  it('builds /kit deep links from paths helpers', () => {
    expect(paths.routes.kit).toBe('/kit')
    expect(paths.routes.apiSiteKitPlaygroundSource).toBe('/api/site-kit/playground-source')
    expect(paths.kitPlaygroundDraftStorageKey).toContain('playground.draft')
    expect(paths.editorInsertTypeQueryParam).toBe('insertType')
    expect(kitPlaygroundHref()).toBe('/kit')
    expect(
      kitPlaygroundHref({
        componentId: 'SiteButton',
        platformProjectId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      }),
    ).toContain('componentId=SiteButton')
  })

  it('maps playground selection to editor insertType', () => {
    expect(
      kitInsertTypeFromSelection({ kind: 'atom', componentId: 'SiteButton' }),
    ).toBe('SiteButton')
    expect(
      kitInsertTypeFromSelection({
        kind: 'pattern',
        componentId: 'CompositionHero',
        exportName: 'Hero',
      }),
    ).toBe('Composition:Hero')
    expect(
      kitInsertTypeFromSelection({
        kind: 'section',
        componentId: 'Composition:LandingNav',
        exportName: 'LandingNav',
      }),
    ).toBe('Composition:LandingNav')
    expect(kitInsertTypeFromSelection(null)).toBeNull()
  })

  it('paints tokenBindings with a live catalog leaf', () => {
    const catalog = mergeLivePackIntoCatalog([
      {
        path: 'color.action.primary',
        type: 'color',
        value: '#00ca55',
        status: 'active',
      },
    ])
    const painted = paintPlaygroundComposition(
      {
        type: 'SiteButton',
        props: { children: 'Go', type: 'button' },
        tokenBindings: { background: 'color.action.primary' },
      },
      { tokenCatalog: catalog, breakpoint: 'desktop' },
    )
    const bg = String(painted.style?.background ?? painted.style?.backgroundColor ?? '')
    expect(bg.toLowerCase()).toContain('#00ca55')
  })

  it('cascade paint differs when scene root carries mobile breakpoint props', () => {
    const root: SceneNode = {
      id: 'n1',
      type: 'SiteText',
      props: { children: 'Desk', role: 'body' },
      breakpoints: {
        mobile: { props: { children: 'Phone' } },
      },
    }
    const desktop = paintPlaygroundSceneRoot(root, { breakpoint: 'desktop' })
    const mobile = paintPlaygroundSceneRoot(root, { breakpoint: 'mobile' })
    expect(desktop.props.children).toBe('Desk')
    expect(mobile.props.children).toBe('Phone')
  })

  it('flat kit composition stays stable across viewport paint (single-BP SSOT)', () => {
    const node = {
      type: 'SiteButton',
      props: { children: 'Flat', type: 'button' },
    }
    const a = paintPlaygroundComposition(node, { breakpoint: 'desktop' })
    const b = paintPlaygroundComposition(node, { breakpoint: 'mobile' })
    expect(a.props.children).toBe('Flat')
    expect(b.props.children).toBe('Flat')
  })

  it('viewport widths match editor breakpoints', () => {
    expect(EDITOR_BREAKPOINT_WIDTHS.desktop).toBeGreaterThan(EDITOR_BREAKPOINT_WIDTHS.tablet)
    expect(EDITOR_BREAKPOINT_WIDTHS.tablet).toBeGreaterThan(EDITOR_BREAKPOINT_WIDTHS.mobile)
  })

  it('documents playground-source as read-only in the route module', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const src = readFileSync(
      resolve(__dirname, '../app/api/site-kit/playground-source/route.ts'),
      'utf8',
    )
    expect(src).toContain('export async function GET')
    expect(src).not.toMatch(/export async function POST/)
    expect(src).toContain('never writes')
  })
})
