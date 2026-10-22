import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  buildAtomPlaygroundSeed,
  buildPatternPlaygroundSeed,
  buildPlaygroundHandoff,
  buildPlaygroundMaintainer,
  consumerImportPath,
  kitRevisionForOverride,
} from '../lib/site-kit/playground-source'
import { compositionPackageImportPath } from '@zaoly/site-kit/composition-codegen'
import { KitPlaygroundHandoffPane } from '../components/kit-playground/kit-playground-handoff'
import { paths } from '../lib/paths'

const COLLECTION = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'

describe('kit playground developer handoff (SK-V10 / SK-V11)', () => {
  it('atom seed with tokenBindings emits var(--ds-*) and tokenBindings export (SK-V13)', () => {
    const seed = buildAtomPlaygroundSeed('SiteButton', {
      componentId: 'SiteButton',
      composition: {
        type: 'SiteButton',
        props: { children: 'Go' },
        style: { color: '#ff0000' },
        tokenBindings: { color: 'color.action.primary' },
      },
      updatedAt: '2026-09-13T00:00:00.000Z',
    })
    expect(seed?.source).toContain('var(--ds-color-action-primary)')
    expect(seed?.source).toContain('export const tokenBindings')
    expect(seed?.source).toContain('color.action.primary')
    expect(seed?.source).not.toContain('color: "#ff0000"')
  })

  it('atoms use package barrel import path', () => {
    expect(
      consumerImportPath({ kind: 'atom', exportName: 'Button', platformProjectId: COLLECTION }),
    ).toBe(paths.siteKitPackageName)
  })

  it('patterns with Collection use scoped package import', () => {
    const path = consumerImportPath({
      kind: 'pattern',
      exportName: 'Newsletter',
      platformProjectId: COLLECTION,
    })
    expect(path).toBe(compositionPackageImportPath('Newsletter', COLLECTION))
    expect(path).toContain('/c/')
    expect(path).toContain('Newsletter')
  })

  it('atom seed payload includes handoff + catalog kitRevision', () => {
    const seed = buildAtomPlaygroundSeed('SiteButton', null)
    expect(seed?.ok).toBe(true)
    expect(seed?.packageName).toBe(paths.siteKitPackageName)
    expect(seed?.installCommand).toBe(`pnpm add ${paths.siteKitPackageName}`)
    expect(seed?.importPath).toBe(paths.siteKitPackageName)
    expect(seed?.usageImport).toContain("from '@zaoly/site-kit'")
    expect(seed?.allowedProps).toContain('variant')
    expect(seed?.rootType).toBe('SiteButton')
    expect(seed?.source).toContain("from '@zaoly/site-kit'")
    expect(seed?.kitRevision).toBe('catalog:SiteButton')
    expect(seed?.storyTitle).toContain('Button')
  })

  it('pattern seed keeps atom barrel in TSX but scoped consumer importPath', () => {
    const seed = buildPatternPlaygroundSeed({
      componentId: `Composition~${COLLECTION.slice(0, 8)}~Newsletter`,
      exportName: 'Newsletter',
      platformProjectId: COLLECTION,
      updatedAt: '2026-09-12T20:00:00.000Z',
      variants: [
        { id: 'v1', name: 'Default', composition: { type: 'SiteStack', props: {} } },
        { id: 'v2', name: 'Alt', composition: { type: 'SiteStack', props: {} } },
      ],
      composition: {
        type: 'SiteStack',
        props: {},
        children: [{ type: 'SiteText', props: { children: 'Hi' } }],
      },
    })
    expect(seed.importPath).toBe(compositionPackageImportPath('Newsletter', COLLECTION))
    expect(seed.usageImport).toContain(seed.importPath)
    expect(seed.source).toContain("from '@zaoly/site-kit'")
    expect(seed.source).not.toContain('/c/')
    expect(seed.allowedProps).toContain('name')
    expect(seed.kitRevision).toBe('override:2026-09-12T20:00:00.000Z')
    expect(seed.variantCount).toBe(2)
    expect(seed.axisCount).toBe(0)
    expect(seed.updatedAt).toBe('2026-09-12T20:00:00.000Z')
  })

  it('buildPlaygroundHandoff lists sorted allowed props', () => {
    const handoff = buildPlaygroundHandoff({
      kind: 'atom',
      exportName: 'Text',
      composition: { type: 'SiteText', props: { children: 'x' } },
    })
    expect(handoff.allowedProps).toEqual([...handoff.allowedProps].sort())
    expect(handoff.allowedProps).toContain('role')
  })

  it('kitRevisionForOverride prefers override stamp', () => {
    expect(kitRevisionForOverride('SiteButton', null)).toBe('catalog:SiteButton')
    expect(kitRevisionForOverride('SiteButton', '2026-01-01T00:00:00.000Z')).toBe(
      'override:2026-01-01T00:00:00.000Z',
    )
  })

  it('handoff pane renders consumer + maintainer surfaces', async () => {
    const handoff = buildPlaygroundHandoff({
      kind: 'pattern',
      exportName: 'Newsletter',
      platformProjectId: COLLECTION,
      composition: { type: 'SiteStack', props: {} },
    })
    const maintainer = buildPlaygroundMaintainer({
      componentId: 'Composition~test~Newsletter',
      exportName: 'Newsletter',
      platformProjectId: COLLECTION,
      updatedAt: '2026-09-12T20:00:00.000Z',
      variants: [{ id: 'v1', name: 'Default' }],
    })
    const openSpy = vi.fn()
    vi.stubGlobal('open', openSpy)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          ok: true,
          viewToken: 'tok-test',
          platformProjectId: COLLECTION,
          expiresAt: '2099-01-01T00:00:00.000Z',
        }),
      })),
    )
    render(
      <KitPlaygroundHandoffPane
        handoff={handoff}
        maintainer={maintainer}
        componentId="Composition~test~Newsletter"
        kind="pattern"
        exportName="Newsletter"
        platformProjectId={COLLECTION}
        tokenPackSource="local"
        moduleSource={'export function Newsletter() {\n  return null\n}\n'}
        tokenPackCss={':root {\n  --ds-color-action-primary: #1f44ff;\n}\n'}
        bindingPaths={['color.action.primary']}
        tokenCatalog={[
          {
            path: 'color.action.primary',
            group: 'color',
            label: 'color.action.primary',
            preview: '#1f44ff',
            type: 'color',
          },
        ]}
        compositionJson='{"type":"SiteStack"}'
        shareHref="/kit?componentId=Composition~test~Newsletter"
        storybookOrigin="https://creation-site-kit.example.test"
        t={(k) => k}
      />,
    )
    expect(screen.getByTestId('kit-handoff-pane')).toBeTruthy()
    expect(screen.getByTestId('kit-handoff-install')).toBeTruthy()
    expect(screen.getByTestId('kit-handoff-import')).toHaveTextContent(handoff.usageImport)
    expect(screen.getByTestId('kit-handoff-contract')).toBeTruthy()
    expect(screen.getByTestId('kit-handoff-tokens')).toHaveTextContent('kit.tokenPackLocal')
    expect(screen.getByTestId('kit-handoff-ds-tokens-note')).toHaveTextContent(
      'kit.handoffDsTokensNote',
    )
    expect(screen.getByTestId('kit-handoff-token-board')).toBeTruthy()
    expect(screen.getByTestId('kit-handoff-token-color.action.primary')).toHaveTextContent(
      'color.action.primary',
    )
    expect(screen.getByTestId('kit-handoff-token-color.action.primary')).toHaveTextContent(
      '--ds-color-action-primary',
    )
    expect(screen.queryByTestId('kit-handoff-token-pack-css')).toBeNull()
    fireEvent.click(screen.getByTestId('kit-handoff-token-pack-css-toggle'))
    expect(screen.getByTestId('kit-handoff-token-pack-css')).toHaveTextContent(
      '--ds-color-action-primary',
    )
    expect(screen.getByTestId('kit-handoff-cdn-pattern-note')).toHaveTextContent(
      'kit.handoffCdnPatternNote',
    )
    expect(screen.getByTestId('kit-seed-diff-pattern')).toBeTruthy()
    expect(screen.queryByTestId('kit-handoff-cdn-import')).toBeNull()
    expect(screen.getByTestId('kit-maintainer-revision')).toHaveTextContent(
      'override:2026-09-12T20:00:00.000Z',
    )
    expect(screen.getByTestId('kit-maintainer-variants')).toHaveTextContent('1')
    expect(screen.getByTestId('kit-maintainer-library')).toBeTruthy()
    expect(screen.getByTestId('kit-maintainer-storybook-csf')).toBeTruthy()
    expect(screen.getByTestId('kit-maintainer-storybook-live')).toBeTruthy()
    expect(screen.getByTestId('kit-maintainer-pull-hint')).toBeTruthy()

    fireEvent.click(screen.getByTestId('kit-maintainer-json-toggle'))
    expect(screen.getByTestId('kit-maintainer-json-body')).toHaveTextContent('"type":"SiteStack"')

    const writeText = vi.fn(async () => undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    fireEvent.click(screen.getByTestId('kit-handoff-install-copy'))
    expect(writeText).toHaveBeenCalledWith(handoff.installCommand)

    fireEvent.click(screen.getByTestId('kit-maintainer-storybook-live'))
    await vi.waitFor(() => {
      expect(openSpy).toHaveBeenCalled()
    })
    const opened = String(openSpy.mock.calls[0]?.[0] ?? '')
    expect(opened).toContain('tok-test')
    expect(opened).toContain(COLLECTION)
  })

  it('atom handoff shows CDN ESM import snippet (SK-V14)', () => {
    const handoff = buildPlaygroundHandoff({
      kind: 'atom',
      exportName: 'Button',
      composition: { type: 'SiteButton', props: { children: 'Go' } },
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          ok: true,
          catalogId: 'SiteButton',
          exportName: 'Button',
          packageName: '@zaoly/site-kit',
          relPath: 'src/components/Button.tsx',
          source: 'export function Button() { return null }\n',
        }),
      })),
    )
    render(
      <KitPlaygroundHandoffPane
        handoff={handoff}
        maintainer={null}
        componentId="SiteButton"
        kind="atom"
        exportName="Button"
        platformProjectId={null}
        tokenPackSource={null}
        moduleSource="export function Button() { return null }"
        tokenPackCss=""
        compositionJson='{"type":"SiteButton"}'
        shareHref="/kit?componentId=SiteButton"
        storybookOrigin={null}
        t={(k) => k}
      />,
    )
    const cdnImport = screen.getByTestId('kit-handoff-cdn-import')
    expect(cdnImport).toHaveTextContent("import { Button } from '")
    expect(cdnImport).toHaveTextContent('/cdn/site-kit.js')
    expect(screen.getByTestId('kit-handoff-cdn-css')).toHaveTextContent('/cdn/site-kit.css')
    expect(screen.queryByTestId('kit-handoff-cdn-pattern-note')).toBeNull()
    expect(screen.getByTestId('kit-seed-diff')).toBeTruthy()
    expect(screen.getByTestId('kit-handoff-token-board-empty')).toHaveTextContent(
      'kit.handoffTokensBoardEmpty',
    )
    expect(screen.getByTestId('kit-handoff-token-pack-css-empty')).toHaveTextContent(
      'kit.handoffTokenPackCssEmpty',
    )
  })
})

describe('openSiteKitStorybookHref (SK-V12)', () => {
  it('mints view token and opens credentialed URL', async () => {
    const { openSiteKitStorybookHref, withSiteKitViewCredentials } = await import(
      '../lib/site-kit/storybook-href'
    )
    const openSpy = vi.fn()
    vi.stubGlobal('open', openSpy)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          ok: true,
          viewToken: 'tok-abc',
          platformProjectId: COLLECTION,
        }),
      })),
    )
    const base = 'https://creation-site-kit.example.test/?path=/story/compositions-live--default'
    const ok = await openSiteKitStorybookHref({
      href: base,
      platformProjectId: COLLECTION,
    })
    expect(ok).toBe(true)
    expect(openSpy).toHaveBeenCalled()
    const opened = String(openSpy.mock.calls[0]?.[0] ?? '')
    expect(opened).toContain('tok-abc')
    expect(opened).toContain(COLLECTION)
    expect(opened).toBe(
      withSiteKitViewCredentials(base, {
        viewToken: 'tok-abc',
        platformProjectId: COLLECTION,
      }),
    )
  })
})
