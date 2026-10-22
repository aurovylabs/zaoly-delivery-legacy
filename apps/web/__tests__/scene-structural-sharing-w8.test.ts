import { describe, expect, it } from 'vitest'
import type { CompositionScene, SceneNode } from '@zaoly/contracts'
import { applySceneOp } from '../lib/scene/ops'
import { mapParentChildren, updateNodeById } from '../lib/scene/scene-clone'
import { DEFAULT_SCENE_PAGE_ID } from '../lib/scene/scene-pages'
import { createLegacyFixtureScene } from '../lib/scene/demo-scene'

describe('updateNodeById (W8)', () => {
  it('path-copies ancestors and shares untouched siblings', () => {
    const sibling: SceneNode = { id: 'sib', type: 'Text', props: { children: 'S' } }
    const target: SceneNode = { id: 't', type: 'Text', props: { children: 'T' } }
    const root: SceneNode = {
      id: 'root',
      type: 'Stack',
      children: [sibling, target],
    }
    const next = updateNodeById(root, 't', (node) => {
      node.props = { ...node.props, children: 'U' }
    })
    expect(next).not.toBeNull()
    if (!next) return
    expect(next).not.toBe(root)
    expect(next.children?.[0]).toBe(sibling)
    expect(next.children?.[1]).not.toBe(target)
    expect(next.children?.[1]?.props?.children).toBe('U')
    expect(target.props?.children).toBe('T')
    expect(root.children?.[1]?.props?.children).toBe('T')
  })
})

describe('mapParentChildren (W8c)', () => {
  it('shares untouched siblings when rewriting children', () => {
    const a: SceneNode = { id: 'a', type: 'Text', props: { children: 'A' } }
    const b: SceneNode = { id: 'b', type: 'Text', props: { children: 'B' } }
    const root: SceneNode = { id: 'root', type: 'Stack', children: [a, b] }
    const mapped = mapParentChildren(root, 'root', (children) => children.filter((c) => c.id !== 'a'))
    expect(mapped.ok).toBe(true)
    if (!mapped.ok) return
    expect(mapped.root.children).toHaveLength(1)
    expect(mapped.root.children?.[0]).toBe(b)
    expect(root.children?.[0]).toBe(a)
  })
})

