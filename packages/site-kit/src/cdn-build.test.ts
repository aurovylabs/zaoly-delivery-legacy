/**
 * SK-V14 atom CDN build smoke — builds then asserts atoms-only output.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

const PKG_ROOT = path.resolve(__dirname, '..')
const CDN_DIR = path.join(PKG_ROOT, 'cdn-dist')

describe('site-kit atom CDN build (SK-V14)', () => {
  it('builds site-kit.js + css without composition modules', () => {
    execSync('npm run build:cdn', { cwd: PKG_ROOT, stdio: 'pipe' })
    const jsPath = path.join(CDN_DIR, 'site-kit.js')
    expect(existsSync(jsPath)).toBe(true)
    const css = readdirSync(CDN_DIR).find((f) => f.endsWith('.css'))
    expect(css).toBeTruthy()
    const js = readFileSync(jsPath, 'utf8')
    expect(js).toMatch(/export\s*\{/)
    expect(js).not.toMatch(/compositions\/c\//)
    expect(js).not.toMatch(/Composition~/)
    expect(js).not.toMatch(/jsx-dev-runtime/)
    expect(js).not.toMatch(/jsxDEV/)
    expect(js).not.toMatch(/__source/)
    expect(js).toMatch(/jsx-runtime/)
  }, 120_000)
})
