import { describe, expect, it } from 'vitest'
import type { CompositionScene, SceneMaster, SceneNode } from '@zaoly/contracts'
import { applySceneOp, defaultChildForType } from '../lib/scene/ops'
import {
  buildMasterVariantBoard,
  migrateMasterAxesFromPhase2,
  PHASE2_MIGRATE_AXIS_ID,
  productOfAxisValueCounts,
  resolveMasterVariantForInstance,
} from '../lib/scene/master-variants'
import { normalizeScene } from '../lib/scene/scene-normalize'

function leaf(name: string): SceneNode {
  return { ...defaultChildForType('SiteText'), id: `n-${name}`, props: { text: name } }
}

function masterWithNamedVariants(): SceneMaster {
  const a = leaf('A')
  const b = leaf('B')
  return {
    id: 'm1',
    name: 'Button',
    root: a,
    defaultVariantId: 'v-a',
    variants: [
      { id: 'v-a', name: 'Primary', root: a },
      { id: 'v-b', name: 'Secondary', root: b },
    ],
  }
}

describe('composition masters Phase 3 axes', () => {
  it('migrates Phase-2 named list to Variant axis + combinations (idempotent)', () => {
    const once = migrateMasterAxesFromPhase2(masterWithNamedVariants())
    expect(once.axes).toEqual([
      {
        id: PHASE2_MIGRATE_AXIS_ID,
        name: 'Variant',
        values: ['Primary', 'Secondary'],
      },
    ])
    expect(once.variants?.[0]?.combination).toEqual({ [PHASE2_MIGRATE_AXIS_ID]: 'Primary' })
    const twice = migrateMasterAxesFromPhase2(once)
    expect(twice.axes).toEqual(once.axes)
  })

  it('normalizeScene materializes axes on masters', () => {
    const root = defaultChildForType('SiteStack')
    const scene = normalizeScene({
      id: 's1',
      name: 'S',
      version: 1,
      root,
      masters: [masterWithNamedVariants()],
      updatedAt: new Date().toISOString(),
    })!
    expect(scene.masters?.[0]?.axes?.[0]?.id).toBe(PHASE2_MIGRATE_AXIS_ID)
  })

  it('resolves instance via instanceVariantAxes combination', () => {
    const master = migrateMasterAxesFromPhase2(masterWithNamedVariants())
    const hit = resolveMasterVariantForInstance(master, {
      instanceVariantAxes: { [PHASE2_MIGRATE_AXIS_ID]: 'Secondary' },
    })
    expect(hit.id).toBe('v-b')
  })

  it('add_master_axis + upsert cell + set_instance_variant_axes round-trip', () => {
    const root = defaultChildForType('SiteStack')
    const master = migrateMasterAxesFromPhase2(masterWithNamedVariants())
    const instance: SceneNode = {
      id: 'inst-1',
      type: 'Instance',
      instanceOf: master.id,
      children: [],
    }
    root.children = [instance]
    let scene: CompositionScene = {
      id: 's1',
      name: 'S',
      version: 1,
      root,
      masters: [master],
      updatedAt: new Date().toISOString(),
    }

    let res = applySceneOp(scene, {
      op: 'add_master_axis',
      masterId: master.id,
      name: 'Size',
      values: ['sm', 'lg'],
    })
    expect(res.ok).toBe(true)
    if (!res.ok) throw new Error(res.reason)
    scene = res.scene

    const sizeAxis = scene.masters?.find((m) => m.id === master.id)?.axes?.find((a) => a.name === 'Size')
    expect(sizeAxis?.values).toEqual(['sm', 'lg'])

    res = applySceneOp(scene, {
      op: 'upsert_master_variant_cell',
      masterId: master.id,
      combination: {
        [PHASE2_MIGRATE_AXIS_ID]: 'Primary',
        [sizeAxis!.id]: 'lg',
      },
    })
    expect(res.ok).toBe(true)
    if (!res.ok) throw new Error(res.reason)
    scene = res.scene

    res = applySceneOp(scene, {
      op: 'set_instance_variant_axes',
      nodeId: 'inst-1',
      axes: {
        [PHASE2_MIGRATE_AXIS_ID]: 'Primary',
        [sizeAxis!.id]: 'lg',
      },
    })
    expect(res.ok).toBe(true)
    if (!res.ok) throw new Error(res.reason)
    const inst = res.scene.root.children?.[0]
    expect(inst?.instanceVariantAxes?.[sizeAxis!.id]).toBe('lg')
  })

  it('warns when product of axis values ≥ 30', () => {
    const master: SceneMaster = {
      id: 'm',
      name: 'M',
      root: leaf('r'),
      axes: [
        { id: 'a', name: 'A', values: Array.from({ length: 6 }, (_, i) => `a${i}`) },
        { id: 'b', name: 'B', values: Array.from({ length: 6 }, (_, i) => `b${i}`) },
      ],
    }
    expect(productOfAxisValueCounts(master)).toBe(36)
  })

  it('buildMasterVariantBoard paints matrix when two axes exist', () => {
    const a = leaf('A')
    const master: SceneMaster = {
      id: 'm',
      name: 'M',
      root: a,
      defaultVariantId: 'v1',
      axes: [
        { id: 'size', name: 'Size', values: ['sm', 'lg'] },
        { id: 'tone', name: 'Tone', values: ['pri', 'sec'] },
      ],
      variants: [
        {
          id: 'v1',
          name: 'sm / pri',
          root: a,
          combination: { size: 'sm', tone: 'pri' },
        },
      ],
    }
    const board = buildMasterVariantBoard(master, 'v1')
    expect(board.props?.['data-master-matrix']).toBe('true')
    expect((board.children ?? []).length).toBeGreaterThanOrEqual(2)
  })
})
