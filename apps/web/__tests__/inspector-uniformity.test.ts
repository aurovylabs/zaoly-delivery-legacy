import { describe, expect, it } from 'vitest'
import { contractPropsForType } from '@zaoly/contracts'
import { inspectFieldsForType } from '../lib/inspect/field-catalog'

describe('inspector Design panel uniformity', () => {
  it('SiteStack has Flex axes without Grid chrome', () => {
    const names = inspectFieldsForType('SiteStack').map((f) => f.name)
    expect(names).toEqual(expect.arrayContaining(['direction', 'gap', 'wrap', 'align', 'justify']))
    expect(names).not.toContain('gridTemplateColumns')
    expect(names).not.toContain('justifyItems')
    expect(names).not.toContain('columns')
    expect(names).not.toContain('textAlign')
  })

  it('SiteGrid has Grid chrome without Flex AlignBar keys', () => {
    const names = inspectFieldsForType('SiteGrid').map((f) => f.name)
    expect(names).toEqual(expect.arrayContaining(['columns', 'gap', 'gridTemplateColumns']))
    expect(names).not.toContain('direction')
    expect(names).not.toContain('align')
    expect(names).not.toContain('justify')
    expect(names).not.toContain('wrap')
  })

  it('SiteImage media props appear once (no Appearance objectFit twin)', () => {
    const fields = inspectFieldsForType('SiteImage')
    const fits = fields.filter((f) => f.name === 'objectFit')
    const positions = fields.filter((f) => f.name === 'objectPosition')
    expect(fits).toHaveLength(1)
    expect(positions).toHaveLength(1)
    expect(fits[0]?.section).toBe('component')
    expect(fields.some((f) => f.name === 'src')).toBe(true)
    expect(fields.some((f) => f.name === 'gridTemplateColumns')).toBe(false)
  })

  it('typed Image does not duplicate objectFit via shared styles', () => {
    const fields = contractPropsForType('Image')
    expect(fields.filter((f) => f.name === 'objectFit')).toHaveLength(1)
    expect(fields.filter((f) => f.name === 'objectPosition')).toHaveLength(1)
  })

  it('SiteText keeps typography Align without flex/grid parent axes', () => {
    const names = inspectFieldsForType('SiteText').map((f) => f.name)
    expect(names).toContain('textAlign')
    expect(names).not.toContain('alignItems')
    expect(names).not.toContain('justifyContent')
    expect(names).not.toContain('gridTemplateColumns')
  })
})
