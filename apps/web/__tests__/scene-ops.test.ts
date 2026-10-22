import { describe, expect, it } from 'vitest'
import {
  applySceneOp,
  canUnwrapSelection,
  canWrapSelection,
  clipboardNodesFromSelection,
  cloneSceneNodeWithNewIds,
  defaultChildForType,
  dropEdgeFromPoint,
  findSceneNode,
  isSceneContainerType,
  isValidClipboardNodes,
  paletteChildForInsert,
  parseEditorClipboard,
  planLayerDrop,
  planPaletteDrop,
  planPasteInsert,
  serializeEditorClipboard,
} from '../lib/scene/ops'
import { createLegacyFixtureScene } from '../lib/scene/demo-scene'
import {
  __resetSceneStoreForTests,
  bindScenePlatformProject,
  getScene,
  upsertScene,
} from '../lib/scene/scene-store'
import { paths } from '../lib/paths'
import { resolveEnumPropsToStyle, resolveNodePaintStyle } from '../lib/inspect/resolve-bindings'
import { printChipSurfacePaint, PRINT_CHIP_SURFACE_VARS } from '../lib/scene/print-chip-surface'

describe('scene ops', () => {
  it('set_prop updates text children', () => {
    const scene = createLegacyFixtureScene()
    const result = applySceneOp(scene, {
      op: 'set_prop',
      nodeId: 'title',
      key: 'children',
      value: 'Updated',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const title = result.scene.root.children?.find((c) => c.id === 'title')
    expect(title?.props?.children).toBe('Updated')
  })

  it('set_prop SiteSvg markup sanitizes and rejects scripts', () => {
    const svg = defaultChildForType('SiteSvg')
    const scene = createLegacyFixtureScene()
    const inserted = applySceneOp(scene, {
      op: 'insert_child',
      parentId: scene.root.id,
      child: svg,
    })
    expect(inserted.ok).toBe(true)
    if (!inserted.ok) return

    const rejected = applySceneOp(inserted.scene, {
      op: 'set_prop',
      nodeId: svg.id,
      key: 'markup',
      value: '<svg><script>alert(1)</script></svg>',
    })
    expect(rejected.ok).toBe(false)
    if (rejected.ok) return
    expect(rejected.reason).toMatch(/script-rejected/)

    const ok = applySceneOp(inserted.scene, {
      op: 'set_prop',
      nodeId: svg.id,
      key: 'markup',
      value:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" onclick="evil()"><circle cx="12" cy="12" r="8"/></svg>',
    })
    expect(ok.ok).toBe(true)
    if (!ok.ok) return
    const node = findSceneNode(ok.scene, svg.id)
    expect(String(node?.props?.markup ?? '')).toMatch(/<circle/)
    expect(String(node?.props?.markup ?? '')).not.toMatch(/onclick/i)
    expect(node?.props?.viewBox).toBe('0 0 24 24')
  })

  it('SiteSvg insert defaults color token binding for Phase 1 paint', () => {
    const svg = defaultChildForType('SiteSvg')
    expect(svg.tokenBindings?.color).toBe('color.ink')
    expect(String(svg.props?.markup ?? '')).toMatch(/currentColor/)
    expect(svg.props?.mark).toBe('triangle')
  })

  it('set_prop SiteSvg mark snapshots kit markup; markup sets mark custom', () => {
    const svg = defaultChildForType('SiteSvg')
    const scene = createLegacyFixtureScene()
    const inserted = applySceneOp(scene, {
      op: 'insert_child',
      parentId: scene.root.id,
      child: svg,
    })
    expect(inserted.ok).toBe(true)
    if (!inserted.ok) return

    const sealed = applySceneOp(inserted.scene, {
      op: 'set_prop',
      nodeId: svg.id,
      key: 'mark',
      value: 'seal',
    })
    expect(sealed.ok).toBe(true)
    if (!sealed.ok) return
    const sealNode = findSceneNode(sealed.scene, svg.id)
    expect(sealNode?.props?.mark).toBe('seal')
    expect(String(sealNode?.props?.markup ?? '')).toMatch(/stroke="currentColor"/)
    expect(sealNode?.props?.alt).toBe('Seal')

    const custom = applySceneOp(sealed.scene, {
      op: 'set_prop',
      nodeId: svg.id,
      key: 'markup',
      value:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12"><rect width="12" height="12" fill="#f00"/></svg>',
    })
    expect(custom.ok).toBe(true)
    if (!custom.ok) return
    const customNode = findSceneNode(custom.scene, svg.id)
    expect(customNode?.props?.mark).toBe('custom')
    expect(String(customNode?.props?.markup ?? '')).toMatch(/#f00/)
  })

  it('P54 set_prop PrintChip children patches slotted label Text', () => {
    const chip = defaultChildForType('PrintChip')
    const scene = createLegacyFixtureScene()
    const inserted = applySceneOp(scene, {
      op: 'insert_child',
      parentId: scene.root.id,
      child: chip,
    })
    expect(inserted.ok).toBe(true)
    if (!inserted.ok) return
    const patched = applySceneOp(inserted.scene, {
      op: 'set_prop',
      nodeId: chip.id,
      key: 'children',
      value: 'GEO',
    })
    expect(patched.ok).toBe(true)
    if (!patched.ok) return
    const found = findSceneNode(patched.scene, chip.id)
    expect(found?.props?.children).toBeUndefined()
    expect(found?.children?.some(
        (c) => c.type === 'Text' && c.props?.slot === 'label' && c.props?.children === 'GEO',
      ),
    ).toBe(true)
  })

  it('P92 set_prop PrintChip tone stores on the shell', () => {
    const chip = defaultChildForType('PrintChip')
    const scene = createLegacyFixtureScene()
    const inserted = applySceneOp(scene, {
      op: 'insert_child',
      parentId: scene.root.id,
      child: chip,
    })
    expect(inserted.ok).toBe(true)
    if (!inserted.ok) return
    const patched = applySceneOp(inserted.scene, {
      op: 'set_prop',
      nodeId: chip.id,
      key: 'tone',
      value: 'solid',
    })
    expect(patched.ok).toBe(true)
    if (!patched.ok) return
    expect(findSceneNode(patched.scene, chip.id)?.props?.tone).toBe('solid')
  })

  it('P92 set_prop PrintCallout variant stores on the shell', () => {
    const callout = defaultChildForType('PrintCallout')
    const scene = createLegacyFixtureScene()
    const inserted = applySceneOp(scene, {
      op: 'insert_child',
      parentId: scene.root.id,
      child: callout,
    })
    expect(inserted.ok).toBe(true)
    if (!inserted.ok) return
    expect(findSceneNode(inserted.scene, callout.id)?.props?.variant).toBe('wash')
    const patched = applySceneOp(inserted.scene, {
      op: 'set_prop',
      nodeId: callout.id,
      key: 'variant',
      value: 'quiet',
    })
    expect(patched.ok).toBe(true)
    if (!patched.ok) return
    expect(findSceneNode(patched.scene, callout.id)?.props?.variant).toBe('quiet')
  })

  it('P92 PrintSteps defaults seed RankedRow children + emphasisIndex', () => {
    const steps = defaultChildForType('PrintSteps')
    expect(steps.props?.orientation).toBe('horizontal')
    expect(steps.props?.emphasisIndex).toBe('2')
    expect(steps.children?.filter((c) => c.type === 'RankedRow')).toHaveLength(4)
    expect(isSceneContainerType('PrintSteps')).toBe(true)
  })

  it('P56 set_prop PrintChip width and name persist; radius paints the chip', () => {
    const chip = defaultChildForType('PrintChip')
    const scene = createLegacyFixtureScene()
    const inserted = applySceneOp(scene, {
      op: 'insert_child',
      parentId: scene.root.id,
      child: { ...chip, style: { width: 40 } },
    })
    expect(inserted.ok).toBe(true)
    if (!inserted.ok) return
    const named = applySceneOp(inserted.scene, {
      op: 'set_prop',
      nodeId: chip.id,
      key: 'name',
      value: 'GEO chip',
    })
    expect(named.ok).toBe(true)
    if (!named.ok) return
    const sized = applySceneOp(named.scene, {
      op: 'set_prop',
      nodeId: chip.id,
      key: 'width',
      value: 96,
    })
    expect(sized.ok).toBe(true)
    if (!sized.ok) return
    const rounded = applySceneOp(sized.scene, {
      op: 'set_prop',
      nodeId: chip.id,
      key: 'radius',
      value: '12px',
    })
    expect(rounded.ok).toBe(true)
    if (!rounded.ok) return
    const found = findSceneNode(rounded.scene, chip.id)
    expect(found?.name).toBe('GEO chip')
    expect(found?.props?.width).toBe(96)
    expect(found?.style?.width).toBeUndefined()
    expect(found?.props?.radius).toBe('12px')
    const painted = printChipSurfacePaint(
      resolveNodePaintStyle(found?.props, found?.tokenBindings, found?.style),
    )
    expect(painted.size).toBe(true)
    expect(painted.wrapStyle.width).toBe(96)
    expect(painted.radius).toBe(true)
    expect((painted.wrapStyle as Record<string, string>)[PRINT_CHIP_SURFACE_VARS.radius]).toBe(
      '12px',
    )
  })

  it('P55 set_prop PrintChip textAlign stores on the shell', () => {
    const chip = defaultChildForType('PrintChip')
    const scene = createLegacyFixtureScene()
    const inserted = applySceneOp(scene, {
      op: 'insert_child',
      parentId: scene.root.id,
      child: chip,
    })
    expect(inserted.ok).toBe(true)
    if (!inserted.ok) return
    const aligned = applySceneOp(inserted.scene, {
      op: 'set_prop',
      nodeId: chip.id,
      key: 'textAlign',
      value: 'center',
    })
    expect(aligned.ok).toBe(true)
    if (!aligned.ok) return
    const found = findSceneNode(aligned.scene, chip.id)
    expect(found?.props?.textAlign).toBe('center')
    expect(resolveEnumPropsToStyle(found?.props).textAlign).toBe('center')
    const label = found?.children?.find((c) => c.props?.slot === 'label')
    expect(label?.props?.textAlign).toBeUndefined()
  })

  it('P54 set_prop PrintChip children lifts a label Text when missing', () => {
    const scene = createLegacyFixtureScene()
    const bare = { id: 'pc-bare', type: 'PrintChip' }
    const inserted = applySceneOp(scene, {
      op: 'insert_child',
      parentId: scene.root.id,
      child: bare,
    })
    expect(inserted.ok).toBe(true)
    if (!inserted.ok) return
    const patched = applySceneOp(inserted.scene, {
      op: 'set_prop',
      nodeId: 'pc-bare',
      key: 'children',
      value: 'Lifted',
    })
    expect(patched.ok).toBe(true)
    if (!patched.ok) return
    const found = findSceneNode(patched.scene, 'pc-bare')
    expect(found?.props?.children).toBeUndefined()
    expect(
      found?.children?.some(
        (c) => c.type === 'Text' && c.props?.slot === 'label' && c.props?.children === 'Lifted',
      ),
    ).toBe(true)
  })

  it('set_prop name updates node.name', () => {
    const scene = createLegacyFixtureScene()
    const result = applySceneOp(scene, {
      op: 'set_prop',
      nodeId: 'title',
      key: 'name',
      value: 'Hero title',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const title = result.scene.root.children?.find((c) => c.id === 'title')
    expect(title?.name).toBe('Hero title')
    expect(title?.props?.name).toBeUndefined()
  })

  it('rejects remove root', () => {
    const scene = createLegacyFixtureScene()
    const result = applySceneOp(scene, { op: 'remove_node', nodeId: 'root' })
    expect(result.ok).toBe(false)
  })

  it('reorders sibling among parent children', () => {
    const scene = createLegacyFixtureScene()
    const before = scene.root.children?.map((c) => c.id) ?? []
    expect(before.length).toBeGreaterThan(1)
    const first = before[0]
    const result = applySceneOp(scene, { op: 'reorder_node', nodeId: first, index: 1 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const after = result.scene.root.children?.map((c) => c.id) ?? []
    expect(after[1]).toBe(first)
    expect(after[0]).toBe(before[1])
  })

  it('rejects reorder root', () => {
    const scene = createLegacyFixtureScene()
    const result = applySceneOp(scene, { op: 'reorder_node', nodeId: 'root', index: 0 })
    expect(result.ok).toBe(false)
  })

  it('move_node nests into container and rejects cycles', () => {
    const scene = createLegacyFixtureScene()
    const kids = scene.root.children ?? []
    expect(kids.length).toBeGreaterThan(0)
    const first = kids[0]
    const stackId = 'nest-stack'
    const innerId = 'nest-inner'
    const withStack = applySceneOp(scene, {
      op: 'insert_child',
      parentId: scene.root.id,
      index: 0,
      child: {
        id: stackId,
        type: 'Stack',
        props: {},
        children: [{ id: innerId, type: 'Stack', props: {}, children: [] }],
      },
    })
    expect(withStack.ok).toBe(true)
    if (!withStack.ok) return

    const moved = applySceneOp(withStack.scene, {
      op: 'move_node',
      nodeId: first.id,
      parentId: stackId,
      index: 1,
    })
    expect(moved.ok).toBe(true)
    if (!moved.ok) return
    const stack = moved.scene.root.children?.find((c) => c.id === stackId)
    expect(stack?.children?.some((c) => c.id === first.id)).toBe(true)
    expect(moved.scene.root.children?.some((c) => c.id === first.id)).toBe(false)

    const cycle = applySceneOp(moved.scene, {
      op: 'move_node',
      nodeId: stackId,
      parentId: innerId,
      index: 0,
    })
    expect(cycle.ok).toBe(false)
  })

  it('planLayerDrop supports into and rejects nesting into descendant', () => {
    const scene = createLegacyFixtureScene()
    const withStack = applySceneOp(scene, {
      op: 'insert_child',
      parentId: scene.root.id,
      child: { id: 'box', type: 'Stack', props: {}, children: [] },
    })
    expect(withStack.ok).toBe(true)
    if (!withStack.ok) return
    const title = withStack.scene.root.children?.find((c) => c.type === 'Text')
    expect(title).toBeTruthy()
    const into = planLayerDrop(withStack.scene, title!.id, 'box', 'into')
    expect(into.ok).toBe(true)
    if (into.ok) {
      expect(into.parentId).toBe('box')
      expect(into.index).toBe(0)
    }

    const nested = applySceneOp(withStack.scene, {
      op: 'move_node',
      nodeId: title!.id,
      parentId: 'box',
      index: 0,
    })
    expect(nested.ok).toBe(true)
    if (!nested.ok) return
    const bad = planLayerDrop(nested.scene, 'box', title!.id, 'into')
    expect(bad.ok).toBe(false)
  })

  it('clones node with fresh ids for duplicate', () => {
    const scene = createLegacyFixtureScene()
    const title = scene.root.children?.find((c) => c.id === 'title')
    expect(title).toBeTruthy()
    const clone = cloneSceneNodeWithNewIds(title!)
    expect(clone.id).not.toBe(title!.id)
    expect(clone.type).toBe(title!.type)
    expect(clone.props?.children).toBe(title!.props?.children)
  })

  it('inserts Top-N child under stack', () => {
    const scene = createLegacyFixtureScene()
    const child = defaultChildForType('Button')
    const result = applySceneOp(scene, {
      op: 'insert_child',
      parentId: 'root',
      child,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.scene.root.children?.some((c) => c.id === child.id)).toBe(true)
  })

  it('keeps a Slider dropped into EntityCard as a selectable child', () => {
    const card = defaultChildForType('EntityCard')
    const scene = {
      id: 's1',
      name: 'Atomic',
      version: 1 as const,
      root: { id: 'root', type: 'Stack', children: [card] },
      updatedAt: '2026-08-13T00:00:00.000Z',
    }
    const slider = defaultChildForType('Slider')
    slider.props = { ...(slider.props ?? {}), value: 80 }
    const result = applySceneOp(scene, {
      op: 'insert_child',
      parentId: card.id,
      child: slider,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const found = findSceneNode(result.scene, slider.id)
    expect(found?.type).toBe('Slider')
    expect(found?.props?.value).toBe(80)
    expect(found?.props?.slot).toBeUndefined()
  })

  it('keeps a Slider dropped into Field as a selectable child', () => {
    const field = defaultChildForType('Field')
    const scene = {
      id: 's1',
      name: 'Atomic',
      version: 1 as const,
      root: { id: 'root', type: 'Stack', children: [field] },
      updatedAt: '2026-08-13T00:00:00.000Z',
    }
    const slider = defaultChildForType('Slider')
    slider.props = { ...(slider.props ?? {}), value: 22 }
    const result = applySceneOp(scene, {
      op: 'insert_child',
      parentId: field.id,
      child: slider,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const found = findSceneNode(result.scene, slider.id)
    expect(found?.type).toBe('Slider')
    expect(found?.props?.value).toBe(22)
    expect(found?.props?.slot).toBeUndefined()
  })
})

describe('wrap / unwrap (P28)', () => {
  it('wraps sibling nodes in a Stack preserving sibling order', () => {
    const scene = createLegacyFixtureScene()
    const result = applySceneOp(scene, {
      op: 'wrap_nodes',
      nodeIds: ['hero-img', 'title'],
      containerType: 'Stack',
      containerId: 'wrap-1',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const ids = result.scene.root.children?.map((c) => c.id) ?? []
    expect(ids[0]).toBe('wrap-1')
    expect(ids).not.toContain('title')
    expect(ids).not.toContain('hero-img')
    const wrap = result.scene.root.children?.find((c) => c.id === 'wrap-1')
    expect(wrap?.type).toBe('Stack')
    expect(wrap?.children?.map((c) => c.id)).toEqual(['title', 'hero-img'])
  })

  it('rejects wrap of mixed parents, root, locked, and bad type', () => {
    const scene = createLegacyFixtureScene()
    expect(
      applySceneOp(scene, {
        op: 'wrap_nodes',
        nodeIds: ['title', 'email'],
        containerType: 'Stack',
        containerId: 'wrap-mixed',
      }).ok,
    ).toBe(false)
    expect(
      applySceneOp(scene, {
        op: 'wrap_nodes',
        nodeIds: ['root'],
        containerType: 'Stack',
        containerId: 'wrap-root',
      }).ok,
    ).toBe(false)
    expect(
      applySceneOp(scene, {
        op: 'wrap_nodes',
        nodeIds: ['title'],
        containerType: 'Card' as 'Stack',
        containerId: 'wrap-card',
      }).ok,
    ).toBe(false)
    const locked = applySceneOp(scene, { op: 'set_flags', nodeId: 'title', locked: true })
    expect(locked.ok).toBe(true)
    if (!locked.ok) return
    expect(
      applySceneOp(locked.scene, {
        op: 'wrap_nodes',
        nodeIds: ['title', 'card-1'],
        containerType: 'Stack',
        containerId: 'wrap-locked',
      }).ok,
    ).toBe(false)
  })

  it('unwraps a Stack and rejects unwrap of Text', () => {
    const wrapped = applySceneOp(createLegacyFixtureScene(), {
      op: 'wrap_nodes',
      nodeIds: ['title', 'card-1'],
      containerType: 'Stack',
      containerId: 'wrap-2',
    })
    expect(wrapped.ok).toBe(true)
    if (!wrapped.ok) return
    const unwrapped = applySceneOp(wrapped.scene, { op: 'unwrap_node', nodeId: 'wrap-2' })
    expect(unwrapped.ok).toBe(true)
    if (!unwrapped.ok) return
    const ids = unwrapped.scene.root.children?.map((c) => c.id) ?? []
    expect(ids.slice(0, 2)).toEqual(['title', 'card-1'])
    expect(ids).not.toContain('wrap-2')
    expect(applySceneOp(createLegacyFixtureScene(), { op: 'unwrap_node', nodeId: 'title' }).ok).toBe(false)
  })

  it('canWrapSelection / canUnwrapSelection match op gates', () => {
    const scene = createLegacyFixtureScene()
    expect(canWrapSelection(scene, ['title', 'card-1'])).toBe(true)
    expect(canWrapSelection(scene, ['title', 'email'])).toBe(false)
    expect(canWrapSelection(scene, ['root'])).toBe(false)
    expect(canUnwrapSelection(scene, ['field-row'])).toBe(true)
    expect(canUnwrapSelection(scene, ['title'])).toBe(false)
  })
})

describe('clipboard + paste plan (P29)', () => {
  it('copies non-root nodes and pastes after the primary sibling with fresh ids', () => {
    const scene = createLegacyFixtureScene()
    const clip = clipboardNodesFromSelection(scene, ['title'])
    expect(clip).toHaveLength(1)
    expect(clip[0]?.id).toBe('title')
    const planned = planPasteInsert(scene, 'title')
    expect(planned.ok).toBe(true)
    if (!planned.ok) return
    expect(planned.parentId).toBe('root')
    expect(planned.index).toBe(1)
    const clone = cloneSceneNodeWithNewIds(clip[0]!)
    const pasted = applySceneOp(scene, {
      op: 'insert_child',
      parentId: planned.parentId,
      child: clone,
      index: planned.index,
    })
    expect(pasted.ok).toBe(true)
    if (!pasted.ok) return
    const ids = pasted.scene.root.children?.map((c) => c.id) ?? []
    expect(ids[1]).toBe(clone.id)
    expect(clone.id).not.toBe('title')
  })

  it('pastes into a selected container as last child', () => {
    const scene = createLegacyFixtureScene()
    const planned = planPasteInsert(scene, 'card-1')
    expect(planned.ok).toBe(true)
    if (!planned.ok) return
    expect(planned.parentId).toBe('card-1')
    expect(planned.index).toBe(scene.root.children?.find((c) => c.id === 'card-1')?.children?.length)
  })

  it('rejects paste into a locked parent and empty clipboard', () => {
    const scene = createLegacyFixtureScene()
    const locked = applySceneOp(scene, { op: 'set_flags', nodeId: 'card-1', locked: true })
    expect(locked.ok).toBe(true)
    if (!locked.ok) return
    expect(planPasteInsert(locked.scene, 'card-1').ok).toBe(false)
    expect(clipboardNodesFromSelection(scene, ['root'])).toEqual([])
    expect(isValidClipboardNodes([])).toBe(false)
    expect(isValidClipboardNodes([{ id: 'x' } as never])).toBe(false)
    const raw = serializeEditorClipboard(clipboardNodesFromSelection(scene, ['title']))
    expect(parseEditorClipboard(raw)?.[0]?.type).toBe('Text')
    expect(parseEditorClipboard('{"kind":"nope"}')).toBeNull()
  })
})

describe('palette drop insert plan (P31)', () => {
  it('inserts into a container and between siblings', () => {
    const scene = createLegacyFixtureScene()
    const into = planPaletteDrop(scene, 'card-1', 'into')
    expect(into.ok).toBe(true)
    if (!into.ok) return
    expect(into.parentId).toBe('card-1')
    expect(into.index).toBe(2)
    const after = planPaletteDrop(scene, 'title', 'after')
    expect(after.ok).toBe(true)
    if (!after.ok) return
    expect(after.parentId).toBe('root')
    expect(after.index).toBe(1)
    const before = planPaletteDrop(scene, 'title', 'before')
    expect(before.ok).toBe(true)
    if (!before.ok) return
    expect(before.index).toBe(0)
  })

  it('rejects into on a non-container and locked parent', () => {
    const scene = createLegacyFixtureScene()
    expect(planPaletteDrop(scene, 'title', 'into').ok).toBe(false)
    const locked = applySceneOp(scene, { op: 'set_flags', nodeId: 'root', locked: true })
    expect(locked.ok).toBe(true)
    if (!locked.ok) return
    expect(planPaletteDrop(locked.scene, 'title', 'after').ok).toBe(false)
  })

  it('maps pointer position to drop edge', () => {
    expect(dropEdgeFromPoint(true, 10, 0, 100)).toBe('before')
    expect(dropEdgeFromPoint(true, 50, 0, 100)).toBe('into')
    expect(dropEdgeFromPoint(true, 90, 0, 100)).toBe('after')
    expect(dropEdgeFromPoint(false, 20, 0, 100)).toBe('before')
    expect(dropEdgeFromPoint(false, 80, 0, 100)).toBe('after')
    expect(dropEdgeFromPoint(true, 50, 0, 100, 10, 0, 100, 'row')).toBe('before')
    expect(dropEdgeFromPoint(true, 50, 0, 100, 50, 0, 100, 'row')).toBe('into')
    expect(dropEdgeFromPoint(true, 50, 0, 100, 90, 0, 100, 'row')).toBe('after')
    expect(dropEdgeFromPoint(false, 20, 0, 100, 80, 0, 100, 'column')).toBe('before')
  })
})

describe('scene store', () => {
  it('upserts and binds platformProjectId', async () => {
    delete process.env[paths.envDatabaseUrl]
    __resetSceneStoreForTests({ durable: false })
    const scene = createLegacyFixtureScene()
    const saved = await upsertScene(scene)
    expect((await getScene(saved.id))?.id).toBe(saved.id)
    const bound = await bindScenePlatformProject(saved.id, 'plx-demo-1')
    expect(bound?.platformProjectId).toBe('plx-demo-1')
  })

  it('defaultChildForType supports extended palette types', () => {
    expect(defaultChildForType('Heading').type).toBe('Heading')
    expect(defaultChildForType('Heading').tokenBindings?.fontFamily).toBe('typography.heading.h1')
    expect(defaultChildForType('Text').tokenBindings?.fontSize).toBe('typography.body.family')
    expect(defaultChildForType('Grid').type).toBe('Grid')
    expect(defaultChildForType('Link').type).toBe('Link')
    expect(defaultChildForType('Badge').type).toBe('Badge')
    expect(defaultChildForType('Spacer').type).toBe('Spacer')
    expect(defaultChildForType('Checkbox').props?.label).toBe('Checkbox')
    expect(defaultChildForType('Switch').props?.checked).toBe(false)
    expect(defaultChildForType('Select').type).toBe('Select')
    expect(defaultChildForType('Textarea').props?.placeholder).toBe('Textarea')
    expect(defaultChildForType('Chip').props?.children).toBeUndefined()
    expect(defaultChildForType('Chip').name).toBe('Chip')
    expect(
      defaultChildForType('Chip').children?.some((c) => c.props?.slot === 'label' && c.props?.children === 'Chip'),
    ).toBe(true)
    expect(isSceneContainerType('Chip')).toBe(false)
    expect(defaultChildForType('Alert').props?.children).toBeUndefined()
    expect(defaultChildForType('Alert').children?.some((c) => c.props?.slot === 'value' && c.props?.children === 'Alert')).toBe(
      true,
    )
    expect(defaultChildForType('PageTitle').children?.some((c) => c.props?.slot === 'title')).toBe(true)
    expect(isSceneContainerType('Alert')).toBe(false)
    expect(isSceneContainerType('PageTitle')).toBe(false)
    expect(defaultChildForType('Avatar').props?.displayName).toBe('Ada Lovelace')
    expect(defaultChildForType('Field').children?.some((c) => c.type === 'Input')).toBe(true)
    expect(defaultChildForType('Field').children?.some((c) => c.props?.slot === 'label')).toBe(true)
    expect(defaultChildForType('Field').props?.label).toBeUndefined()
    expect(defaultChildForType('Panel').props?.variant).toBe('editorial')
    expect(defaultChildForType('Tabs').props?.value).toBe('a')
    expect(defaultChildForType('Slider').props?.value).toBe(50)
    expect(isSceneContainerType('Field')).toBe(true)
    expect(isSceneContainerType('Panel')).toBe(true)
    expect(isSceneContainerType('Chip')).toBe(false)
    expect(defaultChildForType('Lede').props?.label).toBeUndefined()
    expect(defaultChildForType('Lede').children?.some((c) => c.props?.slot === 'label' && c.props?.children === 'Lede')).toBe(
      true,
    )
    expect(defaultChildForType('FormSection').children?.some((c) => c.type === 'Field')).toBe(true)
    expect(defaultChildForType('FormSection').children?.some((c) => c.props?.slot === 'title')).toBe(true)
    expect(defaultChildForType('TagInput').props?.tags).toEqual(['alpha', 'beta'])
    expect(isSceneContainerType('ScrollArea')).toBe(true)
    expect(isSceneContainerType('FilterRow')).toBe(true)
    expect(defaultChildForType('SectionChrome').props?.title).toBeUndefined()
    expect(defaultChildForType('SectionChrome').children?.some((c) => c.props?.slot === 'title')).toBe(true)
    expect(defaultChildForType('RankedList').children?.[0]?.type).toBe('RankedRow')
    expect(defaultChildForType('KpiStrip').props?.items).toBeUndefined()
    expect(defaultChildForType('KpiStrip').children?.[0]?.type).toBe('Lede')
    expect(isSceneContainerType('RankedList')).toBe(true)
    expect(isSceneContainerType('ChannelLane')).toBe(true)
    expect(isSceneContainerType('KpiStrip')).toBe(true)
    const ranked = defaultChildForType('PrintRankedList')
    expect(ranked.props?.items).toBeUndefined()
    expect(ranked.props?.columns).toBe(1)
    expect(ranked.children).toHaveLength(2)
    expect(ranked.children?.[0]?.type).toBe('RankedRow')
    const ledger = defaultChildForType('PrintLedger')
    expect(ledger.props?.items).toBeUndefined()
    expect(ledger.props?.max).toBe(100)
    expect(ledger.children).toHaveLength(2)
    const traits = defaultChildForType('PrintTraitBars')
    expect(traits.props?.traits).toBeUndefined()
    expect(traits.children).toHaveLength(2)
    const diverging = defaultChildForType('DivergingBar')
    expect(diverging.props?.items).toBeUndefined()
    expect(diverging.children).toHaveLength(2)
    expect(isSceneContainerType('PrintRankedList')).toBe(true)
    expect(isSceneContainerType('PrintLedger')).toBe(true)
    expect(isSceneContainerType('PrintTraitBars')).toBe(true)
    expect(isSceneContainerType('DivergingBar')).toBe(true)
    const entity = defaultChildForType('EntityCard')
    expect(entity.props?.title).toBeUndefined()
    expect(entity.children?.some((c) => c.props?.slot === 'title' && c.props?.children === 'Entity')).toBe(
      true,
    )
    expect(entity.children?.some((c) => c.type === 'Slider')).toBe(true)
    expect(isSceneContainerType('EntityCard')).toBe(true)
    const quote = defaultChildForType('PrintPullQuote')
    expect(quote.props?.body).toBeUndefined()
    expect(quote.props?.label).toBeUndefined()
    expect(quote.children?.some((c) => c.props?.slot === 'value' && c.props?.children === 'Print pull quote.')).toBe(
      true,
    )
    expect(
      defaultChildForType('PrintChapter').children?.some((c) => c.type === 'PrintPullQuote'),
    ).toBe(true)
    expect(defaultChildForType('PrintPage').props?.folioTitle).toBeUndefined()
    expect(defaultChildForType('PrintPage').children?.some((c) => c.props?.slot === 'label')).toBe(true)
    expect(defaultChildForType('PrintPage').children?.some((c) => c.type === 'PrintChapter')).toBe(true)
    expect(defaultChildForType('PrintDonut').props?.centerValue).toBeUndefined()
    expect(defaultChildForType('PrintDonut').props?.slices).toBeUndefined()
    expect(defaultChildForType('PrintDonut').children?.filter((c) => c.type === 'RankedRow')).toHaveLength(2)
    expect(defaultChildForType('PrintDonut').children?.some((c) => c.id.endsWith('__slice_a'))).toBe(true)
    expect(defaultChildForType('PrintDonut').children?.some((c) => c.props?.slot === 'value' && c.props?.children === '72')).toBe(
      true,
    )
    const scoreRing = defaultChildForType('PrintScoreRing')
    expect(scoreRing.props?.value).toBeUndefined()
    expect(scoreRing.props?.max).toBe(100)
    expect(scoreRing.children?.some((c) => c.props?.slot === 'value' && c.props?.children === '72')).toBe(true)
    expect(scoreRing.children?.some((c) => c.props?.slot === 'label' && c.props?.children === 'Score')).toBe(true)
    expect(isSceneContainerType('PrintPage')).toBe(true)
    expect(isSceneContainerType('PrintTwoColumn')).toBe(true)
    expect(isSceneContainerType('PrintCover')).toBe(false)
    const persona = defaultChildForType('PrintPersonaCard')
    expect(persona.props?.name).toBeUndefined()
    expect(persona.props?.traits).toBeUndefined()
    expect(persona.props?.goals).toBeUndefined()
    expect(persona.props?.painPoints).toBeUndefined()
    expect(persona.children?.some((c) => c.props?.slot === 'title' && c.props?.children === 'Alex Rivera')).toBe(
      true,
    )
    expect(persona.children?.some((c) => c.type === 'PrintChipRow')).toBe(true)
    expect(
      persona.children?.some(
        (c) => c.type === 'PrintChipRow' && c.children?.some((k) => k.type === 'PrintChip'),
      ),
    ).toBe(true)
    expect(persona.children?.some((c) => c.type === 'PrintTraitBars')).toBe(true)
    expect(
      persona.children?.some((c) => c.type === 'PrintTwoColumn' || c.type === 'PrintRankedList'),
    ).toBe(true)
    expect(persona.children?.some((c) => c.type === 'PrintChip')).toBe(false)
    const grid = defaultChildForType('PrintPersonaGrid')
    expect(grid.props?.personas).toBeUndefined()
    expect(grid.children?.filter((c) => c.type === 'PrintPersonaCard')).toHaveLength(2)
    expect(
      grid.children?.some(
        (c) =>
          c.type === 'PrintPersonaCard' &&
          c.children?.some((k) => k.props?.slot === 'title' && k.props?.children === 'Alex Rivera'),
      ),
    ).toBe(true)
    expect(isSceneContainerType('PrintPersonaCard')).toBe(true)
    expect(isSceneContainerType('PrintPersonaGrid')).toBe(true)
    const cover = defaultChildForType('PrintCover')
    expect(cover.props?.kpis).toBeUndefined()
    expect(cover.props?.url).toBe('beispiel.de')
    expect(cover.children?.filter((c) => c.type === 'Lede')).toHaveLength(2)
    expect(
      cover.children?.some(
        (c) =>
          c.type === 'Lede' && c.children?.some((k) => k.props?.slot === 'label' && k.props?.children === 'GEO'),
      ),
    ).toBe(true)
    const table = defaultChildForType('PrintTable')
    expect(table.props?.rows).toBeUndefined()
    expect(table.props?.columns).toBeUndefined()
    expect(table.children?.filter((c) => c.props?.slot === 'label' && c.type === 'Text')).toHaveLength(2)
    expect(table.children?.filter((c) => c.type === 'RankedRow')).toHaveLength(2)
    expect(table.children).toHaveLength(4)
    expect(
      table.children?.some((c) => c.children?.some((k) => k.props?.slot === 'label' && k.props?.children === 'GEO')),
    ).toBe(true)
    expect(isSceneContainerType('PrintTable')).toBe(true)
    expect(isSceneContainerType('PrintCover')).toBe(false)
  })

  it('palette print inserts wrap in PrintPage unless already on a page', () => {
    const scene = createLegacyFixtureScene()
    const wrapped = paletteChildForInsert(scene.root, scene.root.id, 'PrintPersonaCard')
    expect(wrapped.child.type).toBe('PrintPage')
    expect(wrapped.child.children?.some((c) => c.type === 'PrintPersonaCard')).toBe(true)
    expect(wrapped.child.children?.some((c) => c.props?.slot === 'label')).toBe(true)
    expect(wrapped.child.children?.some((c) => c.props?.slot === 'footer')).toBe(true)
    expect(wrapped.selectId).toBe(
      wrapped.child.children?.find((c) => c.type === 'PrintPersonaCard')?.id,
    )

    const page = defaultChildForType('PrintPage')
    const onPage = paletteChildForInsert(page, page.id, 'PrintPersonaCard')
    expect(onPage.child.type).toBe('PrintPersonaCard')
    expect(onPage.selectId).toBe(onPage.child.id)

    const button = paletteChildForInsert(scene.root, scene.root.id, 'Button')
    expect(button.child.type).toBe('Button')
    expect(button.selectId).toBe(button.child.id)

    const pageInsert = paletteChildForInsert(scene.root, scene.root.id, 'PrintPage')
    expect(pageInsert.child.type).toBe('PrintPage')
    expect(pageInsert.selectId).toBe(pageInsert.child.id)
  })
})
