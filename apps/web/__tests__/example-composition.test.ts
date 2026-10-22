import { describe, expect, it } from 'vitest'
import { KIT_ATOMS } from '../lib/landing/kit-atoms'
import { kitAtomTsxSnippet, LANDING_EXAMPLE_COMPOSITION } from '../lib/landing/example-composition'

describe('landing example composition', () => {
  it('keeps FeatureCard as a marketing example outside the seed atom catalog', () => {
    expect(LANDING_EXAMPLE_COMPOSITION.name).toBe('FeatureCard')
    expect(LANDING_EXAMPLE_COMPOSITION.labelDe).toMatch(/Beispiel/i)
    expect(KIT_ATOMS.some((atom) => atom.id === LANDING_EXAMPLE_COMPOSITION.name)).toBe(false)
  })

  it('builds a playground-lite TSX snippet for seed atoms', () => {
    expect(kitAtomTsxSnippet('Button')).toContain("import { Button } from '@zaoly/site-kit'")
    expect(kitAtomTsxSnippet('Button')).toContain('<Button />')
  })
})
