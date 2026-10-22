import { describe, expect, it } from 'vitest'
import type { SceneNode } from '@zaoly/contracts'
import { buildHudTokenWriteOps } from '../lib/inspect/resolve-hud-model'

describe('buildHudTokenWriteOps', () => {
  const node: SceneNode = {
    id: 't1',
    type: 'SiteText',
    name: 'T',
    props: { color: '#112233' },
    tokenBindings: { color: 'color.neutral.700' },
  }

  it('binds a Brandion color token and clears the literal prop', () => {
    expect(
      buildHudTokenWriteOps(node, 'color', { kind: 'token', path: 'color.action.primary' }),
    ).toEqual([
      { op: 'set_prop', nodeId: 't1', key: 'color', value: '' },
      { op: 'set_token_binding', nodeId: 't1', key: 'color', tokenPath: 'color.action.primary' },
    ])
  })

  it('writes a free hex literal and clears the token binding', () => {
    expect(buildHudTokenWriteOps(node, 'color', { kind: 'literal', value: '#1f44ff' })).toEqual([
      { op: 'set_prop', nodeId: 't1', key: 'color', value: '#1f44ff' },
      { op: 'clear_token_binding', nodeId: 't1', key: 'color' },
    ])
  })

  it('skips locked nodes', () => {
    expect(
      buildHudTokenWriteOps({ ...node, locked: true }, 'color', {
        kind: 'token',
        path: 'color.black',
      }),
    ).toEqual([])
  })
})
