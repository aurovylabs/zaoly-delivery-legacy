import { describe, expect, it } from 'vitest'
import { createDemoScene } from '../lib/scene/demo-scene'
import { resolveInspectSubject } from '../lib/scene/expand-instances'
import { applySceneOp } from '../lib/scene/ops'
import { activePageRoot, syncScenePagesRoot } from '../lib/scene/scene-pages'

describe('scene pages smoke (P80)', () => {
  it('switching active page changes canvas root without losing other page trees', () => {
    const scene = createDemoScene()
    const homeFirst = activePageRoot(scene)?.children?.[0]?.id
    expect(homeFirst).toBe('pattern-zaoly-nav')
    expect(activePageRoot(scene)?.children?.some((c) => c.id === 'pattern-hero')).toBe(true)

    const switched = applySceneOp(scene, {
      op: 'set_active_page',
      pageId: 'page-contact',
    })
    expect(switched.ok).toBe(true)
    expect(activePageRoot(switched.scene!)?.children?.[0]?.id).toBe('pattern-form')

    const back = applySceneOp(switched.scene!, {
      op: 'set_active_page',
      pageId: 'page-home',
    })
    expect(back.ok).toBe(true)
    expect(activePageRoot(back.scene!)?.children?.[0]?.id).toBe('pattern-zaoly-nav')
    expect(activePageRoot(back.scene!)?.children?.some((c) => c.id === 'pattern-hero')).toBe(true)
    expect(back.scene!.pages?.[1]?.root.children?.[0]?.id).toBe('pattern-form')
  })

  it('persist helper dual-writes root to active page', () => {
    const scene = createDemoScene()
    const edited = applySceneOp(scene, {
      op: 'set_prop',
      nodeId: 'inst-hero-headline',
      key: 'children',
      value: 'Saved on Home',
    })
    expect(edited.ok).toBe(true)
    const synced = syncScenePagesRoot(edited.scene!)
    expect(synced.root).toEqual(synced.pages?.find((p) => p.id === 'page-home')?.root)
    const headline = resolveInspectSubject(synced, 'inst-hero-headline')
    expect(headline?.props?.children).toBe('Saved on Home')
  })
})
