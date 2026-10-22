import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = path.resolve(__dirname, '../../..')

type Pkg = {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

function readPkg(rel: string): Pkg {
  return JSON.parse(readFileSync(path.join(repoRoot, rel), 'utf8')) as Pkg
}

describe('dependency bump 2026-10-10', () => {
  it('pins Next 16.4 + React 19.3 on web', () => {
    const web = readPkg('apps/web/package.json')
    expect(web.dependencies?.next).toBe('16.4.0')
    expect(web.dependencies?.react).toBe('19.3.0')
    expect(web.dependencies?.['react-dom']).toBe('19.3.0')
    expect(web.dependencies?.['@sentry/nextjs']).toMatch(/^\^11\./)
    expect(web.dependencies?.jsdom).toMatch(/^\^30\./)
    expect(web.dependencies?.['react-driftkit']).toMatch(/^\^0\.8\./)
    expect(web.devDependencies?.vitest).toBe('5.0.3')
    expect(web.devDependencies?.typescript).toBe('7.0.2')
  })

  it('keeps site-kit on React 19.3 and Storybook 10.6', () => {
    const kit = readPkg('packages/site-kit/package.json')
    expect(kit.devDependencies?.react).toBe('19.3.0')
    expect(kit.devDependencies?.['react-dom']).toBe('19.3.0')
    expect(kit.devDependencies?.storybook).toMatch(/^\^10\.6\./)
    expect(kit.devDependencies?.typescript).toBe('7.0.2')
    expect(kit.peerDependencies?.react).toBe('^19.2.0')
  })

  it('documents the bump in knowledge', () => {
    const doc = readFileSync(
      path.join(repoRoot, 'knowledge/dependency-bump-2026-10-10.md'),
      'utf8',
    )
    expect(doc).toContain('16.4.0')
    expect(doc).toContain('19.3.0')
    expect(doc).toContain('Sentry 11')
    const ts7 = readFileSync(
      path.join(repoRoot, 'knowledge/typescript-7-bump.md'),
      'utf8',
    )
    expect(ts7).toContain('7.0.2')
    const majors = readFileSync(
      path.join(repoRoot, 'knowledge/dependency-majors-2026-10-10.md'),
      'utf8',
    )
    expect(majors).toContain('11.6.0')
    expect(majors).toContain('5.0.3')
    expect(majors).toContain('4.6.5')
  })

  it('aliases next/server.js for Vitest + next-auth under Next 16.4', () => {
    const vitestCfg = readFileSync(
      path.join(repoRoot, 'apps/web/vitest.config.ts'),
      'utf8',
    )
    expect(vitestCfg).toContain("find: 'next/server'")
    expect(vitestCfg).toContain('next/server.js')
    expect(vitestCfg).toContain("'next-auth'")
  })

  it('forces React 19.3 via root overrides and documents zaoly-ui align', () => {
    const root = JSON.parse(
      readFileSync(path.join(repoRoot, 'package.json'), 'utf8'),
    ) as { overrides?: Record<string, string> }
    expect(root.overrides?.react).toBe('19.3.0')
    expect(root.overrides?.['react-dom']).toBe('19.3.0')
    const align = readFileSync(
      path.join(repoRoot, 'knowledge/zaoly-ui-react-align.md'),
      'utf8',
    )
    expect(align).toContain('19.3.0')
    expect(align).toContain('next-react-singleton-hydration.md')
  })
})
