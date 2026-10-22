import { describe, expect, it } from 'vitest'
import { getStaticProductSwitcherItems, suiteProductsCatalogUrl } from '../lib/platform-product-switcher'

describe('platform-product-switcher', () => {
  it('returns no suite products on Zaoly standalone', () => {
    expect(getStaticProductSwitcherItems()).toEqual([])
  })

  it('does not expose a Plexon products catalog url', () => {
    expect(suiteProductsCatalogUrl()).toBeNull()
  })
})
