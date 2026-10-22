import { describe, expect, it } from 'vitest'
import { INSPECT_TOKEN_CATALOG } from '../lib/inspect/token-catalog'
import {
  catalogToPackLeaves,
  mergeTokenPack,
  stringifyTokenValue,
} from '../lib/tokens/pack-merge'

describe('token pack merge', () => {
  it('covers typed fixture catalog leaves', () => {
    const leaves = catalogToPackLeaves()
    expect(leaves.length).toBeGreaterThan(8)
    expect(leaves.some((leaf) => leaf.path === 'color.action.primary')).toBe(true)
    expect(leaves.some((leaf) => leaf.path === 'glow.accent')).toBe(true)
    expect(leaves.some((leaf) => leaf.path === 'effect.blur.md')).toBe(true)
    expect(leaves.some((leaf) => leaf.path === 'motion.base')).toBe(true)
    expect(leaves.every((leaf) => leaf.type && leaf.value)).toBe(true)
    expect(INSPECT_TOKEN_CATALOG.some((row) => row.group === 'blur')).toBe(true)
    expect(leaves.some((leaf) => leaf.path.startsWith('blur.'))).toBe(false)
  })

  it('lets local overrides win over fixture', () => {
    const fixture = catalogToPackLeaves()
    const nextHex = stringifyTokenValue({ digital: { hex: '#ff00aa' } })
    const merged = mergeTokenPack(fixture, [
      { path: 'color.action.primary', type: 'color', value: nextHex, status: 'active' },
      { path: 'color.custom.pulse', type: 'color', value: nextHex, status: 'active' },
    ])
    const primary = merged.tokens.find((leaf) => leaf.path === 'color.action.primary')
    expect(primary?.value).toBe(nextHex)
    expect(merged.origins['color.action.primary']).toBe('local')
    expect(merged.origins['color.custom.pulse']).toBe('local')
    expect(merged.origins['spacing.static.medium']).toBe('fixture')
  })
})
