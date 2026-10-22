import type { SceneOp } from '@zaoly/contracts'

function firstString(...candidates: unknown[]): string | undefined {
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim()
  }
  return undefined
}

/**
 * Agents often send set_prop with `prop` / `property` instead of `key`,
 * or omit key entirely. Normalize before apply so we return 400, not 500.
 */
export function normalizeSceneOp(raw: SceneOp | Record<string, unknown>): SceneOp {
  const op = { ...raw } as Record<string, unknown>
  const kind = typeof op.op === 'string' ? op.op : ''

  if (kind === 'set_prop' || kind === 'set_style' || kind === 'set_token_binding' || kind === 'clear_token_binding') {
    const key = firstString(op.key, op.prop, op.property, op.name)
    if (key) op.key = key
  }

  if (kind === 'set_token_binding') {
    const tokenPath = firstString(op.tokenPath, op.path, op.token)
    if (tokenPath) op.tokenPath = tokenPath
  }

  if (
    kind === 'set_prop' ||
    kind === 'set_style' ||
    kind === 'set_token_binding' ||
    kind === 'clear_token_binding' ||
    kind === 'set_breakpoint_override' ||
    kind === 'clear_breakpoint_override' ||
    kind === 'set_state_override' ||
    kind === 'clear_state_override'
  ) {
    const nodeId = firstString(op.nodeId, op.id, op.targetId)
    if (nodeId) op.nodeId = nodeId
  }

  return op as SceneOp
}

export function normalizeSceneOps(ops: SceneOp[]): SceneOp[] {
  return ops.map((op) => normalizeSceneOp(op))
}
