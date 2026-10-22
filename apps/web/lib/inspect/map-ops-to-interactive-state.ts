/**
 * Map base HUD SceneOps onto interactive state overrides (W4).
 * Spec: `specs/domain/canvas-smart-hud.md`
 */
import type { SceneOp, SceneStateId } from '@zaoly/contracts'
import { writesToStateOverride } from '../scene/state-cascade'

const STRUCTURE_OPS = new Set([
  'table_add_row',
  'table_add_column',
  'table_remove_row',
  'table_remove_column',
  'wrap_nodes',
  'unwrap_node',
  'move_node',
  'remove_node',
  'duplicate_node',
  'insert_child',
])

/**
 * WHEN pseudo-state ≠ default: convert set_prop / style / token writes into
 * `set_state_override` / `clear_state_override`. Structure ops are dropped.
 */
export function mapOpsToInteractiveState(
  ops: SceneOp[],
  state: SceneStateId,
): SceneOp[] {
  if (!writesToStateOverride(state)) return ops
  const st = state as Exclude<SceneStateId, 'default'>
  const out: SceneOp[] = []
  for (const op of ops) {
    if (STRUCTURE_OPS.has(op.op)) continue
    if (op.op === 'set_prop') {
      out.push({
        op: 'set_state_override',
        nodeId: op.nodeId,
        state: st,
        props: { [op.key]: op.value },
      })
      continue
    }
    if (op.op === 'set_style') {
      out.push({
        op: 'set_state_override',
        nodeId: op.nodeId,
        state: st,
        style: { [op.key]: op.value as string | number },
      })
      continue
    }
    if (op.op === 'set_token_binding') {
      out.push({
        op: 'set_state_override',
        nodeId: op.nodeId,
        state: st,
        tokenBindings: { [op.key]: op.tokenPath },
      })
      continue
    }
    if (op.op === 'clear_token_binding') {
      out.push({
        op: 'clear_state_override',
        nodeId: op.nodeId,
        state: st,
        keys: [op.key],
        clearTokens: true,
        clearProps: false,
        clearStyle: false,
      })
      continue
    }
    // Pass through already-state ops; skip unrelated
    if (op.op === 'set_state_override' || op.op === 'clear_state_override') {
      out.push(op)
    }
  }
  return out
}
