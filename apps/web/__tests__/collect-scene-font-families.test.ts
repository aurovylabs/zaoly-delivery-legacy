import { describe, expect, it } from 'vitest'
import type { SceneNode } from '@zaoly/contracts'
import { collectSceneFontFamilies } from '../lib/fonts/collect-scene-font-families'

function node(partial: Partial<SceneNode> & Pick<SceneNode, 'id' | 'type'>): SceneNode {
  return { children: [], ...partial }
}

describe('collectSceneFontFamilies breakpoint scope', () => {
  const root = node({
    id: 'root',
    type: 'SiteStack',
    props: { fontFamily: 'Roboto' },
    children: [
      node({
        id: 'title',
        type: 'SiteText',
        props: {},
        breakpoints: {
          mobile: { props: { fontFamily: 'Inter' } },
          desktop: { props: { fontFamily: 'Merriweather' } },
        },
      }),
    ],
  })

  it('collects all lanes when no paint breakpoint', () => {
    const all = collectSceneFontFamilies(root, [])
    expect(all).toContain('Roboto')
    expect(all).toContain('Inter')
    expect(all).toContain('Merriweather')
  })

  it('collects only effective fonts for mobile breakpoint', () => {
    const mobile = collectSceneFontFamilies(root, [], { paintBreakpoint: 'mobile' })
    expect(mobile).toEqual(expect.arrayContaining(['Roboto', 'Inter']))
    expect(mobile).not.toContain('Merriweather')
  })

  it('uses base font when breakpoint lane has no font override', () => {
    const tablet = collectSceneFontFamilies(root, [], { paintBreakpoint: 'tablet' })
    expect(tablet).toEqual(expect.arrayContaining(['Roboto']))
    expect(tablet).not.toContain('Inter')
    expect(tablet).not.toContain('Merriweather')
  })
})
