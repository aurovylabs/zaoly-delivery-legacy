'use client'

import type { SceneBreakpointId, SceneNode, SceneOp, SceneStateId } from '@zaoly/contracts'
import {
  buildSetTokenOps,
  buildWriteLiteralOps,
  buildWritePropOps,
} from '../../lib/inspect/inspector-write-ops'
import { mapOpsToInteractiveState } from '../../lib/inspect/map-ops-to-interactive-state'
import type { SiblingWriteContext } from '../../lib/inspect/inspector-field-values'
import { dispatchOnboardingAction } from '../../lib/editor/onboarding'

export function useInspectorWrites({
  selected,
  selectedNodes,
  multi,
  useOverride,
  activeBreakpoint,
  activeInteractiveState = 'default',
  onOps,
}: {
  selected: SceneNode
  selectedNodes: SceneNode[]
  multi: boolean
  useOverride: boolean
  activeBreakpoint: SceneBreakpointId
  activeInteractiveState?: SceneStateId
  onOps: (ops: SceneOp[]) => void
}) {
  const targets = () => (multi ? selectedNodes : [selected])
  const emit = (ops: SceneOp[]) => onOps(mapOpsToInteractiveState(ops, activeInteractiveState))

  function writeProp(key: string, value: unknown) {
    emit(buildWritePropOps(targets(), key, value, useOverride, activeBreakpoint))
  }

  function writeLiteral(key: string, raw: string, sibling?: SiblingWriteContext) {
    emit(buildWriteLiteralOps(targets(), key, raw, useOverride, activeBreakpoint, sibling))
  }

  function setToken(key: string, tokenPath: string, sibling?: SiblingWriteContext) {
    emit(buildSetTokenOps(targets(), key, tokenPath, useOverride, activeBreakpoint, sibling))
    dispatchOnboardingAction('tokenBind')
  }

  function setDataBinding(key: string, dataRef: string) {
    const ops: SceneOp[] = []
    for (const node of targets()) {
      if (node.locked) continue
      ops.push({ op: 'set_data_binding', nodeId: node.id, key, dataRef })
    }
    emit(ops)
  }

  function clearDataBinding(key: string) {
    const ops: SceneOp[] = []
    for (const node of targets()) {
      if (node.locked) continue
      if (!node.dataBindings?.[key] && !node.instanceOverrides?.dataBindings?.[key]) continue
      ops.push({ op: 'clear_data_binding', nodeId: node.id, key })
    }
    emit(ops)
  }

  return { writeProp, writeLiteral, setToken, setDataBinding, clearDataBinding }
}
