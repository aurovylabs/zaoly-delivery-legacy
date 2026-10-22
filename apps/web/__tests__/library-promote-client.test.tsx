import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import type { CompositionScene } from '@zaoly/contracts'
import { requestLibraryPromote } from '../lib/library/promote-client'
import { paths } from '../lib/paths'

const webRoot = path.resolve(__dirname, '..')

const scene: CompositionScene = {
  id: 'scene-1',
  name: 'Promo',
  version: 1,
  platformProjectId: null,
  root: { id: 'cover', type: 'PrintCover', props: { title: 'A' } },
  updatedAt: new Date().toISOString(),
}

describe('requestLibraryPromote', () => {
  it('POSTs P1 to the paths promote route and returns the PR url', async () => {
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      expect(url).toBe(paths.routes.apiLibraryPromote)
      const body = JSON.parse(String(init?.body)) as { kind: string; nodeId: string }
      expect(body.kind).toBe('P1')
      expect(body.nodeId).toBe('cover')
      return new Response(
        JSON.stringify({
          ok: true,
          proposal: {
            writesGit: true,
            pullRequest: { htmlUrl: 'https://example.invalid/pr/9', number: 9 },
          },
        }),
        { status: 200 },
      )
    }) as unknown as typeof fetch
    const result = await requestLibraryPromote(
      { kind: 'P1', scene, nodeId: 'cover' },
      fetchImpl,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.number).toBe(9)
    expect(result.htmlUrl).toContain('/pr/9')
  })

  it('surfaces github-unconfigured without leaking a token', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          ok: false,
          error: 'GITHUB_TOKEN is not configured',
          issues: [{ code: 'github-unconfigured', message: 'GITHUB_TOKEN is not configured' }],
        }),
        { status: 503 },
      ),
    ) as unknown as typeof fetch
    const result = await requestLibraryPromote({ kind: 'P2', scene }, fetchImpl)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.code).toBe('github-unconfigured')
    expect(JSON.stringify(result)).not.toContain('github_pat_')
  })
})

describe('settings + editor promote wiring', () => {
  it('keeps settings free of suite promote / Zaoly / Plexon chrome', () => {
    const settings = readFileSync(path.join(webRoot, 'components/settings-page.tsx'), 'utf8')
    expect(settings).not.toContain('libraryPromoteGithub')
    expect(settings).not.toContain('zaolyUiSource')
    expect(settings).not.toContain('plexonBase')
    expect(settings).not.toContain('federation')
    expect(settings).not.toContain('github_pat_')
    const route = readFileSync(path.join(webRoot, 'app/settings/page.tsx'), 'utf8')
    expect(route).not.toContain('githubPromoteConfigured')
    expect(route).not.toContain('resolveZaolyUiSource')
    expect(route).not.toContain('plexonBaseUrl')
  })
})
