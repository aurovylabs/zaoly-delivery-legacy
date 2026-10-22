import { describe, expect, it } from 'vitest'
import { applySceneOp } from '../lib/scene/ops'
import { heroPatternBlock } from '../lib/scene/demo-scene'
import { shouldShowSiteKitSaveComposition } from '../lib/site-kit/save-composition-visibility'

describe('bind_master_composition', () => {
  const base = {
    root: heroPatternBlock(),
    masters: [
      {
        id: 'master-custom',
        name: 'Hero',
        root: heroPatternBlock(),
      },
    ],
  }

  it('sets sourceKey Composition:{exportName}', () => {
    const bound = applySceneOp(base, {
      op: 'bind_master_composition',
      masterId: 'master-custom',
      exportName: 'Col3',
    })
    expect(bound.ok).toBe(true)
    if (!bound.ok) throw new Error(bound.reason)
    expect(bound.scene.masters![0]!.sourceKey).toBe('Composition:Col3')
  })

  it('hides Save panel after bind', () => {
    const bound = applySceneOp(base, {
      op: 'bind_master_composition',
      masterId: 'master-custom',
      exportName: 'Col3',
    })
    expect(bound.ok).toBe(true)
    if (!bound.ok) throw new Error(bound.reason)
    const master = bound.scene.masters![0]!
    expect(
      shouldShowSiteKitSaveComposition({
        selected: master.root,
        persisted: master.root,
        multi: false,
        sceneMasters: bound.scene.masters,
        masterEditId: master.id,
      }),
    ).toBe(false)
  })

  it('rejects duplicate export name on another master', () => {
    const scene = {
      ...base,
      masters: [
        ...base.masters!,
        { id: 'master-other', name: 'Other', root: heroPatternBlock() },
      ],
    }
    const first = applySceneOp(scene, {
      op: 'bind_master_composition',
      masterId: 'master-custom',
      exportName: 'Col3',
    })
    expect(first.ok).toBe(true)
    if (!first.ok) throw new Error(first.reason)
    const clash = applySceneOp(first.scene, {
      op: 'bind_master_composition',
      masterId: 'master-other',
      exportName: 'Col3',
    })
    expect(clash.ok).toBe(false)
  })

  it('is idempotent when already bound', () => {
    const first = applySceneOp(base, {
      op: 'bind_master_composition',
      masterId: 'master-custom',
      exportName: 'Col3',
    })
    expect(first.ok).toBe(true)
    if (!first.ok) throw new Error(first.reason)
    const second = applySceneOp(first.scene, {
      op: 'bind_master_composition',
      masterId: 'master-custom',
      exportName: 'Col3',
    })
    expect(second.ok).toBe(true)
  })
})
