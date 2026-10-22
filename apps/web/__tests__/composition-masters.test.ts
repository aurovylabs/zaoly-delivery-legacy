import { describe, expect, it } from 'vitest'
import type { CompositionScene, SceneNode } from '@zaoly/contracts'
import {
  expandCompositionScene,
  expandMasterVariantBoardForPaint,
  expandSceneTree,
  expandToDetachedTree,
  isInstanceNode,
  resolveInspectSubject,
  resolveMasterEditInspectSubject,
  resolvePersistedSelectionId,
  walkSceneNodes,
} from '../lib/scene/expand-instances'
import {
  buildMasterVariantBoard,
  listMasterVariants,
  resolveMasterVariant,
} from '../lib/scene/master-variants'
import { createDemoScene, createLegacyFixtureScene } from '../lib/scene/demo-scene'
import {
  applyMasterEditOp,
  applySceneOp,
  findSceneNode,
} from '../lib/scene/ops'
import { materializeScenePages } from '../lib/scene/scene-pages'

function sceneWithCardMaster(): {
  scene: CompositionScene
  masterId: string
  instanceId: string
} {
  const base = createLegacyFixtureScene()
  const created = applySceneOp(base, { op: 'create_master', nodeId: 'card-1', name: 'CardMaster' })
  expect(created.ok).toBe(true)
  if (!created.ok) throw new Error(created.reason)
  const master = created.scene.masters?.[0]
  expect(master).toBeTruthy()
  const instance = findSceneNode(created.scene, 'card-1')
  expect(instance?.type).toBe('Instance')
  expect(instance?.instanceOf).toBe(master!.id)
  return {
    scene: created.scene,
    masterId: master!.id,
    instanceId: 'card-1',
  }
}

