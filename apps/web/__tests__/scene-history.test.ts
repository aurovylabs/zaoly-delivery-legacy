import { describe, expect, it } from 'vitest'
import {
  canRedo,
  canUndo,
  createHistory,
  pushHistory,
  redoHistory,
  undoHistory,
} from '../lib/scene/history'
import { invertSceneOps } from '../lib/scene/invert-scene-ops'
import { applySceneOp, defaultChildForType } from '../lib/scene/ops'
import { applySceneOpBatch } from '../lib/scene/apply-scene-op-batch'
import { createEmptyArtboardScene, createLegacyFixtureScene } from '../lib/scene/demo-scene'
import { DEFAULT_SCENE_PAGE_ID } from '../lib/scene/scene-pages'
import type { SceneOp } from '@zaoly/contracts'

describe('invertSceneOps (W7 / W7b / W7c / W7d)', () => {
  it('inverts set_prop', () => {
    const before = createLegacyFixtureScene()
    const ops: SceneOp[] = [
      { op: 'set_prop', nodeId: 'title', key: 'children', value: 'Hello' },
    ]
    const inverse = invertSceneOps(before, ops)
    expect(inverse).not.toBeNull()
    const applied = applySceneOp(before, ops[0]!)
    expect(applied.ok).toBe(true)
    if (!applied.ok || !inverse) return
    const undone = applySceneOp(applied.scene, inverse[0]!)
    expect(undone.ok).toBe(true)
    if (!undone.ok) return
    const title = undone.scene.root.children?.find((c) => c.id === 'title')
    const orig = before.root.children?.find((c) => c.id === 'title')
    expect(title?.props?.children).toBe(orig?.props?.children)
  })

  it('returns null for id-minting ops without committedAfter', () => {
    const before = createLegacyFixtureScene()
    expect(
      invertSceneOps(before, [{ op: 'create_master', nodeId: 'card-1', name: 'Master' }]),
    ).toBeNull()
  })

  it('inverts create_master and restores the original node (W7d)', () => {
    const before = createLegacyFixtureScene()
    const ops: SceneOp[] = [{ op: 'create_master', nodeId: 'card-1', name: 'CardMaster' }]
    const applied = applySceneOp(before, ops[0]!)
    expect(applied.ok).toBe(true)
    if (!applied.ok) return
    const inverse = invertSceneOps(before, ops, applied.scene)
    expect(inverse?.some((o) => o.op === 'delete_master')).toBe(true)
    const undone = applySceneOpBatch(applied.scene, inverse!)
    expect(undone.ok).toBe(true)
    if (!undone.ok) return
    expect(undone.scene.masters?.length ?? 0).toBe(0)
    const node = undone.scene.root.children?.find((c) => c.id === 'card-1')
    expect(node?.type).not.toBe('Instance')
  })

  it('inverts rename_master via restore_master (W7d)', () => {
    const created = applySceneOp(createLegacyFixtureScene(), {
      op: 'create_master',
      nodeId: 'card-1',
      name: 'CardMaster',
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const masterId = created.scene.masters![0]!.id
    const before = created.scene
    const ops: SceneOp[] = [{ op: 'rename_master', masterId, name: 'Renamed' }]
    const applied = applySceneOp(before, ops[0]!)
    expect(applied.ok).toBe(true)
    if (!applied.ok) return
    const inverse = invertSceneOps(before, ops, applied.scene)
    expect(inverse?.[0]?.op).toBe('restore_master')
    const undone = applySceneOpBatch(applied.scene, inverse!)
    expect(undone.ok).toBe(true)
    if (!undone.ok) return
    expect(undone.scene.masters?.find((m) => m.id === masterId)?.name).toBe('CardMaster')
  })

  it('inverts insert_instance via remove_node (W7d)', () => {
    const created = applySceneOp(createLegacyFixtureScene(), {
      op: 'create_master',
      nodeId: 'card-1',
      name: 'CardMaster',
    })
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const masterId = created.scene.masters![0]!.id
    const before = created.scene
    const ops: SceneOp[] = [
      { op: 'insert_instance', masterId, parentId: before.root.id },
    ]
    const applied = applySceneOp(before, ops[0]!)
    expect(applied.ok).toBe(true)
    if (!applied.ok) return
    const inverse = invertSceneOps(before, ops, applied.scene)
    expect(inverse?.[0]?.op).toBe('remove_node')
    const undone = applySceneOpBatch(applied.scene, inverse!)
    expect(undone.ok).toBe(true)
    if (!undone.ok) return
    expect(undone.scene.root.children?.length).toBe(before.root.children?.length)
  })

  it('inverts remove_node via insert_child', () => {
    const before = createLegacyFixtureScene()
    const ops: SceneOp[] = [{ op: 'remove_node', nodeId: 'title' }]
    const inverse = invertSceneOps(before, ops)
    expect(inverse?.[0]?.op).toBe('insert_child')
  })

  it('inverts wrap_nodes via unwrap_node (W7b)', () => {
    const before = createLegacyFixtureScene()
    const ops: SceneOp[] = [
      {
        op: 'wrap_nodes',
        nodeIds: ['title'],
        containerType: 'Stack',
        containerId: 'wrap-1',
      },
    ]
    const inverse = invertSceneOps(before, ops)
    expect(inverse).toEqual([{ op: 'unwrap_node', nodeId: 'wrap-1' }])
    const applied = applySceneOp(before, ops[0]!)
    expect(applied.ok).toBe(true)
    if (!applied.ok || !inverse) return
    const undone = applySceneOpBatch(applied.scene, inverse)
    expect(undone.ok).toBe(true)
    if (!undone.ok) return
    expect(undone.scene.root.children?.some((c) => c.id === 'title')).toBe(true)
    expect(undone.scene.root.children?.some((c) => c.id === 'wrap-1')).toBe(false)
  })

  it('inverts set_flags (W7b)', () => {
    const before = createLegacyFixtureScene()
    const ops: SceneOp[] = [{ op: 'set_flags', nodeId: 'title', hidden: true }]
    const inverse = invertSceneOps(before, ops)
    expect(inverse?.[0]).toMatchObject({
      op: 'set_flags',
      nodeId: 'title',
      hidden: false,
      locked: false,
    })
  })

  it('inverts add_interaction (W7b)', () => {
    const before = createLegacyFixtureScene()
    const interaction = {
      id: 'ix-1',
      trigger: 'click' as const,
      action: 'navigate' as const,
      url: '/next',
    }
    const ops: SceneOp[] = [
      { op: 'add_interaction', nodeId: 'title', interaction },
    ]
    const inverse = invertSceneOps(before, ops)
    expect(inverse).toEqual([
      { op: 'remove_interaction', nodeId: 'title', interactionId: 'ix-1' },
    ])
  })

  it('inverts table_add_row to table_remove_row (W7b)', () => {
    const scene = createEmptyArtboardScene()
    const table = defaultChildForType('SiteTable')
    scene.root.children = [table]
    const ops: SceneOp[] = [{ op: 'table_add_row', nodeId: table.id }]
    const inverse = invertSceneOps(scene, ops)
    expect(inverse).toEqual([{ op: 'table_remove_row', nodeId: table.id }])
    const applied = applySceneOp(scene, ops[0]!)
    expect(applied.ok).toBe(true)
    if (!applied.ok || !inverse) return
    const undone = applySceneOpBatch(applied.scene, inverse)
    expect(undone.ok).toBe(true)
    if (!undone.ok) return
    expect(undone.scene.root.children?.[0]?.children).toHaveLength(
      scene.root.children?.[0]?.children?.length ?? 0,
    )
  })

  it('inverts rename_page (W7b)', () => {
    const before = createEmptyArtboardScene()
    const pageId = before.pages?.[0]?.id ?? DEFAULT_SCENE_PAGE_ID
    const prevName = before.pages?.[0]?.name ?? 'Page 1'
    const ops: SceneOp[] = [{ op: 'rename_page', pageId, name: 'Renamed' }]
    const inverse = invertSceneOps(before, ops)
    expect(inverse).toEqual([{ op: 'rename_page', pageId, name: prevName }])
  })

  it('inverts add_page via delete_page (W7c)', () => {
    const before = createEmptyArtboardScene()
    const prevActive = before.activePageId ?? before.pages?.[0]?.id
    const ops: SceneOp[] = [{ op: 'add_page', name: 'Pricing' }]
    const applied = applySceneOp(before, ops[0]!)
    expect(applied.ok).toBe(true)
    if (!applied.ok) return
    const inverse = invertSceneOps(before, ops, applied.scene)
    expect(inverse?.[0]?.op).toBe('delete_page')
    expect(inverse?.[1]).toEqual({ op: 'set_active_page', pageId: prevActive })
    const undone = applySceneOpBatch(applied.scene, inverse!)
    expect(undone.ok).toBe(true)
    if (!undone.ok) return
    expect(undone.scene.pages).toHaveLength(before.pages?.length ?? 1)
    expect(undone.scene.activePageId).toBe(prevActive)
  })

  it('inverts delete_page via restore_page (W7c)', () => {
    let scene = createEmptyArtboardScene()
    const added = applySceneOp(scene, { op: 'add_page', name: 'Pricing' })
    expect(added.ok).toBe(true)
    if (!added.ok) return
    scene = added.scene
    const deletedId = scene.activePageId!
    const pageCount = scene.pages?.length ?? 0
    const ops: SceneOp[] = [{ op: 'delete_page', pageId: deletedId }]
    const applied = applySceneOp(scene, ops[0]!)
    expect(applied.ok).toBe(true)
    if (!applied.ok) return
    const inverse = invertSceneOps(scene, ops, applied.scene)
    expect(inverse?.[0]?.op).toBe('restore_page')
    const undone = applySceneOpBatch(applied.scene, inverse!)
    expect(undone.ok).toBe(true)
    if (!undone.ok) return
    expect(undone.scene.pages).toHaveLength(pageCount)
    expect(undone.scene.pages?.some((p) => p.id === deletedId)).toBe(true)
  })

  it('inverts table_remove_row via insert_child (W7c)', () => {
    const scene = createEmptyArtboardScene()
    const table = defaultChildForType('SiteTable')
    scene.root.children = [table]
    const grown = applySceneOp(scene, { op: 'table_add_row', nodeId: table.id })
    expect(grown.ok).toBe(true)
    if (!grown.ok) return
    const before = grown.scene
    const beforeRows = before.root.children?.[0]?.children?.length ?? 0
    const ops: SceneOp[] = [{ op: 'table_remove_row', nodeId: table.id }]
    const applied = applySceneOp(before, ops[0]!)
    expect(applied.ok).toBe(true)
    if (!applied.ok) return
    const inverse = invertSceneOps(before, ops, applied.scene)
    expect(inverse?.[0]?.op).toBe('insert_child')
    const undone = applySceneOpBatch(applied.scene, inverse!)
    expect(undone.ok).toBe(true)
    if (!undone.ok) return
    expect(undone.scene.root.children?.[0]?.children).toHaveLength(beforeRows)
  })

  it('inverts move_node_to_page (W7c)', () => {
    let scene = createEmptyArtboardScene()
    const title = defaultChildForType('Text')
    title.id = 'move-title'
    title.props = { ...(title.props ?? {}), children: 'Move me' }
    scene.root.children = [title]
    const added = applySceneOp(scene, { op: 'add_page', name: 'Dest' })
    expect(added.ok).toBe(true)
    if (!added.ok) return
    scene = added.scene
    const destPageId = scene.activePageId!
    const sourcePageId = scene.pages?.find((p) => p.id !== destPageId)?.id
    expect(sourcePageId).toBeTruthy()
    if (!sourcePageId) return
    const activated = applySceneOp(scene, { op: 'set_active_page', pageId: sourcePageId })
    expect(activated.ok).toBe(true)
    if (!activated.ok) return
    scene = activated.scene
    const ops: SceneOp[] = [
      { op: 'move_node_to_page', nodeId: 'move-title', toPageId: destPageId },
    ]
    const applied = applySceneOp(scene, ops[0]!)
    expect(applied.ok).toBe(true)
    if (!applied.ok) return
    const inverse = invertSceneOps(scene, ops, applied.scene)
    expect(inverse?.[0]?.op).toBe('move_node_to_page')
    const undone = applySceneOpBatch(applied.scene, inverse!)
    expect(undone.ok).toBe(true)
    if (!undone.ok) return
    const source = undone.scene.pages?.find((p) => p.id === sourcePageId)
    expect(source?.root.children?.some((c) => c.id === 'move-title')).toBe(true)
  })
})

describe('scene history (W7 patches)', () => {
  it('undoes and redoes mutations via ops entries', () => {
    const initial = createLegacyFixtureScene()
    let history = createHistory(initial)
    expect(canUndo(history)).toBe(false)

    const firstOp: SceneOp = {
      op: 'set_prop',
      nodeId: 'title',
      key: 'children',
      value: 'A',
    }
    const first = applySceneOp(history.present, firstOp)
    expect(first.ok).toBe(true)
    if (!first.ok) return
    history = pushHistory(history, first.scene, { ops: [firstOp] })
    expect(history.past[0]?.kind).toBe('ops')
    expect(canUndo(history)).toBe(true)

    const secondOp: SceneOp = {
      op: 'set_prop',
      nodeId: 'title',
      key: 'children',
      value: 'B',
    }
    const second = applySceneOp(history.present, secondOp)
    expect(second.ok).toBe(true)
    if (!second.ok) return
    history = pushHistory(history, second.scene, { ops: [secondOp] })

    const undone = undoHistory(history)
    expect(undone).not.toBeNull()
    if (!undone) return
    history = undone
    const title = history.present.root.children?.find((c) => c.id === 'title')
    expect(title?.props?.children).toBe('A')
    expect(canRedo(history)).toBe(true)

    const redone = redoHistory(history)
    expect(redone).not.toBeNull()
    if (!redone) return
    const title2 = redone.present.root.children?.find((c) => c.id === 'title')
    expect(title2?.props?.children).toBe('B')
  })

  it('stores wrap as ops entry after W7b invert', () => {
    const initial = createLegacyFixtureScene()
    let history = createHistory(initial)
    const wrap: SceneOp = {
      op: 'wrap_nodes',
      nodeIds: ['title'],
      containerType: 'Stack',
      containerId: 'wrap-1',
    }
    const result = applySceneOp(history.present, wrap)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    history = pushHistory(history, result.scene, { ops: [wrap] })
    expect(history.past[0]?.kind).toBe('ops')
    const undone = undoHistory(history)
    expect(undone?.present.root.children?.some((c) => c.id === 'title')).toBe(true)
    expect(undone?.present.root.children?.some((c) => c.id === 'wrap-1')).toBe(false)
  })

  it('stores add_page as ops entry and redoes via restore_page (W7c)', () => {
    let history = createHistory(createEmptyArtboardScene())
    const add: SceneOp = { op: 'add_page', name: 'Pricing' }
    const result = applySceneOp(history.present, add)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const addedId = result.scene.activePageId
    history = pushHistory(history, result.scene, { ops: [add] })
    expect(history.past[0]?.kind).toBe('ops')
    if (history.past[0]?.kind === 'ops') {
      expect(history.past[0].forward[0]?.op).toBe('restore_page')
    }
    const undone = undoHistory(history)
    expect(undone?.present.pages).toHaveLength(1)
    expect(undone).not.toBeNull()
    if (!undone) return
    const redone = redoHistory(undone)
    expect(redone?.present.pages).toHaveLength(2)
    expect(redone?.present.pages?.some((p) => p.id === addedId)).toBe(true)
  })

  it('stores create_master as ops entry and redoes via restore_master (W7d)', () => {
    let history = createHistory(createLegacyFixtureScene())
    const create: SceneOp = { op: 'create_master', nodeId: 'card-1', name: 'CardMaster' }
    const result = applySceneOp(history.present, create)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const masterId = result.scene.masters?.[0]?.id
    history = pushHistory(history, result.scene, { ops: [create] })
    expect(history.past[0]?.kind).toBe('ops')
    if (history.past[0]?.kind === 'ops') {
      expect(history.past[0].forward[0]?.op).toBe('restore_master')
    }
    const undone = undoHistory(history)
    expect(undone?.present.masters?.length ?? 0).toBe(0)
    expect(undone).not.toBeNull()
    if (!undone) return
    const redone = redoHistory(undone)
    expect(redone?.present.masters?.some((m) => m.id === masterId)).toBe(true)
    expect(redone?.present.root.children?.find((c) => c.id === 'card-1')?.type).toBe('Instance')
  })

  it('falls back to snapshot when ops are not invertible', () => {
    const initial = createLegacyFixtureScene()
    let history = createHistory(initial)
    const leaf: SceneOp = {
      op: 'set_prop',
      nodeId: 'title',
      key: 'children',
      value: 'snap',
    }
    const result = applySceneOp(history.present, leaf)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    // Mid-batch id-mint cannot invert safely → snapshot fallback.
    history = pushHistory(history, result.scene, {
      ops: [{ op: 'add_page', name: 'X' }, leaf],
    })
    expect(history.past[0]?.kind).toBe('snapshot')
    const undone = undoHistory(history)
    expect(
      undone?.present.root.children?.find((c) => c.id === 'title')?.props?.children,
    ).not.toBe('snap')
  })

  it('push clears future redo stack', () => {
    let history = createHistory(createLegacyFixtureScene())
    const aOp: SceneOp = { op: 'set_prop', nodeId: 'title', key: 'children', value: 'A' }
    const a = applySceneOp(history.present, aOp)
    if (!a.ok) return
    history = pushHistory(history, a.scene, { ops: [aOp] })
    history = undoHistory(history) ?? history
    expect(canRedo(history)).toBe(true)
    const bOp: SceneOp = { op: 'set_prop', nodeId: 'title', key: 'children', value: 'C' }
    const b = applySceneOp(history.present, bOp)
    if (!b.ok) return
    history = pushHistory(history, b.scene, { ops: [bOp] })
    expect(canRedo(history)).toBe(false)
  })

  it('snapshot push without ops still undoes', () => {
    let history = createHistory(createLegacyFixtureScene())
    const next = applySceneOp(history.present, {
      op: 'set_prop',
      nodeId: 'title',
      key: 'children',
      value: 'X',
    })
    if (!next.ok) return
    history = pushHistory(history, next.scene)
    expect(history.past[0]?.kind).toBe('snapshot')
    const undone = undoHistory(history)
    expect(undone?.present.root.children?.find((c) => c.id === 'title')?.props?.children).not.toBe(
      'X',
    )
  })
})
