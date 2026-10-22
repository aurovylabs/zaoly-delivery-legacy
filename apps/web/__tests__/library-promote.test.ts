import { describe, expect, it, vi } from 'vitest'

vi.mock('../auth', () => ({
  auth: vi.fn(async () => ({ user: { id: 'test-user' } })),
}))

vi.mock('next/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server')
  return {
    ...actual,
    connection: vi.fn(async () => undefined),
  }
})

import type { CompositionScene, SceneNode } from '@zaoly/contracts'
import { POST as promotePost } from '../app/api/library/promote/route'
import { POST as dryRunPost } from '../app/api/library/promote/dry-run/route'
import { GET as healthGet } from '../app/api/health/route'
import { applyLibraryPromote } from '../lib/library/promote'
import { createFetchGithubPort, promoteBranchName, type PromoteGithubPort } from '../lib/library/github-promote'
import { isAllowedPromoteGitPath } from '../lib/library/promote-files'
import { dryRunLibraryPromote } from '../lib/library/promote-dry-run'
import { paths } from '../lib/paths'

function sceneWith(nodes: SceneNode[]): CompositionScene {
  return {
    id: 'scene-promote',
    name: 'Promote',
    version: 1,
    platformProjectId: 'plx-collection-1',
    root: { id: 'root', type: 'Stack', children: nodes },
    updatedAt: new Date().toISOString(),
  }
}

function p1Body() {
  return {
    kind: 'P1' as const,
    nodeId: 'cover',
    scene: sceneWith([{ id: 'cover', type: 'PrintCover', props: { title: 'Quick Check' } }]),
  }
}

function fakeGithub(seed: Record<string, string> = {}): PromoteGithubPort & {
  branches: string[]
  files: { path: string; branch: string; contents: string }[]
  prs: { branch: string; title: string }[]
} {
  const branches: string[] = []
  const files: { path: string; branch: string; contents: string }[] = []
  const prs: { branch: string; title: string }[] = []
  return {
    branches,
    files,
    prs,
    async ensureBranch({ branch, base }) {
      expect(branch).not.toBe(base)
      expect(branch.startsWith(paths.githubPromoteBranchPrefix)).toBe(true)
      if (!branches.includes(branch)) branches.push(branch)
    },
    async getFile({ path }) {
      const hit = [...files].reverse().find((f) => f.path === path)
      if (hit) return hit.contents
      return seed[path] ?? null
    },
    async putFile({ branch, path, contents }) {
      expect(branch).not.toBe(paths.githubPromoteBaseBranch)
      expect(isAllowedPromoteGitPath(path)).toBe(true)
      files.push({ path, branch, contents })
    },
    async ensurePullRequest({ branch, base, title }) {
      expect(branch).not.toBe(base)
      prs.push({ branch, title })
      return {
        htmlUrl: `https://github.com/${paths.zaolyUiGithubRepo}/pull/42`,
        number: 42,
        branch,
      }
    },
  }
}

