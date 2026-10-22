import { describe, expect, it } from 'vitest'
import { applySceneOpBatch } from '../lib/scene/apply-scene-op-batch'
import { normalizeSceneOp } from '../lib/scene/normalize-scene-op'
import { createLegacyFixtureScene } from '../lib/scene/demo-scene'
import { defaultChildForType } from '../lib/scene/scene-insert-defaults'
import { applySceneOp, findSceneNode } from '../lib/scene/ops'

describe('normalizeSceneOp set_prop aliases', () => {
  it('maps prop → key', () => {
    const op = normalizeSceneOp({
      op: 'set_prop',
      nodeId: 'n1',
      prop: 'tone',
      value: 'accent',
    } as never)
    expect(op).toMatchObject({ op: 'set_prop', nodeId: 'n1', key: 'tone', value: 'accent' })
  })

  it('maps property → key', () => {
    const op = normalizeSceneOp({
      op: 'set_prop',
      nodeId: 'n1',
      property: 'variant',
      value: 'wash',
    } as never)
    expect((op as { key?: string }).key).toBe('variant')
  })
})

describe('set_prop without key does not 500', () => {
  it('returns op-rejected when key missing', () => {
    const scene = createLegacyFixtureScene()
    const chip = defaultChildForType('PrintChip')
    const inserted = applySceneOp(scene, {
      op: 'insert_child',
      parentId: scene.root.id,
      child: chip,
    })
    expect(inserted.ok).toBe(true)
    if (!inserted.ok) return

    const batch = applySceneOpBatch(inserted.scene, [
      { op: 'set_prop', nodeId: chip.id, value: 'accent' } as never,
    ])
    expect(batch.ok).toBe(false)
    if (batch.ok) return
    expect(batch.error).toBe('op-rejected')
    expect(batch.reason).toMatch(/Prop key required/i)
  })

  it('applies set_prop when agent sends prop instead of key', () => {
    const scene = createLegacyFixtureScene()
    const chip = defaultChildForType('PrintChip')
    const inserted = applySceneOp(scene, {
      op: 'insert_child',
      parentId: scene.root.id,
      child: chip,
    })
    expect(inserted.ok).toBe(true)
    if (!inserted.ok) return

    const batch = applySceneOpBatch(inserted.scene, [
      { op: 'set_prop', nodeId: chip.id, prop: 'tone', value: 'accent' } as never,
    ])
    expect(batch.ok).toBe(true)
    if (!batch.ok) return
    expect(findSceneNode(batch.scene, chip.id)?.props?.tone).toBe('accent')
  })
})
