/**
 * Soft-lock against peer selection (W6 + editor enterprise follow-up).
 * Spec: specs/domain/concurrent-edit-w6.md · knowledge/concurrent-edit-decision.md
 *
 * Best-effort awareness — not a hard lease. Gates structural + leaf/property ops
 * that target a peer-selected node (or related page id for page shell structural ops).
 */
import type { SceneOp, ScenePresenceUser } from '@zaoly/contracts'
import { getSoftLockPeers } from './peer-presence-store'

/** Ops that conflict with a peer's selection (structural or leaf). */
const LOCKED_OPS = new Set([
  'remove_node',
  'move_node',
  'reorder_node',
  'wrap_nodes',
  'unwrap_node',
  'move_node_to_page',
  'delete_page',
  'restore_page',
  'duplicate_page',
  'insert_child',
  'insert_instance',
  'table_add_row',
  'table_add_column',
  'table_remove_row',
  'table_remove_column',
  'set_prop',
  'set_style',
  'set_token_binding',
  'clear_token_binding',
  'set_breakpoint_override',
  'clear_breakpoint_override',
  'set_state_override',
  'clear_state_override',
  'set_flags',
  'add_interaction',
  'remove_interaction',
  'update_interaction',
])

function targetIdsForOp(op: SceneOp): string[] {
  switch (op.op) {
    case 'remove_node':
    case 'reorder_node':
    case 'unwrap_node':
    case 'table_add_row':
    case 'table_add_column':
    case 'table_remove_row':
    case 'table_remove_column':
    case 'set_prop':
    case 'set_style':
    case 'set_token_binding':
    case 'clear_token_binding':
    case 'set_breakpoint_override':
    case 'clear_breakpoint_override':
    case 'set_state_override':
    case 'clear_state_override':
    case 'set_flags':
    case 'add_interaction':
    case 'remove_interaction':
    case 'update_interaction':
      return [op.nodeId]
    case 'move_node':
      return [op.nodeId, op.parentId]
    case 'wrap_nodes':
      return [...op.nodeIds]
    case 'move_node_to_page':
      return [op.nodeId]
    case 'insert_child':
    case 'insert_instance':
      return [op.parentId]
    case 'delete_page':
    case 'duplicate_page':
      return [op.pageId]
    case 'restore_page':
      return [op.page.id]
    case 'delete_master':
      return [op.masterId]
    case 'restore_master':
      return [op.master.id]
    default:
      return []
  }
}

/** @deprecated Prefer `isPresenceLockedOp` — name kept for call-site compatibility. */
export function isStructuralPresenceOp(op: SceneOp): boolean {
  return LOCKED_OPS.has(op.op)
}

export function isPresenceLockedOp(op: SceneOp): boolean {
  return LOCKED_OPS.has(op.op)
}

export function softLockConflict(
  ops: readonly SceneOp[],
  peers: readonly ScenePresenceUser[] = getSoftLockPeers(),
): string | null {
  if (!peers.length) return null
  const peerSelected = new Set<string>()
  for (const peer of peers) {
    for (const id of peer.selectedIds ?? []) peerSelected.add(id)
  }
  if (!peerSelected.size) return null

  for (const op of ops) {
    if (!LOCKED_OPS.has(op.op)) continue
    for (const id of targetIdsForOp(op)) {
      if (peerSelected.has(id)) {
        const peer = peers.find((p) => (p.selectedIds ?? []).includes(id))
        const who = peer?.name || 'a collaborator'
        return `Soft-lock: ${who} has this selection — try again when free.`
      }
    }
  }
  return null
}
