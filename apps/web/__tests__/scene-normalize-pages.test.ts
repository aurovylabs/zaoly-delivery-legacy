import { describe, expect, it } from 'vitest'
import { createLegacyFixtureScene } from '../lib/scene/demo-scene'
import { normalizeScene } from '../lib/scene/scene-normalize'
import {
  DEFAULT_SCENE_PAGE_ID,
  activePageRoot,
  prepareScenePagesForPersist,
  resolveActivePageId,
} from '../lib/scene/scene-pages'
import { upsertScene, __resetSceneStoreForTests } from '../lib/scene/scene-store'
import { sceneFromPgRow } from '../lib/scene/pg-store'

describe('scene pages normalize (P80 wave 1)', () => {
  it('synthesizes a single page when pages is missing', () => {
    const demo = createLegacyFixtureScene()
    const scene = normalizeScene({
      id: demo.id,
      name: demo.name,
      version: 1,
      root: demo.root,
      updatedAt: demo.updatedAt,
    })
    expect(scene?.pages).toHaveLength(1)
    expect(scene?.pages?.[0]?.id).toBe(DEFAULT_SCENE_PAGE_ID)
    expect(scene?.pages?.[0]?.name).toBe('Page 1')
    expect(scene?.pages?.[0]?.frame).toEqual({ x: 0, y: 0 })
    expect(scene?.activePageId).toBe(DEFAULT_SCENE_PAGE_ID)
    expect(scene?.root.id).toBe(demo.root.id)
    expect(activePageRoot(scene!)).toEqual(scene!.root)
  })

  it('falls back to the first page when activePageId is invalid', () => {
    const demo = createLegacyFixtureScene()
    const contactRoot = { ...demo.root, id: 'page-contact-root', name: 'Contact' }
    const scene = normalizeScene({
      id: demo.id,
      name: demo.name,
      version: 1,
      root: demo.root,
      pages: [
        { id: 'page-home', name: 'Home', root: demo.root },
        { id: 'page-contact', name: 'Contact', root: contactRoot },
      ],
      activePageId: 'missing',
      updatedAt: demo.updatedAt,
    })
    expect(scene?.activePageId).toBe('page-home')
    expect(scene?.root.id).toBe('root')
    expect(resolveActivePageId(scene!.pages!, 'missing')).toBe('page-home')
  })

  it('dual-writes root from the active page on persist', () => {
    const demo = createLegacyFixtureScene()
    const contactRoot = { ...demo.root, id: 'page-contact-root', name: 'Contact' }
    const prepared = prepareScenePagesForPersist({
      ...demo,
      pages: [
        { id: 'page-home', name: 'Home', root: demo.root },
        { id: 'page-contact', name: 'Contact', root: contactRoot },
      ],
      activePageId: 'page-contact',
      root: demo.root,
    })
    expect(prepared.root.id).toBe('page-contact-root')
    expect(prepared.pages?.[1]?.root.id).toBe('page-contact-root')
  })

  it('maps postgres pages columns through normalizeScene', () => {
    const demo = createLegacyFixtureScene()
    const contactRoot = { ...demo.root, id: 'page-contact-root', name: 'Contact' }
    const mapped = sceneFromPgRow({
      id: demo.id,
      name: demo.name,
      version: 1,
      platform_project_id: null,
      active_breakpoint: null,
      active_print_preset: null,
      root: demo.root,
      masters: null,
      comments: null,
      pages: [
        { id: 'page-home', name: 'Home', root: demo.root },
        { id: 'page-contact', name: 'Contact', root: contactRoot },
      ],
      active_page_id: 'page-contact',
      updated_at: '2026-08-22T10:00:00.000Z',
    })
    expect(mapped?.pages).toHaveLength(2)
    expect(mapped?.activePageId).toBe('page-contact')
    expect(mapped?.root.id).toBe('page-contact-root')
  })
})

describe('scene store pages persist (P80 wave 1)', () => {
  it('persists pages and dual-writes root on json upsert', async () => {
    __resetSceneStoreForTests({ durable: false, wipeDisk: true })
    const demo = createLegacyFixtureScene()
    const contactRoot = { ...demo.root, id: 'page-contact-root', name: 'Contact' }
    const saved = await upsertScene({
      ...demo,
      pages: [
        { id: 'page-home', name: 'Home', root: demo.root },
        { id: 'page-contact', name: 'Contact', root: contactRoot },
      ],
      activePageId: 'page-contact',
      root: demo.root,
    })
    expect(saved.pages).toHaveLength(2)
    expect(saved.activePageId).toBe('page-contact')
    expect(saved.root.id).toBe('page-contact-root')
  })
})
