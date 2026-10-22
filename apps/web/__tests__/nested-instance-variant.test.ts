import { describe, expect, it } from 'vitest'
import type { CompositionScene, SceneMaster, SceneNode } from '@zaoly/contracts'
import { expandCompositionScene, stableExpandDescendantId } from '../lib/scene/expand-instances'
import { applySceneOp, findSceneNode } from '../lib/scene/ops'
import { findNode } from '../lib/scene/scene-tree'
import {
  listMasterVariants,
  migrateMasterAxesFromPhase2,
  PHASE2_MIGRATE_AXIS_ID,
} from '../lib/scene/master-variants'

function buttonMasters(): {
  buttonMaster: SceneMaster
  secondaryVariantId: string
  nestedInst: SceneNode
} {
  const buttonDefault: SceneNode = {
    id: 'btn-root',
    type: 'SiteButton',
    props: { children: 'Primary' },
    tokenBindings: { background: 'color.action.primary' },
  }
  const buttonSecondary: SceneNode = {
    id: 'btn-root',
    type: 'SiteButton',
    props: { children: 'Secondary' },
    tokenBindings: { background: 'color.action.secondary' },
  }
  const buttonMaster: SceneMaster = migrateMasterAxesFromPhase2({
    id: 'master-SiteButton',
    name: 'Button',
    sourceKey: 'SiteButton',
    root: buttonDefault,
    defaultVariantId: 'mvar-btn-default',
    variants: [
      { id: 'mvar-btn-default', name: 'Default', root: buttonDefault },
      { id: 'mvar-btn-secondary', name: 'Secondary', root: buttonSecondary },
    ],
  })
  const nestedInst: SceneNode = {
    id: 'inst-nested-btn',
    type: 'Instance',
    name: 'CTA',
    instanceOf: buttonMaster.id,
  }
  return {
    buttonMaster,
    secondaryVariantId: 'mvar-btn-secondary',
    nestedInst,
  }
}

function sceneWithNestedButtonInstance(opts?: {
  wrapInFrame?: boolean
}): {
  scene: CompositionScene
  hostId: string
  nestedId: string
  expandId: string
  secondaryVariantId: string
} {
  const { buttonMaster, secondaryVariantId, nestedInst } = buttonMasters()
  const hostRoot: SceneNode = opts?.wrapInFrame
    ? {
        id: 'hero-root',
        type: 'SiteStack',
        children: [
          {
            id: 'hero-frame',
            type: 'Frame',
            children: [nestedInst],
          },
        ],
      }
    : {
        id: 'hero-root',
        type: 'SiteStack',
        children: [nestedInst],
      }
  const hostMaster: SceneMaster = {
    id: 'master-Hero',
    name: 'Hero',
    sourceKey: 'Composition:Hero',
    root: hostRoot,
  }
  const hostId = 'pattern-hero-host'
  const scene: CompositionScene = {
    id: 'scene',
    name: 'Nested variant',
    updatedAt: '2026-10-09T00:00:00.000Z',
    root: {
      id: 'root',
      type: 'Frame',
      children: [
        {
          id: hostId,
          type: 'Instance',
          name: 'Hero',
          instanceOf: hostMaster.id,
        },
      ],
    },
    masters: [hostMaster, buttonMaster],
  }
  return {
    scene,
    hostId,
    nestedId: nestedInst.id,
    expandId: stableExpandDescendantId(hostId, nestedInst.id),
    secondaryVariantId,
  }
}

describe('nested Instance variant via expand id', () => {
  it('set_instance_variant on host::nested does not Unknown-node and paints Secondary', () => {
    const { scene, hostId, nestedId, expandId, secondaryVariantId } =
      sceneWithNestedButtonInstance()

    const switched = applySceneOp(scene, {
      op: 'set_instance_variant',
      nodeId: expandId,
      variantId: secondaryVariantId,
    })
    expect(switched.ok).toBe(true)
    if (!switched.ok) throw new Error(switched.reason)

    const host = findSceneNode(switched.scene, hostId)
    expect(host?.instanceOverrides?.descendants?.[nestedId]?.instanceVariantId).toBe(
      secondaryVariantId,
    )

    const expanded = expandCompositionScene(switched.scene)
    const nested = findNode(expanded, expandId)
    expect(nested?.props?.children).toBe('Secondary')
    expect(nested?.tokenBindings?.background).toBe('color.action.secondary')
  })

  it('set_instance_variant_axes paints Secondary when nested under Frame', () => {
    const { scene, hostId, nestedId, expandId } = sceneWithNestedButtonInstance({
      wrapInFrame: true,
    })

    const switched = applySceneOp(scene, {
      op: 'set_instance_variant_axes',
      nodeId: expandId,
      axes: { [PHASE2_MIGRATE_AXIS_ID]: 'Secondary' },
    })
    expect(switched.ok).toBe(true)
    if (!switched.ok) throw new Error(switched.reason)

    const host = findSceneNode(switched.scene, hostId)
    const bag = host?.instanceOverrides?.descendants?.[nestedId]
    expect(bag?.instanceVariantAxes?.[PHASE2_MIGRATE_AXIS_ID]).toBe('Secondary')
    expect(bag?.instanceVariantId).toBe('mvar-btn-secondary')

    const expanded = expandCompositionScene(switched.scene)
    const nested = findNode(expanded, expandId)
    expect(nested?.props?.children).toBe('Secondary')
    expect(nested?.instanceVariantAxes?.[PHASE2_MIGRATE_AXIS_ID]).toBe('Secondary')
    expect(nested?.tokenBindings?.background).toBe('color.action.secondary')
  })

  it('page-level Instance variant switch still works', () => {
    const { scene, hostId } = sceneWithNestedButtonInstance()
    // Host Master has only Default — add a named variant for the host itself.
    const hostMaster = scene.masters!.find((m) => m.id === 'master-Hero')!
    const altRoot: SceneNode = {
      id: 'hero-root',
      type: 'SiteStack',
      props: { gap: 'lg' },
      children: hostMaster.root.children,
    }
    hostMaster.variants = [
      { id: 'hero-default', name: 'Default', root: hostMaster.root },
      { id: 'hero-alt', name: 'Alt', root: altRoot },
    ]
    hostMaster.defaultVariantId = 'hero-default'
    hostMaster.root = hostMaster.root

    const switched = applySceneOp(scene, {
      op: 'set_instance_variant',
      nodeId: hostId,
      variantId: 'hero-alt',
    })
    expect(switched.ok).toBe(true)
    if (!switched.ok) throw new Error(switched.reason)
    expect(findSceneNode(switched.scene, hostId)?.instanceVariantId).toBe('hero-alt')
    expect(listMasterVariants(hostMaster).map((v) => v.name)).toContain('Alt')
  })
})
