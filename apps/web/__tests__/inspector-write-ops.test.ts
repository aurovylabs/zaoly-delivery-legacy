import { describe, expect, it } from 'vitest'
import type { SceneNode } from '@zaoly/contracts'
import {
  buildWriteLiteralOps,
  buildWritePropOps,
  buildSetTokenOps,
} from '../lib/inspect/inspector-write-ops'

function node(id: string): SceneNode {
  return { id, type: 'Stack', children: [] }
}

describe('inspector-write-ops (P104)', () => {
  it('buildWritePropOps sets prop on unlocked targets', () => {
    const ops = buildWritePropOps([node('a')], 'width', '100%', false, 'desktop')
    expect(ops).toEqual([{ op: 'set_prop', nodeId: 'a', key: 'width', value: '100%' }])
  })

  it('buildWritePropOps skips locked nodes', () => {
    const locked = { ...node('a'), locked: true }
    expect(buildWritePropOps([locked], 'width', '1', false, 'desktop')).toEqual([])
  })

  it('buildWriteLiteralOps clears token binding when literal set', () => {
    const n: SceneNode = {
      ...node('a'),
      tokenBindings: { width: 'space.4' },
    }
    const ops = buildWriteLiteralOps([n], 'width', '12px', false, 'desktop')
    expect(ops.some((o) => o.op === 'clear_token_binding')).toBe(true)
  })

  it('buildSetTokenOps binds token path', () => {
    const ops = buildSetTokenOps([node('a')], 'color', 'color.primary.500', false, 'desktop')
    expect(ops).toEqual([
      { op: 'set_prop', nodeId: 'a', key: 'color', value: '' },
      { op: 'set_token_binding', nodeId: 'a', key: 'color', tokenPath: 'color.primary.500' },
    ])
  })
})
