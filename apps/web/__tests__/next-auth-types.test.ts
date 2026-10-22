import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('next-auth session role types', () => {
  it('includes platform_admin for phase 2b', () => {
    const src = readFileSync(path.join(__dirname, '../types/next-auth.d.ts'), 'utf8')
    expect(src).toContain('platform_admin')
    expect(src).toContain('impersonating')
    expect(src).toContain('actorSub')
  })
})
