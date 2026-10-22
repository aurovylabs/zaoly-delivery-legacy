import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
  catalogGenericGrainPaint,
  CATALOG_GENERIC_CLASS,
  CATALOG_GENERIC_VARS,
} from '../lib/scene/catalog-generic-grain'

const globalsCss = readFileSync(path.resolve(__dirname, '../app/globals.css'), 'utf8')

describe('catalog generic grain', () => {
  it('stays unset when wrap has no instance chrome', () => {
    const grain = catalogGenericGrainPaint({})
    expect(grain.className).toBe(CATALOG_GENERIC_CLASS)
    expect(grain.fill).toBe(false)
    expect(grain.radius).toBe(false)
    expect(grain.stroke).toBe(false)
    expect(grain.typography).toBe(false)
    expect(grain.wrapStyle[CATALOG_GENERIC_VARS.fill as keyof typeof grain.wrapStyle]).toBeUndefined()
  })

  it('gates fill, radius, and type independently', () => {
    expect(catalogGenericGrainPaint({ backgroundColor: '#112233' }).fill).toBe(true)
    expect(catalogGenericGrainPaint({ borderRadius: '8px' }).radius).toBe(true)
    expect(catalogGenericGrainPaint({ color: '#fff', fontSize: '16px' }).typography).toBe(true)
    expect(catalogGenericGrainPaint({ borderWidth: '1px' }).stroke).toBe(true)
  })

  it('forwards fill onto an inheritable CSS var and strips wrap background', () => {
    const grain = catalogGenericGrainPaint({ backgroundColor: '#b8e70d', width: '100%' })
    expect(grain.fill).toBe(true)
    expect(grain.wrapStyle.backgroundColor).toBeUndefined()
    expect(
      (grain.wrapStyle as Record<string, string>)[CATALOG_GENERIC_VARS.fill],
    ).toBe('#b8e70d')
    expect(grain.wrapStyle.width).toBe('100%')
  })

  it('globals apply catalog fill via background shorthand onto .ds-panel--default', () => {
    expect(globalsCss).toContain('var(--creation-catalog-fill)')
    expect(globalsCss).toContain('.ds-panel.ds-panel--default')
    expect(globalsCss).toMatch(
      /\[data-catalog-fill\][\s\S]{0,280}background:\s*var\(--creation-catalog-fill\)/,
    )
    expect(globalsCss).not.toMatch(
      /\.creation-scene-node--catalog-generic\[data-catalog-fill\][\s\S]{0,200}background-color:\s*inherit/,
    )
  })
})
