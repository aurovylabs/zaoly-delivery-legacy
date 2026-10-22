import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))

describe('web-system foundation', () => {
  it('tokens.css exposes semantic aliases used by example pages', () => {
    const css = readFileSync(join(here, 'css/tokens.css'), 'utf8')
    for (const token of [
      '--background:',
      '--primary:',
      '--muted-surface:',
      '--ring:',
      '--shadow-md:',
      '--z-sticky:',
      '--z-nav-rail:',
    ]) {
      expect(css).toContain(token)
    }
  })

  it('opt-in Tailwind theme maps onto Layer-0 vars only', () => {
    const theme = readFileSync(join(here, 'css/tailwind-theme.css'), 'utf8')
    expect(theme).toContain('@theme inline')
    expect(theme).toContain('--color-background: var(--background)')
    expect(theme).toContain('--color-primary: var(--primary)')
    expect(theme).toContain('--color-muted: var(--muted-surface)')
    expect(theme).not.toMatch(/--color-primary:\s*#[0-9a-fA-F]/)
  })
})
