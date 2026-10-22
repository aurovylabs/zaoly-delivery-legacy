import { afterEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
  computeBreakpointCompareGhostIds,
  getBreakpointCompareGhostSnapshot,
  resetBreakpointCompareGhostStoreForTests,
  syncBreakpointCompareGhostFromIds,
} from '../lib/editor/breakpoint-compare-ghost-store'
import { remapBreakpointBoardNodeId } from '../lib/scene/breakpoint-board'
import { sceneNodeViewPropsAreEqual } from '../lib/scene/scene-node-view-memo'
import type { SceneNode } from '@zaoly/contracts'

afterEach(() => {
  resetBreakpointCompareGhostStoreForTests()
})

describe('breakpoint compare ghost selection (Wave B)', () => {
  it('maps selection to remapped ids on the other two tiles', () => {
    expect(computeBreakpointCompareGhostIds(['hero'], 'desktop')).toEqual([
      remapBreakpointBoardNodeId('tablet', 'hero'),
      remapBreakpointBoardNodeId('mobile', 'hero'),
    ])
    expect(computeBreakpointCompareGhostIds(['hero'], 'tablet')).toEqual([
      remapBreakpointBoardNodeId('desktop', 'hero'),
      remapBreakpointBoardNodeId('mobile', 'hero'),
    ])
  })

  it('skips board chrome ids and syncs the ghost store', () => {
    expect(computeBreakpointCompareGhostIds(['__bp-tile:desktop', 'hero'], 'mobile')).toEqual([
      remapBreakpointBoardNodeId('desktop', 'hero'),
      remapBreakpointBoardNodeId('tablet', 'hero'),
    ])
    const ghosts = computeBreakpointCompareGhostIds(['hero'], 'desktop')
    syncBreakpointCompareGhostFromIds(ghosts)
    expect(getBreakpointCompareGhostSnapshot(ghosts[0]!)).toBe(true)
    expect(getBreakpointCompareGhostSnapshot('hero')).toBe(false)
  })

  it('busts SceneNodeView memo when compareGhost flips', () => {
    const node = { id: 'n1', type: 'Stack', name: 'S' } as SceneNode
    const base = {
      node,
      selected: false,
      compareGhost: false,
      peerHaloColor: null,
      peerHaloName: null,
    }
    expect(
      sceneNodeViewPropsAreEqual(base, { ...base, compareGhost: true }),
    ).toBe(false)
  })

  it('wires canvas sync + ghost class and documents Wave B', () => {
    const root = path.resolve(__dirname, '../../..')
    const chrome = readFileSync(
      path.join(root, 'apps/web/components/editor/editor-canvas-chrome.tsx'),
      'utf8',
    )
    const view = readFileSync(
      path.join(root, 'apps/web/components/scene-node-view.tsx'),
      'utf8',
    )
    const css = readFileSync(path.join(root, 'apps/web/app/globals.css'), 'utf8')
    const spec = readFileSync(
      path.join(root, 'specs/domain/responsive-breakpoint-board.md'),
      'utf8',
    )
    expect(chrome).toContain('BreakpointCompareGhostSync')
    expect(view).toContain('bp-compare-ghost')
    expect(css).toContain('creation-scene-node--bp-compare-ghost')
    expect(spec).toContain('Cross-tile selection chrome')
  })
})
