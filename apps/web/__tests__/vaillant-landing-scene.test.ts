import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import {
  createVaillantLandingScene,
  shouldReseedVaillantLanding,
  VAILLANT_JANA_SEED_MARKER_ID,
  VAILLANT_LANDING_PAGE_ID,
  VAILLANT_LANDING_SCENE_ID,
  VAILLANT_LANDING_SCENE_NAME,
  vaillantLandingPageRoot,
} from '../lib/scene/vaillant-landing-scene'
import { paths } from '../lib/paths'
import { expandCompositionScene } from '../lib/scene/expand-instances'

describe('vaillant landing scene', () => {
  it('binds Brandion token paths on hero headline', () => {
    const scene = createVaillantLandingScene()
    expect(scene.id).toBe(VAILLANT_LANDING_SCENE_ID)
    expect(scene.name).toBe(VAILLANT_LANDING_SCENE_NAME)
    expect(scene.platformProjectId).toBe(paths.vaillantGroupPlatformProjectId)
    expect(scene.pages).toHaveLength(5)

    const expanded = expandCompositionScene(scene)
    let headlineBindings: Record<string, string> | undefined
    const walk = (node: typeof expanded) => {
      if (node.id === 'inst-vaillant-headline') {
        headlineBindings = node.tokenBindings as Record<string, string> | undefined
      }
      for (const c of node.children ?? []) walk(c)
    }
    walk(expanded)
    expect(headlineBindings?.fontFamily).toBe('typography.display.family')
  })

  it('seeds Jana persona marker and barrier copy', () => {
    const scene = createVaillantLandingScene()
    expect(shouldReseedVaillantLanding(scene)).toBe(false)
    const root = vaillantLandingPageRoot()
    const ids: string[] = []
    const walk = (node: (typeof root) | undefined) => {
      if (!node) return
      ids.push(node.id)
      for (const c of node.children ?? []) walk(c)
    }
    walk(root)
    expect(ids).toContain(VAILLANT_JANA_SEED_MARKER_ID)
  })

  it('reseeds when Jana marker missing', () => {
    const scene = createVaillantLandingScene()
    expect(
      shouldReseedVaillantLanding({
        ...scene,
        name: 'Vaillant Group Landing',
      }),
    ).toBe(true)
  })

  it('follows Spirion page rhythm sections on landing root', () => {
    const root = vaillantLandingPageRoot()
    const ids = (root.children ?? []).map((c) => c.id)
    expect(ids).toContain('pattern-vaillant-header')
    expect(ids).toContain('pattern-vaillant-hero')
    expect(ids).toContain('pattern-vaillant-conversion')
    expect(ids).toContain('pattern-vaillant-footer')
  })

  it('uses active landing page by default', () => {
    const scene = createVaillantLandingScene()
    expect(scene.activePageId).toBe(VAILLANT_LANDING_PAGE_ID)
  })
})

const emitPath = process.env.EMIT_VAILLANT_SCENE_PATH?.trim()
if (emitPath) {
  fs.writeFileSync(emitPath, JSON.stringify(createVaillantLandingScene()))
}
