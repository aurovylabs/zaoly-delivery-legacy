import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = path.resolve(__dirname, '../../..')

describe('zaoly ui in-repo (sever sibling DS)', () => {
  it('ships @zaoly/ui and @zaoly/ui-tokens under packages/', () => {
    const ui = JSON.parse(
      readFileSync(path.join(repoRoot, 'packages/ui/package.json'), 'utf8'),
    ) as { name: string; dependencies?: Record<string, string> }
    const tokens = JSON.parse(
      readFileSync(path.join(repoRoot, 'packages/ui-tokens/package.json'), 'utf8'),
    ) as { name: string }
    expect(ui.name).toBe('@zaoly/ui')
    expect(tokens.name).toBe('@zaoly/ui-tokens')
    expect(ui.dependencies?.['@zaoly/ui-tokens']).toMatch(/ui-tokens/)
    expect(existsSync(path.join(repoRoot, 'packages/ui/src/components/AppFrame.tsx'))).toBe(true)
  })

  it('web depends on in-repo packages only', () => {
    const web = JSON.parse(
      readFileSync(path.join(repoRoot, 'apps/web/package.json'), 'utf8'),
    ) as { dependencies: Record<string, string> }
    expect(web.dependencies['@zaoly/ui']).toBe('file:../../packages/ui')
    expect(web.dependencies['@zaoly/ui-tokens']).toBe('file:../../packages/ui-tokens')
  })

  it('webpack and barrels resolve inside the monorepo', () => {
    const next = readFileSync(path.join(repoRoot, 'apps/web/next.config.ts'), 'utf8')
    const legacySibling = ['msq', 'dx-ui'].join('')
    expect(next).toContain("'@zaoly/ui$'")
    expect(next).toContain('packages/ui/src')
    expect(next).not.toContain(`../${legacySibling}`)
    expect(existsSync(path.join(repoRoot, 'apps/web/lib/zaoly-ui.ts'))).toBe(true)
    expect(existsSync(path.join(repoRoot, 'apps/web/lib', `${legacySibling}.ts`))).toBe(false)
  })

  it('CI and Docker do not clone a sibling design-system checkout', () => {
    const ci = readFileSync(path.join(repoRoot, '.github/workflows/ci.yml'), 'utf8')
    const df = readFileSync(path.join(repoRoot, 'Dockerfile'), 'utf8')
    const legacySibling = ['msq', 'dx-ui'].join('')
    expect(ci).not.toContain(legacySibling)
    expect(ci).toContain('@zaoly/ui')
    expect(df).not.toContain('git clone')
    expect(df).toContain('ZAOLY_UI_SOURCE=in-repo')
  })
})