describe('library promote Phase 4', () => {
  it('dry-run P1 writes generator-shaped promoted stories, not Default', () => {
    const result = dryRunLibraryPromote(p1Body())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.proposal.files[0]?.path).toBe(
      'packages/ui/src/print/PrintCover.promoted.stories.tsx',
    )
    expect(result.proposal.files[0]?.path).not.toContain('PrintCover.stories.tsx')
    expect(result.proposal.files[0]?.contents).toContain('export const Promoted')
    expect(result.proposal.files[0]?.contents).toContain('Quick Check')
  })

  it('POST /api/library/promote without token is github-unconfigured and does not write git', async () => {
    expect(paths.routes.apiLibraryPromote).toBe('/api/library/promote')
    const prev = process.env[paths.envGithubToken]
    delete process.env[paths.envGithubToken]
    try {
      const res = await promotePost(
        new Request(`http://localhost${paths.routes.apiLibraryPromote}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(p1Body()),
        }),
      )
      expect(res.status).toBe(503)
      const body = (await res.json()) as { ok: boolean; issues: { code: string }[] }
      expect(body.ok).toBe(false)
      expect(body.issues[0]?.code).toBe('github-unconfigured')
    } finally {
      if (prev != null) process.env[paths.envGithubToken] = prev
      else delete process.env[paths.envGithubToken]
    }
  })

  it('P3 stays 400 dev-track even when a GitHub port is injected', async () => {
    const github = fakeGithub()
    const result = await applyLibraryPromote(
      { kind: 'P3', scene: p1Body().scene },
      { github },
    )
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.issues[0]?.code).toBe('dev-track')
    expect(github.files).toHaveLength(0)
    expect(github.prs).toHaveLength(0)
  })

  it('P1 with fake GitHub port opens a PR and never writes main', async () => {
    const github = fakeGithub()
    const result = await applyLibraryPromote(p1Body(), { github })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.proposal.writesGit).toBe(true)
    expect(result.proposal.pullRequest?.number).toBe(42)
    expect(result.proposal.pullRequest?.branch).toBe(promoteBranchName('P1', 'cover'))
    expect(github.files[0]?.branch).toBe(promoteBranchName('P1', 'cover'))
    expect(github.files[0]?.path).toContain('.promoted.stories.tsx')
    expect(github.branches).not.toContain(paths.githubPromoteBaseBranch)
  })

  it('P1 atom stories import from ./Type, not ../components', () => {
    const result = dryRunLibraryPromote({
      kind: 'P1',
      nodeId: 'label',
      scene: sceneWith([
        {
          id: 'label',
          type: 'Text',
          props: { children: 'GEO', role: 'title' },
          tokenBindings: { color: 'color.neutral.700' },
        },
      ]),
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const contents = result.proposal.files[0]?.contents ?? ''
    expect(result.proposal.files[0]?.path).toBe(
      'packages/ui/src/components/Text.promoted.stories.tsx',
    )
    expect(contents).toContain("import { Text } from './Text'")
    expect(contents).not.toContain('../components/')
    expect(contents).not.toContain('<Text')
    expect(contents).not.toContain('render:')
    expect(contents).toContain('"tokenBindings"')
    expect(contents).toMatch(/parameters:[\s\S]*tokenBindings/)
    expect(contents).not.toMatch(/args:[\s\S]*tokenBindings/)
  })

  it('P1 print stories import PrintPrimitives from ./', () => {
    const result = dryRunLibraryPromote(p1Body())
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const contents = result.proposal.files[0]?.contents ?? ''
    expect(contents).toContain(
      "import { PrintPage, PrintCover } from './PrintPrimitives'",
    )
    expect(contents).toContain('createElement(PrintPage')
    expect(contents).not.toContain('<PrintPage')
    expect(contents).not.toContain('<PrintCover')
  })

  it('P2 is idempotent on an existing promote branch/PR', async () => {
    const github = fakeGithub()
    const input = { kind: 'P2' as const, scene: p1Body().scene }
    const first = await applyLibraryPromote(input, { github })
    const second = await applyLibraryPromote(input, { github })
    expect(first.ok && second.ok).toBe(true)
    expect(github.branches).toEqual([promoteBranchName('P2', 'scene-promote')])
    expect(github.files).toHaveLength(2)
    expect(github.prs).toHaveLength(2)
  })

  it('createFetchGithubPort talks to the paths API base and never PUTs main', async () => {
    const calls: { method: string; url: string; body?: unknown }[] = []
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input)
      const method = init?.method ?? 'GET'
      const body = init?.body ? JSON.parse(String(init.body)) : undefined
      calls.push({ method, url, body })
      if (method === 'GET' && url.includes('/git/ref/heads/main')) {
        return new Response(JSON.stringify({ object: { sha: 'abc123' } }), { status: 200 })
      }
      if (method === 'GET' && url.includes('/git/ref/heads/promote/')) {
        return new Response('{}', { status: 404 })
      }
      if (method === 'POST' && url.endsWith('/git/refs')) {
        return new Response(JSON.stringify({ ref: body.ref }), { status: 201 })
      }
      if (method === 'GET' && url.includes('/contents/')) {
        return new Response('{}', { status: 404 })
      }
      if (method === 'PUT' && url.includes('/contents/')) {
        return new Response(JSON.stringify({ content: { path: 'ok' } }), { status: 201 })
      }
      if (method === 'GET' && url.includes('/pulls?')) {
        return new Response('[]', { status: 200 })
      }
      if (method === 'POST' && url.endsWith('/pulls')) {
        return new Response(
          JSON.stringify({ html_url: 'https://github.com/aurovylabs/zaoly-delivery/pull/7', number: 7 }),
          { status: 201 },
        )
      }
      return new Response('unexpected', { status: 500 })
    }

    const port = createFetchGithubPort({
      token: 'test-token',
      apiBase: paths.githubApiBaseDefault,
      apiVersion: paths.githubApiVersion,
      userAgent: paths.githubPromoteUserAgent,
      fetchImpl,
    })
    const branch = promoteBranchName('P1', 'cover')
    await port.ensureBranch({
      owner: 'aurovylabs',
      repo: 'zaoly',
      base: paths.githubPromoteBaseBranch,
      branch,
    })
    await port.putFile({
      owner: 'aurovylabs',
      repo: 'zaoly',
      branch,
      path: 'packages/ui/src/print/PrintCover.promoted.stories.tsx',
      contents: 'export const Promoted = {}\n',
      message: 'test',
    })
    const missing = await port.getFile({
      owner: 'aurovylabs',
      repo: 'zaoly',
      branch,
      path: 'packages/ui/src/components/ChatBlockPanel.tsx',
    })
    expect(missing).toBeNull()
    const pr = await port.ensurePullRequest({
      owner: 'aurovylabs',
      repo: 'zaoly',
      base: paths.githubPromoteBaseBranch,
      branch,
      title: 'test',
      body: 'test',
    })
    expect(pr.number).toBe(7)
    expect(calls.every((c) => c.url.startsWith(paths.githubApiBaseDefault))).toBe(true)
    const refCalls = calls.filter((c) => c.url.includes('/git/ref/'))
    expect(refCalls.some((c) => c.url.includes('/git/ref/heads/promote/p1-cover'))).toBe(true)
    expect(refCalls.every((c) => !c.url.includes('promote%2F'))).toBe(true)
    const put = calls.find((c) => c.method === 'PUT')
    expect(put?.body).toMatchObject({ branch })
    expect(put?.body).not.toMatchObject({ branch: 'main' })
    const createRef = calls.find((c) => c.method === 'POST' && c.url.endsWith('/git/refs'))
    expect(createRef?.body).toMatchObject({ ref: `refs/heads/${branch}` })
  })

  it('health reports githubConfigured without leaking a token', async () => {
    const prev = process.env[paths.envGithubToken]
    process.env[paths.envGithubToken] = 'super-secret-token'
    try {
      const res = await healthGet()
      const body = (await res.json()) as {
        libraryPromote?: { githubConfigured?: boolean }
      }
      const text = JSON.stringify(body)
      expect(body.libraryPromote?.githubConfigured).toBe(true)
      expect(text).not.toContain('super-secret-token')
    } finally {
      if (prev != null) process.env[paths.envGithubToken] = prev
      else delete process.env[paths.envGithubToken]
    }
  })

  it('dry-run route is unchanged (writesGit false)', async () => {
    const res = await dryRunPost(
      new Request(`http://localhost${paths.routes.apiLibraryPromoteDryRun}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(p1Body()),
      }),
    )
    const body = (await res.json()) as { ok: boolean; proposal: { writesGit: boolean } }
    expect(res.status).toBe(200)
    expect(body.proposal.writesGit).toBe(false)
  })

  it('P1 with ChatBlockPanel textAlign upgrades to P4 and patches the primitive', async () => {
    const source = `export type ChatBlockPanelProps = {
  title?: string
  className?: string
} & Record<string, unknown>

export function ChatBlockPanel({
  title,
  className,
  ...rest
}: ChatBlockPanelProps) {
  return (
    <div className={className} data-zaoly-chat-block {...rest}>
      {title}
    </div>
  )
}
`
    const github = fakeGithub({
      'packages/ui/src/components/ChatBlockPanel.tsx': source,
    })
    const result = await applyLibraryPromote(
      {
        kind: 'P1',
        nodeId: 'panel',
        scene: sceneWith([
          { id: 'panel', type: 'ChatBlockPanel', props: { textAlign: 'right' } },
        ]),
      },
      { github },
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.proposal.kind).toBe('P4')
    expect(result.proposal.pullRequest?.branch).toBe(promoteBranchName('P4', 'panel'))
    const api = github.files.find((f) => f.path.endsWith('ChatBlockPanel.tsx'))
    expect(api?.contents).toContain('textAlign?:')
    expect(api?.contents).toContain('style={{ ...style, textAlign }}')
    expect(github.files.some((f) => f.path.endsWith('.promoted.extend.test.tsx'))).toBe(true)
    expect(github.files.some((f) => f.path.endsWith('.promoted.stories.tsx'))).toBe(true)
  })
})
