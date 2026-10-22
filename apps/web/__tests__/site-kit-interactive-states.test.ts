import { describe, expect, it } from 'vitest'
import { SCENE_STATE_IDS } from '@zaoly/contracts'
import {
  defaultSiteKitInteractiveStates,
  defaultSiteKitTokenBindings,
} from '../lib/inspect/token-catalog'
import {
  findMasterBySourceKey,
  seedSiteKitPaletteMasters,
  softFillInteractiveStates,
} from '../lib/scene/ops'
import { defaultChildForType } from '../lib/scene/scene-insert-defaults'
import { cascadeNodeForState, generateSceneStatesCss, writesToStateOverride } from '../lib/scene/state-cascade'
import { ZAOLY_STARTER_PACK_PATHS } from '../lib/tokens/zaoly-starter-pack'
import type { CompositionScene, SceneNode } from '@zaoly/contracts'

function emptyishScene(): CompositionScene {
  return {
    id: 'scene',
    name: 'Test',
    updatedAt: '2026-10-05T00:00:00.000Z',
    root: { id: 'root', type: 'Frame', children: [] },
    masters: [],
  }
}

const INTERACTIVE_TYPES = [
  'SiteButton',
  'SiteLink',
  'SiteInput',
  'SiteTextarea',
  'SiteSelect',
  'SiteCheckbox',
] as const

describe('Site Kit interactive Masters (starter roles)', () => {
  it('SceneStateId includes disabled', () => {
    expect(SCENE_STATE_IDS).toContain('disabled')
    expect(writesToStateOverride('disabled')).toBe(true)
  })

  it('defaultChildForType seeds hover/focus/disabled on interactive atoms', () => {
    const starterPaths = new Set(ZAOLY_STARTER_PACK_PATHS)
    for (const type of INTERACTIVE_TYPES) {
      const node = defaultChildForType(type)
      const states = defaultSiteKitInteractiveStates(type)
      expect(states).toBeDefined()
      expect(node.states?.hover).toBeDefined()
      expect(node.states?.focus).toBeDefined()
      expect(node.states?.disabled).toBeDefined()
      if (type === 'SiteButton') {
        expect(node.states?.active?.tokenBindings?.background).toBe('color.action.primaryActive')
        expect(node.states?.hover?.tokenBindings?.background).toBe('color.action.primaryHover')
        expect(node.states?.disabled?.tokenBindings?.background).toBe(
          'color.action.primaryDisabled',
        )
      }
      for (const override of Object.values(node.states ?? {})) {
        for (const path of Object.values(override.tokenBindings ?? {})) {
          expect(starterPaths.has(path)).toBe(true)
        }
      }
    }
  })

  it('seedSiteKitPaletteMasters soft-fills missing interactive states', () => {
    const scene = emptyishScene()
    scene.masters = [
      {
        id: 'm-btn',
        name: 'Button',
        sourceKey: 'SiteButton',
        root: {
          id: 'b1',
          type: 'SiteButton',
          props: { children: 'Custom' },
          tokenBindings: defaultSiteKitTokenBindings('SiteButton'),
          states: {
            hover: { tokenBindings: { background: 'color.action.accent' } },
          },
        },
      },
    ]
    const seeded = seedSiteKitPaletteMasters(scene)
    const master = findMasterBySourceKey(seeded.masters, 'SiteButton')
    expect(master?.root.states?.hover?.tokenBindings?.background).toBe('color.action.accent')
    expect(master?.root.states?.focus?.tokenBindings?.borderColor).toBe('color.ring')
    expect(master?.root.states?.disabled?.tokenBindings?.background).toBe(
      'color.action.primaryDisabled',
    )
    expect(master?.root.states?.active?.tokenBindings?.background).toBe(
      'color.action.primaryActive',
    )
  })

  it('softFillInteractiveStates does not overwrite existing binding keys', () => {
    const root: SceneNode = {
      id: 'n1',
      type: 'SiteButton',
      states: {
        hover: { tokenBindings: { background: 'color.action.accent' } },
      },
    }
    const filled = softFillInteractiveStates(root, defaultSiteKitInteractiveStates('SiteButton')!)
    expect(filled.states?.hover?.tokenBindings?.background).toBe('color.action.accent')
    expect(filled.states?.focus?.tokenBindings?.borderColor).toBe('color.ring')
  })

  it('cascade + CSS cover disabled', () => {
    const node = defaultChildForType('SiteButton')
    const disabled = cascadeNodeForState(node, 'disabled')
    expect(disabled.tokenBindings.background).toBe('color.action.primaryDisabled')
    expect(disabled.overrideKeys.has('background')).toBe(true)

    const css = generateSceneStatesCss({
      id: 'root',
      type: 'Frame',
      children: [node],
    })
    expect(css).toContain(':hover')
    expect(css).toContain(':focus')
    expect(css).toContain(':active')
    expect(css).toContain(':disabled')
    expect(css).toContain('[aria-disabled="true"]')
    expect(css).toContain('[data-disabled="true"]')
  })
})
