import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = path.resolve(__dirname, '../../..')
const webRoot = path.join(repoRoot, 'apps/web')

function walkPages(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) walkPages(full, out)
    else if (name === 'page.tsx' || name === 'layout.tsx') out.push(full)
  }
  return out
}

describe('cache components adoption', () => {
  it('enables cacheComponents and partialPrefetching in next.config', () => {
    const cfg = readFileSync(path.join(webRoot, 'next.config.ts'), 'utf8')
    expect(cfg).toContain('cacheComponents: true')
    expect(cfg).toContain('partialPrefetching: true')
  })

  it('documents adoption in specs and knowledge', () => {
    const spec = readFileSync(
      path.join(repoRoot, 'specs/domain/cache-components-adoption.md'),
      'utf8',
    )
    const knowledge = readFileSync(
      path.join(repoRoot, 'knowledge/cache-components-adoption.md'),
      'utf8',
    )
    expect(spec).toContain('cacheComponents')
    expect(spec).toContain('instant = false')
    expect(knowledge).toContain('partialPrefetching')
  })

  it('app routes do not export dynamic or runtime segment configs', () => {
    const files = walkPages(path.join(webRoot, 'app'))
    expect(files.length).toBeGreaterThan(10)
    for (const file of files) {
      const src = readFileSync(file, 'utf8')
      expect(src, file).not.toMatch(/export const dynamic\s*=/)
      expect(src, file).not.toMatch(/export const runtime\s*=/)
    }
    // Spot-check API handlers too (Cache Components rejects these at build).
    const apiSample = readFileSync(
      path.join(webRoot, 'app/api/site-kit/catalog/route.ts'),
      'utf8',
    )
    expect(apiSample).not.toMatch(/export const runtime\s*=/)
  })

  it('no page or layout keeps instant = false after Wave F', () => {
    const files = walkPages(path.join(webRoot, 'app'))
    expect(files.length).toBeGreaterThan(10)
    for (const file of files) {
      const src = readFileSync(file, 'utf8')
      expect(src, file).not.toMatch(/export const instant\s*=\s*false\s*;?/)
    }
  })

  it('invite page passes token from the server into the client island', () => {
    const page = readFileSync(path.join(webRoot, 'app/invite/[token]/page.tsx'), 'utf8')
    const client = readFileSync(
      path.join(webRoot, 'app/invite/[token]/invite-accept-client.tsx'),
      'utf8',
    )
    expect(page).toContain('InviteAcceptClient token=')
    expect(client).toContain('{ token }: { token: string }')
    expect(client).not.toContain('useParams')
  })

  it('hubs, projects, editor, and admin stream under Suspense', () => {
    for (const rel of [
      'app/library/page.tsx',
      'app/compositions/page.tsx',
      'app/kit/page.tsx',
      'app/projects/page.tsx',
      'app/editor/page.tsx',
      'app/admin/layout.tsx',
      'app/admin/security/page.tsx',
      'app/admin/users/page.tsx',
    ]) {
      const src = readFileSync(path.join(webRoot, rel), 'utf8')
      // Users page streams via AdminOpsShell Suspense (sync page export).
      if (rel === 'app/admin/users/page.tsx') {
        expect(src, rel).toContain('AdminOpsShell')
        continue
      }
      expect(src, rel).toContain('Suspense')
    }
    expect(readFileSync(path.join(webRoot, 'app/library/page.tsx'), 'utf8')).toContain('auth()')
    expect(readFileSync(path.join(webRoot, 'app/editor/page.tsx'), 'utf8')).toContain('auth()')
    expect(readFileSync(path.join(webRoot, 'app/admin/layout.tsx'), 'utf8')).toContain(
      'requireAdminUser()',
    )
    const opsShell = readFileSync(
      path.join(webRoot, 'components/admin-ops-shell.tsx'),
      'utf8',
    )
    expect(opsShell).toContain('Suspense')
    expect(opsShell).toMatch(/export function AdminOpsShell/)
  })
})
