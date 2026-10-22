import { describe, expect, it } from 'vitest'
import { COMPARE_PROFILES, COMPARE_TOOLS } from '../lib/landing/compare'
import { paths } from '../lib/paths'

describe('landing competitive compare', () => {
  it('lists Zaoly first with pros, cons, and an optimistic pick-when', () => {
    expect(COMPARE_PROFILES.map((profile) => profile.id)).toEqual([
      'zaoly',
      'figma',
      'framer',
      'penpot',
      'sketch',
      'webflow',
    ])
    expect(COMPARE_TOOLS[0]).toMatchObject({ id: 'zaoly', highlight: true })
    const zaoly = COMPARE_PROFILES[0]
    expect(zaoly.pros.length).toBeGreaterThanOrEqual(3)
    expect(zaoly.cons.length).toBeGreaterThanOrEqual(2)
    expect(zaoly.pros.some((line) => /React/i.test(line.de))).toBe(true)
    expect(zaoly.cons.every((line) => /bewusst|bleibt|dafür|deliberate|instead|Doesn’t|Doesn't/i.test(`${line.de} ${line.en}`))).toBe(true)
    expect(zaoly.pickWhen.de).toMatch(/React-Baustein/i)
  })

  it('gives every peer honest pros and cons that point at Zaoly’s wedge', () => {
    for (const profile of COMPARE_PROFILES.slice(1)) {
      expect(profile.pros.length).toBeGreaterThanOrEqual(2)
      expect(profile.cons.length).toBeGreaterThanOrEqual(2)
      expect(profile.highlight).toBeFalsy()
    }
    const figma = COMPARE_PROFILES.find((profile) => profile.id === 'figma')!
    expect(figma.cons.some((line) => /Spec|nachgebaut|rebuilt/i.test(`${line.de} ${line.en}`))).toBe(true)
    const framer = COMPARE_PROFILES.find((profile) => profile.id === 'framer')!
    expect(framer.cons.some((line) => /Hosting|Lock-in|lock-in/i.test(`${line.de} ${line.en}`))).toBe(true)
    expect(paths.landing.sections.compare).toBe('vergleich')
  })
})
