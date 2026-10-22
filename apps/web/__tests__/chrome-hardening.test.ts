import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

describe('chrome hardening (Tooltip + HUD inline-edit gate)', () => {
  it('HUD listens to inlineEditActiveEvent instead of body MutationObserver', () => {
    const hud = readFileSync(
      path.join(__dirname, '../components/canvas-floating-hud.tsx'),
      'utf8',
    )
    expect(hud).toContain('paths.inlineEditActiveEvent')
    expect(hud).toContain('addEventListener(paths.inlineEditActiveEvent')
    expect(hud).not.toContain('MutationObserver')
    expect(hud).not.toContain('document.body')
  })

  it('paths documents inlineEditActiveEvent', () => {
    const src = readFileSync(path.join(__dirname, '../lib/paths.ts'), 'utf8')
    expect(src).toContain("inlineEditActiveEvent: 'zaoly:inline-edit-active'")
  })
})
