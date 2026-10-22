import { describe, expect, it } from 'vitest'
import { mapOpsToInteractiveState } from '../lib/inspect/map-ops-to-interactive-state'

describe('mapOpsToInteractiveState', () => {
  it('passes through when default', () => {
    const ops = [{ op: 'set_prop' as const, nodeId: 'n1', key: 'color', value: '#fff' }]
    expect(mapOpsToInteractiveState(ops, 'default')).toEqual(ops)
  })

  it('maps prop/token writes to set_state_override and drops structure', () => {
    const mapped = mapOpsToInteractiveState(
      [
        { op: 'set_prop', nodeId: 'n1', key: 'background', value: '#111' },
        { op: 'set_token_binding', nodeId: 'n1', key: 'color', tokenPath: 'color.brand.primary' },
        { op: 'table_add_row', nodeId: 'n1' },
      ],
      'hover',
    )
    expect(mapped).toEqual([
      {
        op: 'set_state_override',
        nodeId: 'n1',
        state: 'hover',
        props: { background: '#111' },
      },
      {
        op: 'set_state_override',
        nodeId: 'n1',
        state: 'hover',
        tokenBindings: { color: 'color.brand.primary' },
      },
    ])
  })
})
