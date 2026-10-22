import { describe, expect, it } from 'vitest'
import type { SceneMaster, SceneNode } from '@zaoly/contracts'
import { INSTANCE_TYPE, expandSceneTree } from '../lib/scene/expand-instances'
import { heroPatternBlock } from '../lib/scene/demo-scene'
import {
  prepareSiteKitCompositionSavePayload,
  resolveSiteKitCompositionSaveRoot,
} from '../lib/site-kit/save-composition-root'
import { shouldShowSiteKitSaveComposition } from '../lib/site-kit/save-composition-visibility'
import { validateSiteKitExportSceneRoot } from '../lib/site-kit/master-kit-export'

describe('save composition hardening', () => {
  const customMaster: SceneMaster = {
    id: 'master-custom-hero',
    name: 'Hero block',
    root: heroPatternBlock(),
  }

  it('hides Save when a child is selected in master edit', () => {
    const child = customMaster.root.children?.[0]
    expect(child).toBeTruthy()
    expect(
      shouldShowSiteKitSaveComposition({
        selected: child!,
        persisted: child!,
        multi: false,
        sceneMasters: [customMaster],
        masterEditId: customMaster.id,
      }),
    ).toBe(false)
  })

  it('rejects master-edit child as save root', () => {
    const child = customMaster.root.children![0]!
    const result = resolveSiteKitCompositionSaveRoot({
      selected: child,
      persisted: child,
      masterEditId: customMaster.id,
      masters: [customMaster],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('invalid-selection')
  })

  it('resolves instance root from persisted Instance', () => {
    const persisted: SceneNode = {
      id: 'inst-custom-hero',
      type: INSTANCE_TYPE,
      instanceOf: customMaster.id,
    }
    const result = resolveSiteKitCompositionSaveRoot({
      selected: customMaster.root,
      persisted,
      masters: [customMaster],
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.root.type).not.toBe(INSTANCE_TYPE)
  })

  it('reports missing master after expand', () => {
    const node: SceneNode = {
      id: 'inst-x',
      type: INSTANCE_TYPE,
      instanceOf: 'missing-master',
    }
    const check = validateSiteKitExportSceneRoot(node, [])
    expect(check.ok).toBe(false)
    if (!check.ok) expect(check.code).toBe('missing-master')
  })

  it('reports circular master references', () => {
    const masterA: SceneMaster = {
      id: 'master-a',
      name: 'A',
      root: {
        id: 'a-root',
        type: 'SiteStack',
        children: [{ id: 'a-inst', type: INSTANCE_TYPE, instanceOf: 'master-b' }],
      },
    }
    const masterB: SceneMaster = {
      id: 'master-b',
      name: 'B',
      root: {
        id: 'b-root',
        type: 'SiteStack',
        children: [{ id: 'b-inst', type: INSTANCE_TYPE, instanceOf: 'master-a' }],
      },
    }
    const expanded = expandSceneTree(
      { id: 'page-inst', type: INSTANCE_TYPE, instanceOf: 'master-a' },
      [masterA, masterB],
    )
    const check = validateSiteKitExportSceneRoot(expanded, [masterA, masterB])
    expect(check.ok).toBe(false)
    if (!check.ok) expect(check.code).toBe('circular-master')
  })

  it('pre-validates reserved names before save payload', () => {
    const result = prepareSiteKitCompositionSavePayload({
      name: 'button',
      selected: customMaster.root,
      persisted: customMaster.root,
      masterEditId: customMaster.id,
      masters: [customMaster],
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('reserved-name')
  })
})