describe('applySceneOp structural sharing (W8)', () => {
  it('set_prop shares inactive page roots', () => {
    const page2Root: SceneNode = {
      id: 'p2-root',
      type: 'Stack',
      children: [{ id: 'p2-text', type: 'Text', props: { children: 'Other' } }],
    }
    const scene: CompositionScene = {
      ...createLegacyFixtureScene(),
      pages: [
        {
          id: DEFAULT_SCENE_PAGE_ID,
          name: 'Page 1',
          root: createLegacyFixtureScene().root,
        },
        { id: 'page-2', name: 'Page 2', root: page2Root },
      ],
      activePageId: DEFAULT_SCENE_PAGE_ID,
      root: createLegacyFixtureScene().root,
    }
    const inactiveBefore = scene.pages![1]!.root
    const titleBefore = scene.root.children?.find((c) => c.id === 'title')
    const result = applySceneOp(scene, {
      op: 'set_prop',
      nodeId: 'title',
      key: 'children',
      value: 'Shared',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.scene.pages?.[1]?.root).toBe(inactiveBefore)
    expect(titleBefore?.props?.children).not.toBe('Shared')
    const titleAfter = result.scene.root.children?.find((c) => c.id === 'title')
    expect(titleAfter?.props?.children).toBe('Shared')
    expect(result.scene.root).not.toBe(scene.root)
  })

  it('remove_node does not mutate input and shares siblings (W8c)', () => {
    const scene = createLegacyFixtureScene()
    const siblingsBefore = [...(scene.root.children ?? [])]
    expect(siblingsBefore.length).toBeGreaterThan(1)
    const title = siblingsBefore.find((c) => c.id === 'title')
    const other = siblingsBefore.find((c) => c.id !== 'title')
    expect(title && other).toBeTruthy()
    const result = applySceneOp(scene, { op: 'remove_node', nodeId: 'title' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(scene.root.children?.some((c) => c.id === 'title')).toBe(true)
    expect(result.scene.root.children?.some((c) => c.id === 'title')).toBe(false)
    const shared = result.scene.root.children?.find((c) => c.id === other!.id)
    expect(shared).toBe(other)
  })

  it('insert_child shares existing siblings (W8c)', () => {
    const scene = createLegacyFixtureScene()
    const existing = scene.root.children?.[0]
    expect(existing).toBeTruthy()
    const result = applySceneOp(scene, {
      op: 'insert_child',
      parentId: scene.root.id,
      child: { id: 'new-text', type: 'Text', props: { children: 'New' } },
      index: 0,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.scene.root.children?.[0]?.id).toBe('new-text')
    expect(result.scene.root.children?.some((c) => c.id === existing!.id)).toBe(true)
    expect(result.scene.root.children?.find((c) => c.id === existing!.id)).toBe(existing)
    expect(scene.root.children?.[0]).toBe(existing)
  })

  it('move_node across parents shares unrelated subtree (W8c)', () => {
    const leafA: SceneNode = { id: 'a', type: 'Text', props: { children: 'A' } }
    const leafB: SceneNode = { id: 'b', type: 'Text', props: { children: 'B' } }
    const unrelated: SceneNode = {
      id: 'unrelated',
      type: 'Stack',
      children: [{ id: 'u-child', type: 'Text', props: { children: 'U' } }],
    }
    const box1: SceneNode = { id: 'box1', type: 'Stack', children: [leafA] }
    const box2: SceneNode = { id: 'box2', type: 'Stack', children: [leafB] }
    const root: SceneNode = { id: 'root', type: 'Stack', children: [box1, box2, unrelated] }
    const base = createLegacyFixtureScene()
    const scene: CompositionScene = {
      ...base,
      root,
      pages: [{ id: DEFAULT_SCENE_PAGE_ID, name: 'Page 1', root }],
      activePageId: DEFAULT_SCENE_PAGE_ID,
    }
    const result = applySceneOp(scene, {
      op: 'move_node',
      nodeId: 'a',
      parentId: 'box2',
      index: 0,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.scene.root.children?.find((c) => c.id === 'unrelated')).toBe(unrelated)
    const nextBox1 = result.scene.root.children?.find((c) => c.id === 'box1')
    const nextBox2 = result.scene.root.children?.find((c) => c.id === 'box2')
    expect(nextBox1?.children?.some((c) => c.id === 'a')).toBe(false)
    expect(nextBox2?.children?.[0]?.id).toBe('a')
    expect(nextBox2?.children?.some((c) => c.id === 'b')).toBe(true)
    expect(scene.root.children?.find((c) => c.id === 'box1')?.children?.[0]).toBe(leafA)
  })

  it('set_breakpoint_override shares inactive page roots (W8b)', () => {
    const page2Root: SceneNode = {
      id: 'p2-root',
      type: 'Stack',
      children: [{ id: 'p2-text', type: 'Text', props: { children: 'Other' } }],
    }
    const base = createLegacyFixtureScene()
    const scene: CompositionScene = {
      ...base,
      pages: [
        { id: DEFAULT_SCENE_PAGE_ID, name: 'Page 1', root: base.root },
        { id: 'page-2', name: 'Page 2', root: page2Root },
      ],
      activePageId: DEFAULT_SCENE_PAGE_ID,
      root: base.root,
    }
    const inactiveBefore = scene.pages![1]!.root
    const titleBefore = scene.root.children?.find((c) => c.id === 'title')
    const result = applySceneOp(scene, {
      op: 'set_breakpoint_override',
      nodeId: 'title',
      breakpoint: 'mobile',
      props: { children: 'Mobile' },
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.scene.pages?.[1]?.root).toBe(inactiveBefore)
    expect(titleBefore?.breakpoints?.mobile).toBeUndefined()
    const titleAfter = result.scene.root.children?.find((c) => c.id === 'title')
    expect(titleAfter?.breakpoints?.mobile?.props?.children).toBe('Mobile')
  })

  it('set_state_override then clear_state_override (W8b)', () => {
    const scene = createLegacyFixtureScene()
    const set = applySceneOp(scene, {
      op: 'set_state_override',
      nodeId: 'title',
      state: 'hover',
      props: { children: 'Hover' },
    })
    expect(set.ok).toBe(true)
    if (!set.ok) return
    expect(scene.root.children?.find((c) => c.id === 'title')?.states?.hover).toBeUndefined()
    const title = set.scene.root.children?.find((c) => c.id === 'title')
    expect(title?.states?.hover?.props?.children).toBe('Hover')

    const cleared = applySceneOp(set.scene, {
      op: 'clear_state_override',
      nodeId: 'title',
      state: 'hover',
    })
    expect(cleared.ok).toBe(true)
    if (!cleared.ok) return
    expect(cleared.scene.root.children?.find((c) => c.id === 'title')?.states?.hover).toBeUndefined()
  })

  it('wrap_nodes shares unrelated siblings and does not mutate input (W8d)', () => {
    const a: SceneNode = { id: 'a', type: 'Text', props: { children: 'A' } }
    const b: SceneNode = { id: 'b', type: 'Text', props: { children: 'B' } }
    const unrelated: SceneNode = { id: 'u', type: 'Text', props: { children: 'U' } }
    const root: SceneNode = { id: 'root', type: 'Stack', children: [a, b, unrelated] }
    const base = createLegacyFixtureScene()
    const scene: CompositionScene = {
      ...base,
      root,
      pages: [{ id: DEFAULT_SCENE_PAGE_ID, name: 'Page 1', root }],
      activePageId: DEFAULT_SCENE_PAGE_ID,
    }
    const result = applySceneOp(scene, {
      op: 'wrap_nodes',
      nodeIds: ['a', 'b'],
      containerType: 'Stack',
      containerId: 'wrap-w8d',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.scene.root.children?.find((c) => c.id === 'u')).toBe(unrelated)
    expect(scene.root.children?.map((c) => c.id)).toEqual(['a', 'b', 'u'])
    const wrap = result.scene.root.children?.find((c) => c.id === 'wrap-w8d')
    expect(wrap?.children?.map((c) => c.id)).toEqual(['a', 'b'])
  })

  it('unwrap_node shares siblings outside the unwrapped container (W8d)', () => {
    const innerA: SceneNode = { id: 'ia', type: 'Text', props: { children: 'A' } }
    const innerB: SceneNode = { id: 'ib', type: 'Text', props: { children: 'B' } }
    const wrap: SceneNode = { id: 'wrap', type: 'Stack', children: [innerA, innerB] }
    const sibling: SceneNode = { id: 'sib', type: 'Text', props: { children: 'S' } }
    const root: SceneNode = { id: 'root', type: 'Stack', children: [wrap, sibling] }
    const base = createLegacyFixtureScene()
    const scene: CompositionScene = {
      ...base,
      root,
      pages: [{ id: DEFAULT_SCENE_PAGE_ID, name: 'Page 1', root }],
      activePageId: DEFAULT_SCENE_PAGE_ID,
    }
    const result = applySceneOp(scene, { op: 'unwrap_node', nodeId: 'wrap' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.scene.root.children?.find((c) => c.id === 'sib')).toBe(sibling)
    expect(result.scene.root.children?.map((c) => c.id)).toEqual(['ia', 'ib', 'sib'])
    expect(scene.root.children?.[0]).toBe(wrap)
  })

  it('add_interaction shares inactive page roots (W8d)', () => {
    const page2Root: SceneNode = {
      id: 'p2-root',
      type: 'Stack',
      children: [{ id: 'p2-text', type: 'Text', props: { children: 'Other' } }],
    }
    const base = createLegacyFixtureScene()
    const scene: CompositionScene = {
      ...base,
      pages: [
        { id: DEFAULT_SCENE_PAGE_ID, name: 'Page 1', root: base.root },
        { id: 'page-2', name: 'Page 2', root: page2Root },
      ],
      activePageId: DEFAULT_SCENE_PAGE_ID,
      root: base.root,
    }
    const inactiveBefore = scene.pages![1]!.root
    const result = applySceneOp(scene, {
      op: 'add_interaction',
      nodeId: 'title',
      interaction: {
        id: 'ix-1',
        trigger: 'click',
        action: 'navigate',
        target: '/next',
      },
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.scene.pages?.[1]?.root).toBe(inactiveBefore)
    expect(scene.root.children?.find((c) => c.id === 'title')?.interactions).toBeUndefined()
    expect(result.scene.root.children?.find((c) => c.id === 'title')?.interactions?.[0]?.id).toBe(
      'ix-1',
    )
  })

  it('table_add_column shares siblings and does not mutate input (W8d)', () => {
    const cell = (id: string): SceneNode => ({
      id,
      type: 'SiteTableCell',
      children: [{ id: `${id}-t`, type: 'SiteText', props: { children: 'C' } }],
    })
    const row1: SceneNode = {
      id: 'row-1',
      type: 'SiteTableRow',
      props: { header: true },
      children: [cell('c1'), cell('c2')],
    }
    const row2: SceneNode = {
      id: 'row-2',
      type: 'SiteTableRow',
      children: [cell('c3'), cell('c4')],
    }
    const table: SceneNode = {
      id: 'tbl',
      type: 'SiteTable',
      children: [row1, row2],
    }
    const sibling: SceneNode = { id: 'sib', type: 'Text', props: { children: 'S' } }
    const root: SceneNode = { id: 'root', type: 'Stack', children: [table, sibling] }
    const base = createLegacyFixtureScene()
    const scene: CompositionScene = {
      ...base,
      root,
      pages: [{ id: DEFAULT_SCENE_PAGE_ID, name: 'Page 1', root }],
      activePageId: DEFAULT_SCENE_PAGE_ID,
    }
    const colsBefore = row1.children!.length
    const result = applySceneOp(scene, { op: 'table_add_column', nodeId: 'tbl' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.scene.root.children?.find((c) => c.id === 'sib')).toBe(sibling)
    expect(row1.children).toHaveLength(colsBefore)
    const nextTable = result.scene.root.children?.find((c) => c.id === 'tbl')
    expect(nextTable?.children?.[0]?.children).toHaveLength(colsBefore + 1)
    expect(nextTable?.children?.[0]).not.toBe(row1)
  })

  it('rename_page and set_active_page share other page roots (W8e)', () => {
    const page1Root: SceneNode = {
      id: 'p1',
      type: 'Stack',
      children: [{ id: 'p1-t', type: 'Text', props: { children: '1' } }],
    }
    const page2Root: SceneNode = {
      id: 'p2',
      type: 'Stack',
      children: [{ id: 'p2-t', type: 'Text', props: { children: '2' } }],
    }
    const base = createLegacyFixtureScene()
    const scene: CompositionScene = {
      ...base,
      root: page1Root,
      pages: [
        { id: DEFAULT_SCENE_PAGE_ID, name: 'Page 1', root: page1Root },
        { id: 'page-2', name: 'Page 2', root: page2Root },
      ],
      activePageId: DEFAULT_SCENE_PAGE_ID,
    }
    const renamed = applySceneOp(scene, {
      op: 'rename_page',
      pageId: DEFAULT_SCENE_PAGE_ID,
      name: 'Home',
    })
    expect(renamed.ok).toBe(true)
    if (!renamed.ok) return
    expect(renamed.scene.pages?.[1]?.root).toBe(page2Root)
    expect(scene.pages?.[0]?.name).toBe('Page 1')

    const switched = applySceneOp(renamed.scene, { op: 'set_active_page', pageId: 'page-2' })
    expect(switched.ok).toBe(true)
    if (!switched.ok) return
    expect(switched.scene.root).toBe(page2Root)
    expect(switched.scene.pages?.[0]?.root).toBe(page1Root)
  })

  it('add_page shares existing page roots (W8e)', () => {
    const page1Root: SceneNode = {
      id: 'p1',
      type: 'Stack',
      children: [{ id: 'p1-t', type: 'Text', props: { children: '1' } }],
    }
    const base = createLegacyFixtureScene()
    const scene: CompositionScene = {
      ...base,
      root: page1Root,
      pages: [{ id: DEFAULT_SCENE_PAGE_ID, name: 'Page 1', root: page1Root, frame: { x: 0, y: 0 } }],
      activePageId: DEFAULT_SCENE_PAGE_ID,
    }
    const result = applySceneOp(scene, { op: 'add_page', name: 'Pricing' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.scene.pages?.[0]?.root).toBe(page1Root)
    expect(result.scene.pages).toHaveLength(2)
    expect(scene.pages).toHaveLength(1)
  })

  it('move_node_to_page shares a third page root and does not mutate input (W8e)', () => {
    const leaf: SceneNode = { id: 'leaf', type: 'Text', props: { children: 'L' } }
    const fromRoot: SceneNode = { id: 'from-root', type: 'Stack', children: [leaf] }
    const toRoot: SceneNode = {
      id: 'to-root',
      type: 'Stack',
      children: [{ id: 'to-keep', type: 'Text', props: { children: 'K' } }],
    }
    const otherRoot: SceneNode = {
      id: 'other-root',
      type: 'Stack',
      children: [{ id: 'other-t', type: 'Text', props: { children: 'O' } }],
    }
    const base = createLegacyFixtureScene()
    const scene: CompositionScene = {
      ...base,
      root: fromRoot,
      pages: [
        { id: 'from', name: 'From', root: fromRoot, frame: { x: 0, y: 0 } },
        { id: 'to', name: 'To', root: toRoot, frame: { x: 400, y: 0 } },
        { id: 'other', name: 'Other', root: otherRoot, frame: { x: 800, y: 0 } },
      ],
      activePageId: 'from',
    }
    const result = applySceneOp(scene, {
      op: 'move_node_to_page',
      nodeId: 'leaf',
      toPageId: 'to',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.scene.pages?.find((p) => p.id === 'other')?.root).toBe(otherRoot)
    expect(scene.pages?.find((p) => p.id === 'from')?.root.children?.[0]).toBe(leaf)
    expect(result.scene.pages?.find((p) => p.id === 'from')?.root.children?.some((c) => c.id === 'leaf')).toBe(
      false,
    )
    expect(result.scene.pages?.find((p) => p.id === 'to')?.root.children?.some((c) => c.id === 'leaf')).toBe(
      true,
    )
  })

  it('rename_master shares unrelated masters and page roots (W8e)', () => {
    const pageRoot: SceneNode = {
      id: 'p1',
      type: 'Stack',
      children: [{ id: 't', type: 'Text', props: { children: 'T' } }],
    }
    const masterA = {
      id: 'master-a',
      name: 'A',
      root: { id: 'ma-root', type: 'Text', props: { children: 'A' } } as SceneNode,
    }
    const masterB = {
      id: 'master-b',
      name: 'B',
      root: { id: 'mb-root', type: 'Text', props: { children: 'B' } } as SceneNode,
    }
    const base = createLegacyFixtureScene()
    const scene: CompositionScene = {
      ...base,
      root: pageRoot,
      pages: [{ id: DEFAULT_SCENE_PAGE_ID, name: 'Page 1', root: pageRoot }],
      activePageId: DEFAULT_SCENE_PAGE_ID,
      masters: [masterA, masterB],
    }
    const result = applySceneOp(scene, {
      op: 'rename_master',
      masterId: 'master-a',
      name: 'Alpha',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.scene.masters?.find((m) => m.id === 'master-b')).toBe(masterB)
    expect(result.scene.pages?.[0]?.root).toBe(pageRoot)
    expect(masterA.name).toBe('A')
    expect(result.scene.masters?.find((m) => m.id === 'master-a')?.name).toBe('Alpha')
  })

  it('set_flags shares siblings and does not mutate input (W8f)', () => {
    const a: SceneNode = { id: 'a', type: 'Text', props: { children: 'A' } }
    const b: SceneNode = { id: 'b', type: 'Text', props: { children: 'B' } }
    const root: SceneNode = { id: 'root', type: 'Stack', children: [a, b] }
    const base = createLegacyFixtureScene()
    const scene: CompositionScene = {
      ...base,
      root,
      pages: [{ id: DEFAULT_SCENE_PAGE_ID, name: 'Page 1', root }],
      activePageId: DEFAULT_SCENE_PAGE_ID,
    }
    const result = applySceneOp(scene, { op: 'set_flags', nodeId: 'a', hidden: true, locked: true })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.scene.root.children?.find((c) => c.id === 'b')).toBe(b)
    expect(a.hidden).toBeUndefined()
    expect(a.locked).toBeUndefined()
    const nextA = result.scene.root.children?.find((c) => c.id === 'a')
    expect(nextA?.hidden).toBe(true)
    expect(nextA?.locked).toBe(true)
  })
})
