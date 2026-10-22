import { describe, expect, it, beforeEach } from 'vitest'
import type { SceneNode } from '@zaoly/contracts'
import { sceneNodeViewPropsAreEqual } from '../lib/scene/scene-node-view-memo'

function node(id: string): SceneNode {
  return { id, type: 'Stack', children: [] }
}

describe('sceneNodeViewPropsAreEqual (WS-2 / P100)', () => {
  const base = {
    node: node('root'),
    selected: false,
    activeBreakpoint: 'desktop' as const,
    insidePrintPage: false,
  }

  it('skips re-render when node and selected are unchanged', () => {
    expect(sceneNodeViewPropsAreEqual(base, { ...base })).toBe(true)
  })

  it('re-renders when selected toggles for this node', () => {
    expect(sceneNodeViewPropsAreEqual(base, { ...base, selected: true })).toBe(false)
  })

  it('skips re-render when only a sibling selection would have changed (no selectedIds drill)', () => {
    const prev = { ...base, selected: false }
    const next = { ...base, selected: false }
    expect(sceneNodeViewPropsAreEqual(prev, next)).toBe(true)
  })

  it('re-renders when node reference changes', () => {
    expect(sceneNodeViewPropsAreEqual(base, { ...base, node: node('root') })).toBe(false)
  })
})