describe('composition masters', () => {
  it('convert selection → Master + Instance (same id)', () => {
    const { scene, masterId, instanceId } = sceneWithCardMaster()
    expect(scene.masters).toHaveLength(1)
    expect(scene.masters![0].id).toBe(masterId)
    expect(scene.masters![0].root.type).toBe('Card')
    expect(findSceneNode(scene, instanceId)?.type).toBe('Instance')
  })

  it('expand propagates master edits to all instances', () => {
    const { scene, masterId } = sceneWithCardMaster()
    const inserted = applySceneOp(scene, {
      op: 'insert_instance',
      masterId,
      parentId: 'root',
    })
    expect(inserted.ok).toBe(true)
    if (!inserted.ok) throw new Error(inserted.reason)

    const masterRoot = inserted.scene.masters!.find((m) => m.id === masterId)!.root
    const textNode = (masterRoot.children ?? []).find((c) => c.type === 'Text')
    expect(textNode?.id).toBeTruthy()

    const edited = applyMasterEditOp(inserted.scene, masterId, {
      op: 'set_prop',
      nodeId: textNode!.id,
      key: 'children',
      value: 'Propagated copy',
    })
    expect(edited.ok).toBe(true)
    if (!edited.ok) throw new Error(edited.reason)

    const expanded = expandCompositionScene(edited.scene)
    const instances = (expanded.children ?? []).filter((c) => c.instanceOf === masterId)
    expect(instances.length).toBeGreaterThanOrEqual(2)
    for (const inst of instances) {
      const text = (inst.children ?? []).find((c) => c.type === 'Text')
      expect(text?.props?.children).toBe('Propagated copy')
    }
  })

  it('applyMasterEditOp works when scene has materialized pages', () => {
    const { scene, masterId } = sceneWithCardMaster()
    const withPages = materializeScenePages(scene)
    expect(withPages.pages?.length).toBe(1)
    expect(withPages.pages![0]!.root.id).not.toBe(
      withPages.masters!.find((m) => m.id === masterId)!.root.id,
    )

    const masterRoot = withPages.masters!.find((m) => m.id === masterId)!.root
    const textNode = (masterRoot.children ?? []).find((c) => c.type === 'Text')
    expect(textNode?.id).toBeTruthy()

    const edited = applyMasterEditOp(withPages, masterId, {
      op: 'set_prop',
      nodeId: textNode!.id,
      key: 'children',
      value: 'Multi-page master edit',
    })
    expect(edited.ok).toBe(true)
    if (!edited.ok) throw new Error(edited.reason)

    const nextRoot = edited.scene.masters!.find((m) => m.id === masterId)!.root
    const nextText = (nextRoot.children ?? []).find((c) => c.type === 'Text')
    expect(nextText?.props?.children).toBe('Multi-page master edit')
    // Page artboard must stay untouched by the master-edit temp apply.
    expect(edited.scene.pages?.[0]?.root).toBe(withPages.pages![0]!.root)
  })

  it('applyMasterEditOp works on multi-page demo scenes', () => {
    const demo = createDemoScene()
    expect((demo.pages?.length ?? 0) > 1).toBe(true)
    const master = demo.masters?.find((m) => m.sourceKey === 'SiteText') ?? demo.masters?.[0]
    expect(master).toBeTruthy()
    const textId = master!.root.id
    const edited = applyMasterEditOp(demo, master!.id, {
      op: 'set_prop',
      nodeId: textId,
      key: 'children',
      value: 'Demo master page-safe',
    })
    expect(edited.ok).toBe(true)
    if (!edited.ok) throw new Error(edited.reason)
    expect(edited.scene.masters!.find((m) => m.id === master!.id)!.root.props?.children).toBe(
      'Demo master page-safe',
    )
  })

  it('detach replaces Instance with free tree (no instanceOf)', () => {
    const { scene, instanceId } = sceneWithCardMaster()
    const beforeCount = scene.root.children?.length ?? 0
    const detached = applySceneOp(scene, { op: 'detach_instance', nodeId: instanceId })
    expect(detached.ok).toBe(true)
    if (!detached.ok) throw new Error(detached.reason)
    expect(findSceneNode(detached.scene, instanceId)).toBeNull()
    expect(detached.scene.root.children?.length).toBe(beforeCount)
    const free = (detached.scene.root.children ?? []).find((c) => c.type === 'Card')
    expect(free).toBeTruthy()
    expect(free!.instanceOf).toBeUndefined()
    expect(free!.children?.length).toBeGreaterThan(0)
  })

  it('expandToDetachedTree drops instance linkage', () => {
    const { scene, instanceId } = sceneWithCardMaster()
    const instance = findSceneNode(scene, instanceId)!
    const free = expandToDetachedTree(instance, scene.masters)
    expect(free).toBeTruthy()
    expect(free!.instanceOf).toBeUndefined()
    expect(free!.type).toBe('Card')
  })

  it('rejects insert_child into Instance and delete_master with live refs', () => {
    const { scene, masterId, instanceId } = sceneWithCardMaster()
    const sealed = applySceneOp(scene, {
      op: 'insert_child',
      parentId: instanceId,
      child: { id: 'x', type: 'Text', props: { children: 'nope' } },
    })
    expect(sealed.ok).toBe(false)

    const del = applySceneOp(scene, { op: 'delete_master', masterId })
    expect(del.ok).toBe(false)
  })

  it('instance root overrides do not mutate master', () => {
    const { scene, masterId, instanceId } = sceneWithCardMaster()
    const named = applySceneOp(scene, {
      op: 'set_flags',
      nodeId: instanceId,
      hidden: true,
    })
    expect(named.ok).toBe(true)
    if (!named.ok) throw new Error(named.reason)
    expect(named.scene.masters!.find((m) => m.id === masterId)!.root.hidden).toBeFalsy()
    const inst = findSceneNode(named.scene, instanceId)
    expect(inst?.instanceOverrides?.hidden).toBe(true)
  })

  it('persist round-trip keeps masters + instance refs (JSON)', () => {
    const { scene } = sceneWithCardMaster()
    const round = JSON.parse(JSON.stringify(scene)) as CompositionScene
    expect(round.masters).toHaveLength(1)
    expect(round.masters![0].root.type).toBe('Card')
    const inst = findSceneNode(round, 'card-1')
    expect(inst?.type).toBe('Instance')
    expect(inst?.instanceOf).toBe(round.masters![0].id)
    expect(inst?.children).toBeUndefined()
  })

  it('resolvePersistedSelectionId maps expanded descendant → instance root', () => {
    const { scene, instanceId } = sceneWithCardMaster()
    const expanded = expandCompositionScene(scene)
    const inst = (expanded.children ?? []).find((c) => c.id === instanceId)!
    expect(inst.instanceOf).toBeTruthy()
    const childId = inst.children?.[0]?.id
    expect(childId).toBeTruthy()
    expect(resolvePersistedSelectionId(scene.root, expanded, childId!)).toBe(instanceId)
    expect(resolvePersistedSelectionId(scene.root, expanded, 'title')).toBe('title')
  })

  it('P78: expand descendant ids are stable across re-expand', () => {
    const { scene, instanceId } = sceneWithCardMaster()
    const a = expandCompositionScene(scene)
    const b = expandCompositionScene(scene)
    const instA = (a.children ?? []).find((c) => c.id === instanceId)!
    const instB = (b.children ?? []).find((c) => c.id === instanceId)!
    expect(instA.children?.map((c) => c.id)).toEqual(instB.children?.map((c) => c.id))
    const defChildId = scene.masters![0].root.children![0].id
    expect(instA.children?.[0]?.id).toBe(`${instanceId}::${defChildId}`)
  })

  it('Phase 2: add variant + instanceVariantId switches expand target', () => {
    const { scene, masterId, instanceId } = sceneWithCardMaster()
    const added = applySceneOp(scene, {
      op: 'add_master_variant',
      masterId,
      name: 'Hover',
    })
    expect(added.ok).toBe(true)
    if (!added.ok) throw new Error(added.reason)
    const master = added.scene.masters!.find((m) => m.id === masterId)!
    expect(master.variants).toHaveLength(2)
    expect(master.defaultVariantId).toBeTruthy()
    const hover = master.variants!.find((v) => v.name === 'Hover')!
    expect(hover).toBeTruthy()
    const hoverText = (hover.root.children ?? []).find((c) => c.type === 'Text')
    expect(hoverText?.id).toBeTruthy()

    const editedHover = applyMasterEditOp(
      added.scene,
      masterId,
      {
        op: 'set_prop',
        nodeId: hoverText!.id,
        key: 'children',
        value: 'Hover copy',
      },
      hover.id,
    )
    expect(editedHover.ok).toBe(true)
    if (!editedHover.ok) throw new Error(editedHover.reason)

    const switched = applySceneOp(editedHover.scene, {
      op: 'set_instance_variant',
      nodeId: instanceId,
      variantId: hover.id,
    })
    expect(switched.ok).toBe(true)
    if (!switched.ok) throw new Error(switched.reason)
    expect(findSceneNode(switched.scene, instanceId)?.instanceVariantId).toBe(hover.id)

    const expanded = expandCompositionScene(switched.scene)
    const inst = (expanded.children ?? []).find((c) => c.id === instanceId)
    const text = (inst?.children ?? []).find((c) => c.type === 'Text')
    expect(text?.props?.children).toBe('Hover copy')

    const defaultExpanded = expandCompositionScene(editedHover.scene)
    const defaultInst = (defaultExpanded.children ?? []).find((c) => c.id === instanceId)
    const defaultText = (defaultInst?.children ?? []).find((c) => c.type === 'Text')
    expect(defaultText?.props?.children).not.toBe('Hover copy')

    const roundTrip = JSON.parse(JSON.stringify(switched.scene)) as CompositionScene
    expect(roundTrip.masters?.[0]?.variants?.[1]?.name).toBe('Hover')
    expect(
      (roundTrip.root.children ?? []).find((c) => c.id === instanceId)?.instanceVariantId,
    ).toBe(hover.id)
  })

  it('Inspect subject expands Instance to Master type + definition props', () => {
    const { scene, instanceId, masterId } = sceneWithCardMaster()
    const masterRoot = scene.masters!.find((m) => m.id === masterId)!.root
    const overridden = applySceneOp(scene, {
      op: 'set_prop',
      nodeId: instanceId,
      key: 'children',
      value: 'Instance label',
    })
    expect(overridden.ok).toBe(true)
    if (!overridden.ok) throw new Error(overridden.reason)

    const subject = resolveInspectSubject(overridden.scene, instanceId)
    expect(subject?.type).toBe(masterRoot.type)
    expect(subject?.instanceOf).toBe(masterId)
    expect(subject?.props?.children).toBe('Instance label')
    expect(findSceneNode(overridden.scene, instanceId)?.type).toBe('Instance')
  })

  it('Phase 2: reject empty / colliding variant names and last-variant delete', () => {
    const { scene, masterId } = sceneWithCardMaster()
    const first = applySceneOp(scene, {
      op: 'add_master_variant',
      masterId,
      name: 'Alt',
    })
    expect(first.ok).toBe(true)
    if (!first.ok) throw new Error(first.reason)

    const empty = applySceneOp(first.scene, {
      op: 'add_master_variant',
      masterId,
      name: '   ',
    })
    expect(empty.ok).toBe(false)

    const clash = applySceneOp(first.scene, {
      op: 'add_master_variant',
      masterId,
      name: 'alt',
    })
    expect(clash.ok).toBe(false)

    const master = first.scene.masters!.find((m) => m.id === masterId)!
    const onlyDefault = master.variants!.find((v) => v.name === 'Default')!
    const delLast = applySceneOp(first.scene, {
      op: 'delete_master_variant',
      masterId,
      variantId: onlyDefault.id,
    })
    expect(delLast.ok).toBe(true)
    if (!delLast.ok) throw new Error(delLast.reason)
    expect(delLast.scene.masters!.find((m) => m.id === masterId)!.variants).toHaveLength(1)

    const delSole = applySceneOp(delLast.scene, {
      op: 'delete_master_variant',
      masterId,
      variantId: delLast.scene.masters!.find((m) => m.id === masterId)!.variants![0]!.id,
    })
    expect(delSole.ok).toBe(false)
  })

  it('Master-Edit expands nested palette Instances for paint and inspect', () => {
    const scene = createDemoScene()
    const created = applySceneOp(scene, {
      op: 'create_master',
      nodeId: 'pattern-hero',
      name: 'Hero block',
    })
    expect(created.ok).toBe(true)
    if (!created.ok) throw new Error(created.reason)

    const customMaster = created.scene.masters!.find((m) => m.name === 'Hero block')
    expect(customMaster).toBeTruthy()
    const variant = resolveMasterVariant(customMaster!, null)
    expect(variant.root.type).toBe('SiteStack')

    const nestedInst = (() => {
      let hit: SceneNode | null = null
      walkSceneNodes(variant.root, (n) => {
        if (isInstanceNode(n) && n.instanceOf === 'master-SiteText' && !hit) hit = n
      })
      return hit
    })()
    expect(nestedInst).toBeTruthy()

    const subject = resolveMasterEditInspectSubject(
      variant.root,
      nestedInst!.id,
      created.scene.masters,
    )
    expect(subject?.type).toBe('SiteText')
    expect(subject?.props?.children).toBe('Compose faster with Zaoly')

    const board = buildMasterVariantBoard(customMaster!, variant.id)
    const painted = expandMasterVariantBoardForPaint(board, created.scene.masters)
    const instanceNodes: SceneNode[] = []
    walkSceneNodes(painted, (n) => {
      if (isInstanceNode(n)) instanceNodes.push(n)
    })
    expect(instanceNodes).toHaveLength(0)

    const expandedActive = expandSceneTree(variant.root, created.scene.masters)
    let expandTextId: string | null = null
    walkSceneNodes(expandedActive, (n) => {
      if (n.type === 'SiteText' && !expandTextId) expandTextId = n.id
    })
    expect(expandTextId).toBeTruthy()
    const mapped = resolvePersistedSelectionId(variant.root, expandedActive, expandTextId!)
    expect(mapped).toBe(nestedInst!.id)
  })
})
