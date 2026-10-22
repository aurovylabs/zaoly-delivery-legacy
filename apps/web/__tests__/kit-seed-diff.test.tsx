import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { kitSeedDiffBaseId } from '../lib/site-kit/kit-seed-diff-base'
import { KitSeedDiffPanel } from '../components/kit-playground/kit-seed-diff-panel'
import { KitPlaygroundHandoffPane } from '../components/kit-playground/kit-playground-handoff'
import { buildPlaygroundHandoff } from '../lib/site-kit/playground-source'
import { paths } from '../lib/paths'

vi.mock('@monaco-editor/react', () => ({
  default: function MockMonaco() {
    return <pre data-testid="monaco-mock" />
  },
  DiffEditor: function MockDiffEditor(props: { original?: string; modified?: string }) {
    return (
      <pre data-testid="monaco-diff-mock">
        {props.original}
        {'\n---\n'}
        {props.modified}
      </pre>
    )
  },
}))

const CATALOG_SEED = 'export function Button() {\n  return <SiteButton />\n}\n'
const FORK_SEED = 'export function Button() {\n  return <SiteButton children="Fork" />\n}\n'

describe('kitSeedDiffBaseId (SK-V20)', () => {
  it('resolves Atom forks to catalog Site* and Patterns to null', () => {
    expect(kitSeedDiffBaseId('SiteButton')).toBe('SiteButton')
    expect(kitSeedDiffBaseId('Atom~aaaaaaaaaaaaaaaa~SiteButton')).toBe('SiteButton')
    expect(kitSeedDiffBaseId('Composition~aaaaaaaaaaaaaaaa~Hero')).toBeNull()
  })
})

describe('KitSeedDiffPanel (SK-V20)', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        expect(String(url)).toContain(paths.routes.apiSiteKitPlaygroundSource)
        expect(String(url)).toContain('componentId=SiteButton')
        return {
          ok: true,
          json: async () => ({ ok: true, source: CATALOG_SEED }),
        }
      }),
    )
  })

  it('Atom fork fetches catalog SiteButton seed and mounts Diff when expanded', async () => {
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    render(
      <KitSeedDiffPanel
        componentId="Atom~aaaaaaaaaaaaaaaa~SiteButton"
        modifiedSource={FORK_SEED}
        t={(k) => k}
      />,
    )
    await waitFor(() => {
      expect(screen.getByTestId('kit-seed-diff')).toBeTruthy()
      expect(screen.getByTestId('kit-seed-diff-copy-original')).toBeTruthy()
    })
    expect(fetchMock).toHaveBeenCalled()
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('componentId=SiteButton')
    expect(screen.queryByTestId('kit-seed-diff-unchanged')).toBeNull()
    fireEvent.click(screen.getByTestId('kit-seed-diff-toggle'))
    expect(screen.getByTestId('kit-seed-diff-monaco')).toBeTruthy()
    await waitFor(() => {
      expect(screen.getByTestId('monaco-diff-mock')).toHaveTextContent('SiteButton')
    })
  })

  it('identical seed shows unchanged meta and still allows expand', async () => {
    render(
      <KitSeedDiffPanel
        componentId="SiteButton"
        modifiedSource={CATALOG_SEED}
        t={(k) => k}
      />,
    )
    await waitFor(() => {
      expect(screen.getByTestId('kit-seed-diff-unchanged')).toHaveTextContent('kit.seedDiffUnchanged')
    })
    fireEvent.click(screen.getByTestId('kit-seed-diff-toggle'))
    expect(screen.getByTestId('kit-seed-diff-monaco')).toBeTruthy()
  })

  it('Patterns show note without playground-source fetch', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(
      <KitSeedDiffPanel
        componentId="Composition~aaaaaaaaaaaaaaaa~Hero"
        modifiedSource="export function Hero() { return null }"
        t={(k) => k}
      />,
    )
    expect(screen.getByTestId('kit-seed-diff-pattern')).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('Handoff mounts seed diff + package source (SK-V20)', () => {
  it('atom handoff keeps package source and adds seed diff', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const u = String(url)
        if (u.includes(paths.routes.apiSiteKitAtomSource)) {
          return {
            ok: true,
            json: async () => ({
              ok: true,
              catalogId: 'SiteButton',
              exportName: 'Button',
              packageName: '@zaoly/site-kit',
              relPath: 'src/components/Button.tsx',
              source: 'export function Button() { return null }\n',
            }),
          }
        }
        return {
          ok: true,
          json: async () => ({ ok: true, source: CATALOG_SEED }),
        }
      }),
    )
    const handoff = buildPlaygroundHandoff({
      kind: 'atom',
      exportName: 'Button',
      composition: { type: 'SiteButton', props: { children: 'Go' } },
    })
    render(
      <KitPlaygroundHandoffPane
        handoff={handoff}
        maintainer={null}
        componentId="SiteButton"
        kind="atom"
        exportName="Button"
        platformProjectId={null}
        tokenPackSource={null}
        moduleSource={CATALOG_SEED}
        tokenPackCss=""
        compositionJson='{"type":"SiteButton"}'
        shareHref="/kit?componentId=SiteButton"
        storybookOrigin={null}
        t={(k) => k}
      />,
    )
    expect(screen.getByTestId('kit-handoff-atom-source')).toBeTruthy()
    await waitFor(() => {
      expect(screen.getByTestId('kit-seed-diff')).toBeTruthy()
    })
  })
})
