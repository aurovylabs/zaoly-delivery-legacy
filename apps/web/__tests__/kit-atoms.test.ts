import { describe, expect, it } from 'vitest'
import { KIT_ATOMS, KIT_ATOM_CATEGORIES, kitAtomsInCategory } from '../lib/landing/kit-atoms'
import { SITE_KIT_CATALOG } from '../../../packages/site-kit/src/catalog'

describe('landing kit atom catalog', () => {
  it('covers the site-kit seed exports used on the public kit stage', () => {
    const marketingNames = new Set(KIT_ATOMS.map((atom) => atom.exportName))
    const seedExports = new Set(
      SITE_KIT_CATALOG
        .map((entry) => entry.exportName)
        .filter((name) => name !== 'TableRow' && name !== 'TableCell'),
    )
    expect(marketingNames).toEqual(seedExports)
    expect(KIT_ATOMS).toHaveLength(18)
    expect(KIT_ATOM_CATEGORIES.map((category) => category.id)).toEqual([
      'content',
      'form',
      'media',
      'layout',
      'data',
    ])
    expect(kitAtomsInCategory('layout').map((atom) => atom.id)).toEqual([
      'Stack',
      'Grid',
      'Container',
      'Divider',
    ])
  })
})
