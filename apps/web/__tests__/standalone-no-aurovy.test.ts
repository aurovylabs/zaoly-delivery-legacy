/**
 * Gate: Zaoly public surfaces must not present Aurovy as a related product.
 * knowledge/zaoly-repo-remotes.md · AGENTS.md (standalone)
 */
import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = join(__dirname, '../../..')

describe('Zaoly standalone — no Aurovy product coupling', () => {
  it('root README does not mention Aurovy', () => {
    const readme = readFileSync(join(root, 'README.md'), 'utf8')
    // Word boundaries — org name `aurovylabs` must not trip the gate
    expect(readme).not.toMatch(/\baurovy\b|\baurovi\b/i)
  })

  it('community export template does not pitch Aurovy', () => {
    const exportScript = readFileSync(join(root, 'scripts/export-community-pack.mjs'), 'utf8')
    // Allow incidental path comments only if none — assert no marketing sister language
    expect(exportScript).not.toMatch(/sister product|Aurovy —|aurovy\.app/i)
  })

  it('onboarding pattern notes stay private engineering (not marketed)', () => {
    const notes = join(root, 'knowledge/onboarding-pattern-notes.md')
    expect(existsSync(notes)).toBe(true)
    const body = readFileSync(notes, 'utf8')
    expect(body).toMatch(/not a product relationship/i)
    expect(body).toMatch(/standalone/i)
  })
})
