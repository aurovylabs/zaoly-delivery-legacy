import type { SceneBreakpointId, SceneNode, SceneOp } from '@zaoly/contracts'
import { gapSiblingKeysToClear, type GapWriteMode } from './gap-groups'
import { siblingKeysToClear, type BoxModelKind, type BoxModelWriteMode } from './box-model-groups'
import { parseInspectLiteral } from './resolve-bindings'
import { SHELL_COPY_PROXY, type SiblingWriteContext } from './inspector-field-values'

export function appendFieldUnsetOps(
  ops: SceneOp[],
  node: SceneNode,
  key: string,
  useOverride: boolean,
  activeBreakpoint: SceneBreakpointId,
): void {
  if (!useOverride) {
    ops.push({ op: 'set_prop', nodeId: node.id, key, value: '' })
    if (node.tokenBindings?.[key]) {
      ops.push({ op: 'clear_token_binding', nodeId: node.id, key })
    }
  } else {
    ops.push({
      op: 'clear_breakpoint_override',
      nodeId: node.id,
      breakpoint: activeBreakpoint,
      keys: [key],
      clearProps: true,
      clearTokens: true,
    })
  }
}

function applySiblingClears(
  ops: SceneOp[],
  node: SceneNode,
  sibling: SiblingWriteContext | undefined,
  key: string,
  useOverride: boolean,
  activeBreakpoint: SceneBreakpointId,
): void {
  if (sibling?.group === 'box') {
    for (const clearKey of siblingKeysToClear(sibling.kind, sibling.writeMode, key)) {
      appendFieldUnsetOps(ops, node, clearKey, useOverride, activeBreakpoint)
    }
  }
  if (sibling?.group === 'gap') {
    for (const clearKey of gapSiblingKeysToClear(sibling.writeMode, key)) {
      appendFieldUnsetOps(ops, node, clearKey, useOverride, activeBreakpoint)
    }
  }
}

export function buildWritePropOps(
  targets: SceneNode[],
  key: string,
  value: unknown,
  useOverride: boolean,
  activeBreakpoint: SceneBreakpointId,
): SceneOp[] {
  const ops: SceneOp[] = []
  for (const node of targets) {
    if (node.locked) continue
    const copyProxy = SHELL_COPY_PROXY[node.type]
    if (key === 'name' || (copyProxy && copyProxy.field === key) || !useOverride) {
      ops.push({ op: 'set_prop', nodeId: node.id, key, value })
    } else {
      ops.push({
        op: 'set_breakpoint_override',
        nodeId: node.id,
        breakpoint: activeBreakpoint,
        props: { [key]: value },
      })
    }
  }
  return ops
}

export function buildWriteLiteralOps(
  targets: SceneNode[],
  key: string,
  raw: string,
  useOverride: boolean,
  activeBreakpoint: SceneBreakpointId,
  sibling?: SiblingWriteContext,
): SceneOp[] {
  const value = parseInspectLiteral(raw)
  const ops: SceneOp[] = []
  for (const node of targets) {
    if (node.locked) continue
    applySiblingClears(ops, node, sibling, key, useOverride, activeBreakpoint)
    if (!useOverride) {
      ops.push({ op: 'set_prop', nodeId: node.id, key, value })
    } else {
      ops.push({
        op: 'set_breakpoint_override',
        nodeId: node.id,
        breakpoint: activeBreakpoint,
        props: { [key]: value },
      })
    }
    if (node.tokenBindings?.[key]) {
      if (!useOverride) {
        ops.push({ op: 'clear_token_binding', nodeId: node.id, key })
      } else {
        ops.push({
          op: 'clear_breakpoint_override',
          nodeId: node.id,
          breakpoint: activeBreakpoint,
          keys: [key],
          clearProps: false,
          clearTokens: true,
        })
      }
    }
  }
  return ops
}

export function buildSetTokenOps(
  targets: SceneNode[],
  key: string,
  tokenPath: string,
  useOverride: boolean,
  activeBreakpoint: SceneBreakpointId,
  sibling?: SiblingWriteContext,
): SceneOp[] {
  const ops: SceneOp[] = []
  for (const node of targets) {
    if (node.locked) continue
    applySiblingClears(ops, node, sibling, key, useOverride, activeBreakpoint)
    if (!useOverride) {
      ops.push({ op: 'set_prop', nodeId: node.id, key, value: '' })
      ops.push({ op: 'set_token_binding', nodeId: node.id, key, tokenPath })
    } else {
      ops.push({
        op: 'set_breakpoint_override',
        nodeId: node.id,
        breakpoint: activeBreakpoint,
        props: { [key]: '' },
        tokenBindings: { [key]: tokenPath },
      })
    }
  }
  return ops
}
