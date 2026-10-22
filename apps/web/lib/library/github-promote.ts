/**
 * GitHub port for Phase-4 library promote.
 * Native fetch only (no Octokit). Tests inject a fake port or a fake fetch.
 * Spec: `specs/api/library-promote.md`
 */

import { paths } from '../paths'

export type PromotePullRequest = {
  htmlUrl: string
  number: number
  branch: string
}

export type PromoteGithubPort = {
  ensureBranch(opts: {
    owner: string
    repo: string
    base: string
    branch: string
  }): Promise<void>
  getFile(opts: {
    owner: string
    repo: string
    branch: string
    path: string
  }): Promise<string | null>
  putFile(opts: {
    owner: string
    repo: string
    branch: string
    path: string
    contents: string
    message: string
  }): Promise<void>
  ensurePullRequest(opts: {
    owner: string
    repo: string
    base: string
    branch: string
    title: string
    body: string
  }): Promise<PromotePullRequest>
}

export function promoteBranchName(kind: 'P1' | 'P2' | 'P4', id: string): string {
  const slug =
    id
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'item'
  const branch = `${paths.githubPromoteBranchPrefix}${kind.toLowerCase()}-${slug}`
  if (branch === paths.githubPromoteBaseBranch || !branch.startsWith(paths.githubPromoteBranchPrefix)) {
    throw new Error('Refusing to use base branch as promote head')
  }
  return branch
}

export function parseOwnerRepo(full: string): { owner: string; repo: string } {
  const [owner, repo] = full.split('/')
  if (!owner || !repo || full.split('/').length !== 2) {
    throw new Error(`Invalid GitHub repo "${full}"`)
  }
  return { owner, repo }
}

function encodeRefHeads(branch: string): string {
  return branch
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')
}

function encodeRepoPath(filePath: string): string {
  return filePath
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')
}

function assertNotBaseBranch(branch: string, base: string = paths.githubPromoteBaseBranch): void {
  if (branch === base) {
    throw new Error('MUST NOT write to the catalog base branch')
  }
}

export function createFetchGithubPort(opts: {
  token: string
  apiBase: string
  apiVersion?: string
  userAgent?: string
  fetchImpl?: typeof fetch
}): PromoteGithubPort {
  const token = opts.token.trim()
  if (!token) {
    throw new Error('GitHub token required')
  }
  const apiBase = opts.apiBase.replace(/\/$/, '')
  const apiVersion = opts.apiVersion ?? paths.githubApiVersion
  const userAgent = opts.userAgent ?? paths.githubPromoteUserAgent
  const fetchImpl = opts.fetchImpl ?? fetch

  async function gh(
    method: string,
    urlPath: string,
    body?: unknown,
  ): Promise<{ status: number; json: unknown }> {
    const res = await fetchImpl(`${apiBase}${urlPath}`, {
      method,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': apiVersion,
        'User-Agent': userAgent,
        ...(body != null ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body != null ? JSON.stringify(body) : undefined,
    })
    let json: unknown = null
    const text = await res.text()
    if (text) {
      try {
        json = JSON.parse(text) as unknown
      } catch {
        json = { message: text }
      }
    }
    return { status: res.status, json }
  }

  return {
    async ensureBranch({ owner, repo, base, branch }) {
      assertNotBaseBranch(branch, base)
      const baseRef = await gh('GET', `/repos/${owner}/${repo}/git/ref/heads/${encodeRefHeads(base)}`)
      if (baseRef.status !== 200) {
        throw new Error(`GitHub base ref failed (${baseRef.status})`)
      }
      const sha = (baseRef.json as { object?: { sha?: string } })?.object?.sha
      if (!sha) throw new Error('GitHub base ref missing sha')

      const head = await gh('GET', `/repos/${owner}/${repo}/git/ref/heads/${encodeRefHeads(branch)}`)
      if (head.status === 200) return
      const created = await gh('POST', `/repos/${owner}/${repo}/git/refs`, {
        ref: `refs/heads/${branch}`,
        sha,
      })
      if (created.status === 201 || created.status === 200) return
      if (created.status === 422) return
      throw new Error(`GitHub create ref failed (${created.status})`)
    },

    async getFile({ owner, repo, branch, path: filePath }) {
      assertNotBaseBranch(branch)
      const encoded = encodeRepoPath(filePath)
      const existing = await gh(
        'GET',
        `/repos/${owner}/${repo}/contents/${encoded}?ref=${encodeURIComponent(branch)}`,
      )
      if (existing.status === 404) return null
      if (existing.status !== 200) {
        throw new Error(`GitHub get contents failed (${existing.status})`)
      }
      const raw = (existing.json as { content?: string; encoding?: string }).content
      if (!raw) return null
      return Buffer.from(raw.replace(/\n/g, ''), 'base64').toString('utf8')
    },

    async putFile({ owner, repo, branch, path: filePath, contents, message }) {
      assertNotBaseBranch(branch)
      const encoded = encodeRepoPath(filePath)
      const existing = await gh(
        'GET',
        `/repos/${owner}/${repo}/contents/${encoded}?ref=${encodeURIComponent(branch)}`,
      )
      const sha =
        existing.status === 200
          ? (existing.json as { sha?: string }).sha
          : undefined
      const put = await gh('PUT', `/repos/${owner}/${repo}/contents/${encoded}`, {
        message,
        content: Buffer.from(contents, 'utf8').toString('base64'),
        branch,
        ...(sha ? { sha } : {}),
      })
      if (put.status !== 200 && put.status !== 201) {
        throw new Error(`GitHub put contents failed (${put.status})`)
      }
    },

    async ensurePullRequest({ owner, repo, base, branch, title, body }) {
      assertNotBaseBranch(branch, base)
      const q = new URLSearchParams({
        head: `${owner}:${branch}`,
        base,
        state: 'open',
      })
      const listed = await gh('GET', `/repos/${owner}/${repo}/pulls?${q.toString()}`)
      if (listed.status === 200 && Array.isArray(listed.json) && listed.json.length > 0) {
        const first = listed.json[0] as { html_url?: string; number?: number }
        if (first.html_url && typeof first.number === 'number') {
          return { htmlUrl: first.html_url, number: first.number, branch }
        }
      }
      const created = await gh('POST', `/repos/${owner}/${repo}/pulls`, {
        title,
        head: branch,
        base,
        body,
      })
      if (created.status !== 201 && created.status !== 200) {
        throw new Error(`GitHub create pull request failed (${created.status})`)
      }
      const pr = created.json as { html_url?: string; number?: number }
      if (!pr.html_url || typeof pr.number !== 'number') {
        throw new Error('GitHub pull request missing url')
      }
      return { htmlUrl: pr.html_url, number: pr.number, branch }
    },
  }
}
