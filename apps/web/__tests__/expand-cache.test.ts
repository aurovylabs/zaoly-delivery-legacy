import { describe, expect, it, beforeEach } from 'vitest'
import type { SceneMaster, SceneNode } from '@zaoly/contracts'
import {
  cachedExpandMasterVariantBoardForPaint,
  cachedExpandSceneTree,
  clearSceneExpandCache,
  expandCacheSize,
} from '../lib/scene/expand-cache'
import { expandSceneTree } from '../lib/scene/expand-instances'
import { buildMasterVariantBoard } from '../lib/scene/master-variants'
import { sceneDocumentFingerprint } from '../lib/scene/scene-document-fingerprint'

function simpleRoot(): SceneNode {
  return {
    id: 'root',
    type: 'SiteStack',
    children: [{ id: 'a', type: 'SiteText', props: { children: 'Hi' }, children: [] }],
  }
}

describe('expand-cache', () => {
  beforeEach(() => {
    clearSceneExpandCache()
  })

  it('returns equivalent tree on cache miss and hit', () => {
    const root = simpleRoot()
    const fp = 'fixture-fp'
    const first = cachedExpandSceneTree(root, undefined, fp)
    expect(expandCacheSize()).toBe(1)
    const second = cachedExpandSceneTree(root, undefined, fp)
    expect(first).toEqual(second)
    expect(first).not.toBe(second)
  })

  it('invalidates when document fingerprint changes', () => {
    const root = simpleRoot()
    cachedExpandSceneTree(root, undefined, 'fp-a')
    cachedExpandSceneTree(root, undefined, 'fp-b')
    expect(expandCacheSize()).toBe(2)
  })

  it('matches uncached expandSceneTree output', () => {
    const root = simpleRoot()
    const fp = sceneDocumentFingerprint({
      id: 's',
      name: 'S',
      version: 1,
      updatedAt: '2026-09-01T00:00:00.000Z',
      root,
    })
    const cached = cachedExpandSceneTree(root, undefined, fp)
    const direct = expandSceneTree(root, undefined)
    expect(cached).toEqual(direct)
  })

  it('does not reuse Master board paint when only the active variant changes', () => {
    const rootA: SceneNode = { id: 'a', type: 'SiteText', props: { children: 'A' } }
    const rootB: SceneNode = { id: 'b', type: 'SiteText', props: { children: 'B' } }
    const master: SceneMaster = {
      id: 'm1',
      name: 'M',
      root: rootA,
      defaultVariantId: 'v1',
      variants: [
        { id: 'v1', name: 'Default', root: rootA },
        { id: 'v2', name: 'Alt', root: rootB },
      ],
    }
    const fp = 'same-doc-fp'
    const boardV1 = buildMasterVariantBoard(master, 'v1')
    const boardV2 = buildMasterVariantBoard(master, 'v2')
    const paintedV1 = cachedExpandMasterVariantBoardForPaint(boardV1, [master], fp, 'v1')
    const paintedV2 = cachedExpandMasterVariantBoardForPaint(boardV2, [master], fp, 'v2')
    expect(expandCacheSize()).toBe(2)
    const activeV1 = paintedV1.children?.find(
      (c) => c.props?.['data-master-variant-active'] === 'true',
    )
    const activeV2 = paintedV2.children?.find(
      (c) => c.props?.['data-master-variant-active'] === 'true',
    )
    expect(activeV1?.props?.['data-master-variant']).toBe('v1')
    expect(activeV2?.props?.['data-master-variant']).toBe('v2')
    // Same fingerprint + board id without paintKey would wrongly return v1 chrome.
    const staleIfBroken = cachedExpandMasterVariantBoardForPaint(boardV2, [master], fp, 'v1')
    expect(staleIfBroken.children?.find((c) => c.props?.['data-master-variant-active'] === 'true')
      ?.props?.['data-master-variant']).toBe('v1')
  })
})
