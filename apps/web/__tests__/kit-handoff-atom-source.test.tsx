import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import path from 'node:path'
import {
  componentSourceRelPathFromStoryFile,
  catalogEntryForAtomSource,
  readAtomPackageSource,
} from '../lib/site-kit/atom-package-source'
import { kitPlaygroundKind } from '../lib/site-kit/kit-playground-kind'
import { siteKitGithubBlobUrl, paths } from '../lib/paths'
import { KitHandoffAtomSource, KitAtomSourcePanel } from '../components/kit-playground/kit-atom-source-panel'

vi.mock('@monaco-editor/react', () => ({
  default: function MockMonaco(props: { value?: string; 'data-testid'?: string }) {
    return (
      <pre data-testid="monaco-mock">{props.value}</pre>
    )
  },
}))

describe('kitPlaygroundKind (SK-V19 / SK-V22)', () => {
  it('classifies Atom forks as atom, compositions as pattern, Landing* as section', () => {
    expect(kitPlaygroundKind('SiteButton')).toBe('atom')
    expect(kitPlaygroundKind('Atom~aaaaaaaaaaaaaaaa~SiteButton')).toBe('atom')
    expect(kitPlaygroundKind('Composition~aaaaaaaaaaaaaaaa~Hero')).toBe('pattern')
    expect(kitPlaygroundKind('Composition:LandingNav')).toBe('section')
  })
})

describe('siteKitGithubBlobUrl (SK-V19)', () => {
  it('builds blob URL under packages/site-kit', () => {
    expect(siteKitGithubBlobUrl('src/components/Button.tsx')).toBe(
      `https://github.com/${paths.creationGithubRepo}/blob/${paths.creationGithubDefaultBranch}/${paths.siteKitPackageRelPath}/src/components/Button.tsx`,
    )
  })
})

describe('atom package source helpers (SK-V18/V19)', () => {
  it('maps storyFile to component .tsx', () => {
    expect(componentSourceRelPathFromStoryFile('src/components/Button.stories.tsx')).toBe(
      'src/components/Button.tsx',
    )
    expect(componentSourceRelPathFromStoryFile('../etc/passwd')).toBeNull()
  })

  it('resolves catalog entry for atoms and forks; patterns null', () => {
    expect(catalogEntryForAtomSource('SiteButton')?.exportName).toBe('Button')
    expect(catalogEntryForAtomSource('Atom~aaaaaaaaaaaaaaaa~SiteButton')?.id).toBe('SiteButton')
    expect(catalogEntryForAtomSource('Composition~aaaaaaaaaaaaaaaa~Hero')).toBeNull()
  })

  it('reads Button.tsx from kit package root', async () => {
    const kitRoot = path.resolve(__dirname, '../../../packages/site-kit')
    const result = await readAtomPackageSource('SiteButton', { kitRoot })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.source).toContain('export function Button')
  })
})

describe('KitAtomSourcePanel UI (SK-V19)', () => {
  beforeEach(() => {
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
  })

  it('loads path, copy-path, github link, and Monaco when expanded', async () => {
    render(
      <KitAtomSourcePanel
        componentId="SiteButton"
        kind="atom"
        storybookOrigin="https://creation-site-kit.example.test"
        testIdPrefix="kit-handoff-atom-source"
        t={(k) => k}
      />,
    )
    await waitFor(() => {
      expect(screen.getByTestId('kit-handoff-atom-source-path')).toHaveTextContent(
        'src/components/Button.tsx',
      )
    })
    expect(screen.getByTestId('kit-handoff-atom-source-copy-path')).toBeTruthy()
    expect(screen.getByTestId('kit-handoff-atom-source-github')).toHaveAttribute(
      'href',
      siteKitGithubBlobUrl('src/components/Button.tsx'),
    )
    expect(screen.getByTestId('kit-handoff-atom-source-storybook')).toBeTruthy()
    fireEvent.click(screen.getByTestId('kit-handoff-atom-source-toggle'))
    expect(screen.getByTestId('kit-handoff-atom-source-monaco')).toBeTruthy()
    await waitFor(() => {
      expect(screen.getByTestId('monaco-mock')).toHaveTextContent('export function Button')
    })
  })

  it('Atom fork fetches source (not pattern note)', async () => {
    render(
      <KitHandoffAtomSource
        componentId="Atom~aaaaaaaaaaaaaaaa~SiteButton"
        kind="atom"
        t={(k) => k}
      />,
    )
    await waitFor(() => {
      expect(screen.getByTestId('kit-handoff-atom-source-path')).toBeTruthy()
    })
    expect(screen.queryByTestId('kit-handoff-atom-source-pattern')).toBeNull()
  })

  it('shows pattern note without fetch for patterns', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(
      <KitHandoffAtomSource
        componentId="Composition~aaaaaaaaaaaaaaaa~Hero"
        kind="pattern"
        t={(k) => k}
      />,
    )
    expect(screen.getByTestId('kit-handoff-atom-source-pattern')).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
