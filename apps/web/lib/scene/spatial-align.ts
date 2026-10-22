import type { SceneBreakpointId, SceneNode, SceneOp } from '@zaoly/contracts'
import {
  writesToBreakpointOverride,
  type DigitalPrimaryBreakpoint,
} from './cascade'

export type SpatialAlignment = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'
export type SpatialDistribution = 'horizontal' | 'vertical'

export interface NodeSpatialBox {
  node: SceneNode
  box: {
    left: number
    top: number
    width: number
    height: number
  }
}

export function planSpatialAlignOps(
  boxes: NodeSpatialBox[],
  alignment: SpatialAlignment,
  breakpoint: SceneBreakpointId = 'desktop',
  zoom = 1,
  primary: DigitalPrimaryBreakpoint = 'desktop',
): SceneOp[] {
  if (boxes.length < 2) return []

  const minLeft = Math.min(...boxes.map((b) => b.box.left))
  const maxRight = Math.max(...boxes.map((b) => b.box.left + b.box.width))
  const midX = (minLeft + maxRight) / 2

  const minTop = Math.min(...boxes.map((b) => b.box.top))
  const maxBottom = Math.max(...boxes.map((b) => b.box.top + b.box.height))
  const midY = (minTop + maxBottom) / 2

  const useOverride = writesToBreakpointOverride(breakpoint, primary)
  const ops: SceneOp[] = []

  for (const { node, box } of boxes) {
    let targetX = box.left
    let targetY = box.top

    switch (alignment) {
      case 'left':
        targetX = minLeft
        break
      case 'center':
        targetX = midX - box.width / 2
        break
      case 'right':
        targetX = maxRight - box.width
        break
      case 'top':
        targetY = minTop
        break
      case 'middle':
        targetY = midY - box.height / 2
        break
      case 'bottom':
        targetY = maxBottom - box.height
        break
    }

    const deltaX = (targetX - box.left) / zoom
    const deltaY = (targetY - box.top) / zoom

    if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) continue

    const cascadedProps = (useOverride ? node.breakpoints?.[breakpoint]?.props : node.props) ?? node.props ?? {}
    const curLeft = parseFloat(String(cascadedProps.left ?? 0)) || 0
    const curTop = parseFloat(String(cascadedProps.top ?? 0)) || 0

    const nextProps: Record<string, unknown> = {}

    if (Math.abs(deltaX) >= 0.5) {
      nextProps.left = `${Math.round(curLeft + deltaX)}px`
    }
    if (Math.abs(deltaY) >= 0.5) {
      nextProps.top = `${Math.round(curTop + deltaY)}px`
    }

    if (!cascadedProps.position && !node.props?.position) {
      nextProps.position = 'relative'
    }

    if (useOverride) {
      ops.push({
        op: 'set_breakpoint_override',
        nodeId: node.id,
        breakpoint,
        props: nextProps,
      })
    } else {
      for (const [key, value] of Object.entries(nextProps)) {
        ops.push({
          op: 'set_prop',
          nodeId: node.id,
          key,
          value,
        })
      }
    }
  }

  return ops
}

export function planSpatialDistributeOps(
  boxes: NodeSpatialBox[],
  axis: SpatialDistribution,
  breakpoint: SceneBreakpointId = 'desktop',
  zoom = 1,
  primary: DigitalPrimaryBreakpoint = 'desktop',
): SceneOp[] {
  if (boxes.length < 3) return []

  const useOverride = writesToBreakpointOverride(breakpoint, primary)
  const ops: SceneOp[] = []

  if (axis === 'horizontal') {
    const sorted = [...boxes].sort((a, b) => a.box.left - b.box.left)
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    const totalSpan = last.box.left + last.box.width - first.box.left
    const totalWidths = sorted.reduce((sum, item) => sum + item.box.width, 0)
    const gap = (totalSpan - totalWidths) / (sorted.length - 1)

    let currentExpectedLeft = first.box.left

    for (let i = 0; i < sorted.length; i++) {
      const { node, box } = sorted[i]
      const deltaX = (currentExpectedLeft - box.left) / zoom
      currentExpectedLeft += box.width + gap

      if (Math.abs(deltaX) < 0.5) continue

      const cascadedProps = (useOverride ? node.breakpoints?.[breakpoint]?.props : node.props) ?? node.props ?? {}
      const curLeft = parseFloat(String(cascadedProps.left ?? 0)) || 0
      const nextProps: Record<string, unknown> = {
        left: `${Math.round(curLeft + deltaX)}px`,
      }
      if (!cascadedProps.position && !node.props?.position) {
        nextProps.position = 'relative'
      }

      if (useOverride) {
        ops.push({
          op: 'set_breakpoint_override',
          nodeId: node.id,
          breakpoint,
          props: nextProps,
        })
      } else {
        for (const [key, value] of Object.entries(nextProps)) {
          ops.push({
            op: 'set_prop',
            nodeId: node.id,
            key,
            value,
          })
        }
      }
    }
  } else {
    // vertical
    const sorted = [...boxes].sort((a, b) => a.box.top - b.box.top)
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    const totalSpan = last.box.top + last.box.height - first.box.top
    const totalHeights = sorted.reduce((sum, item) => sum + item.box.height, 0)
    const gap = (totalSpan - totalHeights) / (sorted.length - 1)

    let currentExpectedTop = first.box.top

    for (let i = 0; i < sorted.length; i++) {
      const { node, box } = sorted[i]
      const deltaY = (currentExpectedTop - box.top) / zoom
      currentExpectedTop += box.height + gap

      if (Math.abs(deltaY) < 0.5) continue

      const cascadedProps = (useOverride ? node.breakpoints?.[breakpoint]?.props : node.props) ?? node.props ?? {}
      const curTop = parseFloat(String(cascadedProps.top ?? 0)) || 0
      const nextProps: Record<string, unknown> = {
        top: `${Math.round(curTop + deltaY)}px`,
      }
      if (!cascadedProps.position && !node.props?.position) {
        nextProps.position = 'relative'
      }

      if (useOverride) {
        ops.push({
          op: 'set_breakpoint_override',
          nodeId: node.id,
          breakpoint,
          props: nextProps,
        })
      } else {
        for (const [key, value] of Object.entries(nextProps)) {
          ops.push({
            op: 'set_prop',
            nodeId: node.id,
            key,
            value,
          })
        }
      }
    }
  }

  return ops
}
