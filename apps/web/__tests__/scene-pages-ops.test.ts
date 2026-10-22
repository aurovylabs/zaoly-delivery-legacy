import { describe, expect, it } from 'vitest'
import { EDITOR_BREAKPOINT_WIDTHS } from '../lib/scene/breakpoints'
import { applySceneOp, crossPageLayerMoveIds } from '../lib/scene/ops'
import { createLegacyFixtureScene } from '../lib/scene/demo-scene'
import { normalizeScene } from '../lib/scene/scene-normalize'
import {
  BOARD_PAGE_GAP,
  SCENE_BOARD_FRAME_PREFIX,
  SCENE_BOARD_ID,
} from '../lib/scene/scene-board'
import { DEFAULT_SCENE_PAGE_ID } from '../lib/scene/scene-pages'
import { addSceneComment } from '../lib/scene-comments'

const DESKTOP_WIDTH = EDITOR_BREAKPOINT_WIDTHS.desktop

function sceneWithTwoPages() {
  const demo = createLegacyFixtureScene()
  const contactRoot = { ...demo.root, id: 'page-contact-root', name: 'Contact stack' }
  return normalizeScene({
    id: demo.id,
    name: demo.name,
    version: 1,
    root: demo.root,
    pages: [
      { id: 'page-home', name: 'Home', root: demo.root },
      { id: 'page-contact', name: 'Contact', root: contactRoot },
    ],
    activePageId: 'page-home',
    updatedAt: demo.updatedAt,
  })!
}

describe('scene page ops (P80 wave 2)', () => {
  it('add_page materializes legacy scene and activates the new page', () => {
    const scene = createLegacyFixtureScene()
    const result = applySceneOp(scene, { op: 'add_page', name: 'Pricing' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.scene.pages).toHaveLength(2)
    expect(result.scene.pages?.[0]?.id).toBe(DEFAULT_SCENE_PAGE_ID)
    expect(result.scene.pages?.[1]?.name).toBe('Pricing')
    expect(result.scene.activePageId).toBe(result.scene.pages?.[1]?.id)
    expect(result.scene.root.type).toBe('SiteStack')
  })

  it('add_page accepts create-time breakpoint and frame size', () => {
    const scene = createLegacyFixtureScene()
    const result = applySceneOp(scene, {
      op: 'add_page',
      name: 'Mobile',
      breakpoint: 'mobile',
      frameWidth: 390,
      frameHeight: 844,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const page = result.scene.pages?.[1]
    expect(page?.name).toBe('Mobile')
    expect(page?.breakpoint).toBe('mobile')
    expect(page?.frame?.width).toBe(390)
    expect(page?.frame?.height).toBe(844)
    expect(result.scene.activeBreakpoint).toBe('mobile')
  })

  it('set_active_page switches root to the target page tree', () => {
    const scene = sceneWithTwoPages()
    const switched = applySceneOp(scene, { op: 'set_active_page', pageId: 'page-contact' })
    expect(switched.ok).toBe(true)
    if (!switched.ok) return
    expect(switched.scene.activePageId).toBe('page-contact')
    expect(switched.scene.root.id).toBe('page-contact-root')
  })

  it('set_cover_page stores coverPageId; delete clears invalid cover', () => {
    const scene = sceneWithTwoPages()
    const covered = applySceneOp(scene, { op: 'set_cover_page', pageId: 'page-contact' })
    expect(covered.ok).toBe(true)
    if (!covered.ok) return
    expect(covered.scene.coverPageId).toBe('page-contact')
    const deleted = applySceneOp(covered.scene, { op: 'delete_page', pageId: 'page-contact' })
    expect(deleted.ok).toBe(true)
    if (!deleted.ok) return
    expect(deleted.scene.coverPageId).toBeUndefined()
  })

  it('rejects set_prop on a node from an inactive page', () => {
    const scene = sceneWithTwoPages()
    const patched = applySceneOp(scene, {
      op: 'set_prop',
      nodeId: 'page-contact-root',
      key: 'name',
      value: 'Nope',
    })
    expect(patched.ok).toBe(false)
    if (patched.ok) return
    expect(patched.reason).toContain('inactive page')
  })

  it('delete_page removes the page, switches active, and prunes comments', () => {
    const scene = sceneWithTwoPages()
    const withComment = addSceneComment(scene, {
      nodeId: 'page-contact-root',
      body: 'On contact page',
    })
    expect(withComment).toBeTruthy()
    const deleted = applySceneOp(withComment!, { op: 'delete_page', pageId: 'page-contact' })
    expect(deleted.ok).toBe(true)
    if (!deleted.ok) return
    expect(deleted.scene.pages).toHaveLength(1)
    expect(deleted.scene.activePageId).toBe('page-home')
    expect(deleted.scene.comments ?? []).toHaveLength(0)
  })

  it('cannot delete the last page', () => {
    const scene = createLegacyFixtureScene()
    const materialized = applySceneOp(scene, { op: 'add_page' })
    expect(materialized.ok).toBe(true)
    if (!materialized.ok) return
    const onlyPageId = materialized.scene.pages![0]!.id
    const shrunk = applySceneOp(
      { ...materialized.scene, pages: [{ ...materialized.scene.pages![0]! }], activePageId: onlyPageId },
      { op: 'delete_page', pageId: onlyPageId },
    )
    expect(shrunk.ok).toBe(false)
  })

  it('duplicate_page clones the tree with fresh node ids', () => {
    const scene = sceneWithTwoPages()
    const dup = applySceneOp(scene, { op: 'duplicate_page', pageId: 'page-home', name: 'Home copy' })
    expect(dup.ok).toBe(true)
    if (!dup.ok) return
    expect(dup.scene.pages).toHaveLength(3)
    expect(dup.scene.pages?.[2]?.name).toBe('Home copy')
    expect(dup.scene.pages?.[2]?.root.id).not.toBe('root')
    expect(dup.scene.activePageId).toBe(dup.scene.pages?.[2]?.id)
  })

  it('persists tree edits onto the active page entry', () => {
    const scene = sceneWithTwoPages()
    const edited = applySceneOp(scene, {
      op: 'set_prop',
      nodeId: 'title',
      key: 'children',
      value: 'Home headline',
    })
    expect(edited.ok).toBe(true)
    if (!edited.ok) return
    const homePage = edited.scene.pages?.find((p) => p.id === 'page-home')
    const titleOnPage = homePage?.root.children?.find((c) => c.id === 'title')
    expect(titleOnPage?.props?.children).toBe('Home headline')
    const contactPage = edited.scene.pages?.find((p) => p.id === 'page-contact')
    expect(contactPage?.root.id).toBe('page-contact-root')
  })

  it('move_node_to_page moves a layer from Home to Contact and activates Contact', () => {
    const scene = sceneWithTwoPages()
    const moved = applySceneOp(scene, {
      op: 'move_node_to_page',
      nodeId: 'title',
      toPageId: 'page-contact',
    })
    expect(moved.ok).toBe(true)
    if (!moved.ok) return
    expect(moved.scene.activePageId).toBe('page-contact')
    expect(moved.scene.root.id).toBe('page-contact-root')
    const homePage = moved.scene.pages?.find((p) => p.id === 'page-home')
    const contactPage = moved.scene.pages?.find((p) => p.id === 'page-contact')
    expect(homePage?.root.children?.some((c) => c.id === 'title')).toBe(false)
    expect(contactPage?.root.children?.some((c) => c.id === 'title')).toBe(true)
  })

  it('rejects move_node_to_page for page root', () => {
    const scene = sceneWithTwoPages()
    const moved = applySceneOp(scene, {
      op: 'move_node_to_page',
      nodeId: 'root',
      toPageId: 'page-contact',
    })
    expect(moved.ok).toBe(false)
  })

  it('crossPageLayerMoveIds expands multi-selection and drops nested descendants', () => {
    const scene = sceneWithTwoPages()
    const ids = crossPageLayerMoveIds(scene, 'title', ['title', 'root'])
    expect(ids).toEqual(['title'])
  })

  it('move_node_to_page moves multiple selected siblings together', () => {
    const scene = sceneWithTwoPages()
    const home = scene.pages?.find((p) => p.id === 'page-home')
    const secondId = home?.root.children?.find((c) => c.id !== 'title')?.id
    if (!secondId) return
    const moved = applySceneOp(scene, {
      op: 'move_node_to_page',
      nodeId: 'title',
      toPageId: 'page-contact',
    })
    expect(moved.ok).toBe(true)
    if (!moved.ok) return
    const moved2 = applySceneOp(moved.scene, {
      op: 'move_node_to_page',
      nodeId: secondId,
      toPageId: 'page-contact',
      parentId: moved.scene.pages?.find((p) => p.id === 'page-contact')?.root.id,
      index: 1,
    })
    expect(moved2.ok).toBe(true)
  })
})

describe('scene board page ops (P81 wave 2)', () => {
  it('add_page auto-places frame to the right of the active page', () => {
    const scene = sceneWithTwoPages()
    const added = applySceneOp(scene, { op: 'add_page', name: 'Pricing' })
    expect(added.ok).toBe(true)
    if (!added.ok) return
    const newPage = added.scene.pages?.find((p) => p.name === 'Pricing')
    expect(newPage?.frame).toEqual({
      x: DESKTOP_WIDTH + BOARD_PAGE_GAP,
      y: 0,
    })
  })

  it('duplicate_page auto-places frame to the right of the source page', () => {
    const scene = sceneWithTwoPages()
    const dup = applySceneOp(scene, { op: 'duplicate_page', pageId: 'page-home', name: 'Home copy' })
    expect(dup.ok).toBe(true)
    if (!dup.ok) return
    const copy = dup.scene.pages?.find((p) => p.name === 'Home copy')
    expect(copy?.frame).toEqual({
      x: DESKTOP_WIDTH + BOARD_PAGE_GAP,
      y: 0,
    })
  })

  it('move_page_frame updates persisted frame coordinates', () => {
    const scene = sceneWithTwoPages()
    const moved = applySceneOp(scene, {
      op: 'move_page_frame',
      pageId: 'page-contact',
      x: 120,
      y: 240,
    })
    expect(moved.ok).toBe(true)
    if (!moved.ok) return
    const contact = moved.scene.pages?.find((p) => p.id === 'page-contact')
    expect(contact?.frame).toEqual({ x: 120, y: 240 })
  })

  it('set_page_frame merges partial frame updates', () => {
    const scene = sceneWithTwoPages()
    const resized = applySceneOp(scene, {
      op: 'set_page_frame',
      pageId: 'page-home',
      width: 720,
    })
    expect(resized.ok).toBe(true)
    if (!resized.ok) return
    const home = resized.scene.pages?.find((p) => p.id === 'page-home')
    expect(home?.frame).toEqual({ x: 0, y: 0, width: 720 })
  })

  it('set_page_frame clearWidth removes explicit width', () => {
    const scene = sceneWithTwoPages()
    const withWidth = applySceneOp(scene, {
      op: 'set_page_frame',
      pageId: 'page-home',
      width: 720,
    })
    expect(withWidth.ok).toBe(true)
    if (!withWidth.ok) return
    const cleared = applySceneOp(withWidth.scene, {
      op: 'set_page_frame',
      pageId: 'page-home',
      clearWidth: true,
    })
    expect(cleared.ok).toBe(true)
    if (!cleared.ok) return
    const home = cleared.scene.pages?.find((p) => p.id === 'page-home')
    expect(home?.frame?.width).toBeUndefined()
  })

  it('set_page_frame height and clearHeight', () => {
    const scene = sceneWithTwoPages()
    const withHeight = applySceneOp(scene, {
      op: 'set_page_frame',
      pageId: 'page-home',
      height: 1080,
    })
    expect(withHeight.ok).toBe(true)
    if (!withHeight.ok) return
    expect(withHeight.scene.pages?.find((p) => p.id === 'page-home')?.frame?.height).toBe(1080)
    const cleared = applySceneOp(withHeight.scene, {
      op: 'set_page_frame',
      pageId: 'page-home',
      clearHeight: true,
    })
    expect(cleared.ok).toBe(true)
    if (!cleared.ok) return
    expect(cleared.scene.pages?.find((p) => p.id === 'page-home')?.frame?.height).toBeUndefined()
  })

  it('set_page_breakpoint sets and clears per-page breakpoint', () => {
    const scene = sceneWithTwoPages()
    const set = applySceneOp(scene, {
      op: 'set_page_breakpoint',
      pageId: 'page-contact',
      breakpoint: 'tablet',
    })
    expect(set.ok).toBe(true)
    if (!set.ok) return
    const contact = set.scene.pages?.find((p) => p.id === 'page-contact')
    expect(contact?.breakpoint).toBe('tablet')
    const cleared = applySceneOp(set.scene, {
      op: 'set_page_breakpoint',
      pageId: 'page-contact',
      breakpoint: null,
    })
    expect(cleared.ok).toBe(true)
    if (!cleared.ok) return
    const again = cleared.scene.pages?.find((p) => p.id === 'page-contact')
    expect(again?.breakpoint).toBeUndefined()
  })

  it('rejects tree ops targeting board chrome node ids', () => {
    const scene = sceneWithTwoPages()
    for (const nodeId of [SCENE_BOARD_ID, `${SCENE_BOARD_FRAME_PREFIX}page-home`]) {
      const patched = applySceneOp(scene, {
        op: 'set_prop',
        nodeId,
        key: 'name',
        value: 'Nope',
      })
      expect(patched.ok).toBe(false)
      if (patched.ok) continue
      expect(patched.reason).toContain('board chrome')
    }
  })
})
