/**
 * Invert SceneOps for W7 / W7b / W7c history patch stacks.
 * Spec: specs/domain/scene-history-patches-w7.md
 */
import type {
  CompositionScene,
  SceneNode,
  SceneOp,
  SceneStyleDimensionKey,
} from '@zaoly/contracts'
import { WRAP_CONTAINER_TYPES } from '@zaoly/contracts'
import { collectNodeIds } from '../scene-comments'
import { isInstanceNode } from './expand-instances'
import { applySceneOp } from './ops'
import { resolvePrimaryBreakpoint } from './primary-breakpoint'
import { DEFAULT_SCENE_PAGE_ID } from './scene-pages'
import { findNode, findParent } from './scene-tree'

const INVERTIBLE = new Set([
  'set_prop',
  'set_style',
  'set_token_binding',
  'clear_token_binding',
  'set_breakpoint_override',
  'clear_breakpoint_override',
  'set_primary_breakpoint',
  'set_state_override',
  'clear_state_override',
  'insert_child',
  'remove_node',
  'move_node',
  'reorder_node',
  'set_flags',
  'wrap_nodes',
  'unwrap_node',
  'add_interaction',
  'remove_interaction',
  'update_interaction',
  'table_add_row',
  'table_add_column',
  'table_remove_row',
  'table_remove_column',
  'rename_page',
  'set_active_page',
  'set_cover_page',
  'reorder_pages',
  'move_page_frame',
  'set_page_frame',
  'set_page_breakpoint',
  'add_page',
  'duplicate_page',
  'delete_page',
  'move_node_to_page',
  'create_master',
  'ensure_palette_master',
  'rename_master',
  'delete_master',
  'bind_master_composition',
  'insert_instance',
  'detach_instance',
  'update_master_root',
  'add_master_variant',
  'rename_master_variant',
  'delete_master_variant',
  'set_master_default_variant',
  'set_instance_variant',
  'update_master_variant_root',
  'add_master_axis',
  'rename_master_axis',
  'delete_master_axis',
  'add_master_axis_value',
  'rename_master_axis_value',
  'delete_master_axis_value',
  'set_instance_variant_axes',
  'upsert_master_variant_cell',
])

const ID_MINTING_OPS = new Set([
  'add_page',
  'duplicate_page',
  'create_master',
  'ensure_palette_master',
  'insert_instance',
  'add_master_variant',
  'add_master_axis',
  'upsert_master_variant_cell',
])

const MASTER_GRAPH_OPS = new Set([
  'rename_master',
  'bind_master_composition',
  'update_master_root',
  'add_master_variant',
  'rename_master_variant',
  'delete_master_variant',
  'set_master_default_variant',
  'update_master_variant_root',
  'add_master_axis',
  'rename_master_axis',
  'delete_master_axis',
  'add_master_axis_value',
  'rename_master_axis_value',
  'delete_master_axis_value',
  'upsert_master_variant_cell',
])

function isWrapContainerType(value: string): boolean {
  return (WRAP_CONTAINER_TYPES as readonly string[]).includes(value)
}

function isSiteTableHeaderRow(row: SceneNode): boolean {
  return row.type === 'SiteTableRow' && (row.props?.header === true || row.props?.header === 'true')
}

function propValue(node: SceneNode, key: string): unknown {
  if (isInstanceNode(node)) {
    if (key === 'name') return node.instanceOverrides?.name ?? node.name
    return node.instanceOverrides?.props?.[key]
  }
  if (key === 'name') return node.name
  return node.props?.[key]
}

function tokenPath(node: SceneNode, key: string): string | undefined {
  if (isInstanceNode(node)) return node.instanceOverrides?.tokenBindings?.[key]
  return node.tokenBindings?.[key]
}

function styleDim(node: SceneNode, key: SceneStyleDimensionKey): number | undefined {
  const raw = isInstanceNode(node)
    ? node.instanceOverrides?.style?.[key]
    : node.style?.[key]
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : undefined
}

function pageList(scene: CompositionScene) {
  return scene.pages?.length
    ? scene.pages
    : [{ id: DEFAULT_SCENE_PAGE_ID, name: 'Page 1', root: scene.root }]
}

function findParentAcrossPages(
  scene: CompositionScene,
  nodeId: string,
): { pageId: string; parentId: string; index: number } | null {
  for (const page of pageList(scene)) {
    const located = findParent(page.root, nodeId)
    if (located) {
      return {
        pageId: page.id,
        parentId: located.parent.id,
        index: located.index,
      }
    }
  }
  return null
}

function invertAddedPage(
  before: CompositionScene,
  after: CompositionScene,
): SceneOp[] | null {
  const beforeIds = new Set(pageList(before).map((p) => p.id))
  const added = pageList(after).find((p) => !beforeIds.has(p.id))
  if (!added) return null
  const inverse: SceneOp[] = [{ op: 'delete_page', pageId: added.id }]
  const prevActive = before.activePageId ?? pageList(before)[0]?.id
  if (prevActive) {
    inverse.push({ op: 'set_active_page', pageId: prevActive })
  }
  return inverse
}

/** Deterministic redo for id-minting page/master creates (W7c / W7d). */
export function rewriteForwardForHistory(
  before: CompositionScene,
  after: CompositionScene,
  ops: readonly SceneOp[],
): SceneOp[] {
  if (ops.length !== 1) return [...ops]
  const op = ops[0]!

  if (op.op === 'add_page' || op.op === 'duplicate_page') {
    const beforeIds = new Set(pageList(before).map((p) => p.id))
    const added = pageList(after).find((p) => !beforeIds.has(p.id))
    if (!added) return [...ops]
    const index = pageList(after).findIndex((p) => p.id === added.id)
    return [
      {
        op: 'restore_page',
        page: structuredClone(added),
        index: Math.max(0, index),
        ...(after.activePageId ? { activePageId: after.activePageId } : {}),
        coverPageId: after.coverPageId ?? null,
      },
    ]
  }

  if (op.op === 'create_master') {
    const beforeIds = new Set((before.masters ?? []).map((m) => m.id))
    const master = (after.masters ?? []).find((m) => !beforeIds.has(m.id))
    const located = findParent(before.root, op.nodeId)
    const instance = findNode(after.root, op.nodeId)
    if (!master || !located || !instance || !isInstanceNode(instance)) return [...ops]
    const index = (after.masters ?? []).findIndex((m) => m.id === master.id)
    return [
      {
        op: 'restore_master',
        master: structuredClone(master),
        index: Math.max(0, index),
      },
      { op: 'remove_node', nodeId: op.nodeId },
      {
        op: 'insert_child',
        parentId: located.parent.id,
        child: structuredClone(instance),
        index: located.index,
      },
    ]
  }

  if (op.op === 'ensure_palette_master') {
    const beforeIds = new Set((before.masters ?? []).map((m) => m.id))
    const master = (after.masters ?? []).find((m) => !beforeIds.has(m.id))
    if (!master) return [...ops]
    const index = (after.masters ?? []).findIndex((m) => m.id === master.id)
    return [
      {
        op: 'restore_master',
        master: structuredClone(master),
        index: Math.max(0, index),
      },
    ]
  }

  if (op.op === 'insert_instance') {
    const beforeKids = new Set(
      (findNode(before.root, op.parentId)?.children ?? []).map((c) => c.id),
    )
    const afterParent = findNode(after.root, op.parentId)
    const children = afterParent?.children ?? []
    const addedIdx = children.findIndex((c) => !beforeKids.has(c.id))
    if (addedIdx < 0) return [...ops]
    const added = children[addedIdx]!
    return [
      {
        op: 'insert_child',
        parentId: op.parentId,
        child: structuredClone(added),
        index: addedIdx,
      },
    ]
  }

  if (MASTER_GRAPH_OPS.has(op.op) && 'masterId' in op && typeof op.masterId === 'string') {
    const master = (after.masters ?? []).find((m) => m.id === op.masterId)
    if (!master) return [...ops]
    const index = (after.masters ?? []).findIndex((m) => m.id === master.id)
    return [
      {
        op: 'restore_master',
        master: structuredClone(master),
        index: Math.max(0, index),
      },
    ]
  }

  return [...ops]
}

function restoreMasterInverse(
  before: CompositionScene,
  masterId: string,
): SceneOp[] | null {
  const masters = before.masters ?? []
  const index = masters.findIndex((m) => m.id === masterId)
  if (index < 0) return null
  return [
    {
      op: 'restore_master',
      master: structuredClone(masters[index]!),
      index,
    },
  ]
}

function invertOne(
  before: CompositionScene,
  after: CompositionScene,
  op: SceneOp,
): SceneOp[] | null {
  if (!INVERTIBLE.has(op.op)) return null

  switch (op.op) {
    case 'set_prop': {
      if (op.key === 'mark' || op.key === 'markup') {
        const node = findNode(before.root, op.nodeId)
        if (node?.type === 'SiteSvg') return null
      }
      const node = findNode(before.root, op.nodeId)
      if (!node) return null
      return [{ op: 'set_prop', nodeId: op.nodeId, key: op.key, value: propValue(node, op.key) }]
    }
    case 'set_style': {
      const node = findNode(before.root, op.nodeId)
      if (!node) return null
      const prev = styleDim(node, op.key)
      if (prev === undefined) return null
      const inverse: SceneOp[] = [{ op: 'set_style', nodeId: op.nodeId, key: op.key, value: prev }]
      const prevToken = tokenPath(node, op.key)
      if (prevToken) {
        inverse.push({
          op: 'set_token_binding',
          nodeId: op.nodeId,
          key: op.key,
          tokenPath: prevToken,
        })
      }
      return inverse
    }
    case 'set_token_binding': {
      const node = findNode(before.root, op.nodeId)
      if (!node) return null
      const prev = tokenPath(node, op.key)
      if (prev === undefined) {
        return [{ op: 'clear_token_binding', nodeId: op.nodeId, key: op.key }]
      }
      return [
        { op: 'set_token_binding', nodeId: op.nodeId, key: op.key, tokenPath: prev },
      ]
    }
    case 'clear_token_binding': {
      const node = findNode(before.root, op.nodeId)
      if (!node) return null
      const prev = tokenPath(node, op.key)
      if (prev === undefined) return null
      return [
        { op: 'set_token_binding', nodeId: op.nodeId, key: op.key, tokenPath: prev },
      ]
    }
    case 'set_breakpoint_override': {
      const node = findNode(before.root, op.nodeId)
      if (!node) return null
      const prev = node.breakpoints?.[op.breakpoint]
      const inverse: SceneOp[] = [
        { op: 'clear_breakpoint_override', nodeId: op.nodeId, breakpoint: op.breakpoint },
      ]
      if (prev && (prev.props || prev.tokenBindings || typeof prev.hidden === 'boolean')) {
        inverse.push({
          op: 'set_breakpoint_override',
          nodeId: op.nodeId,
          breakpoint: op.breakpoint,
          ...(prev.props ? { props: structuredClone(prev.props) } : {}),
          ...(prev.tokenBindings
            ? { tokenBindings: structuredClone(prev.tokenBindings) }
            : {}),
          ...(typeof prev.hidden === 'boolean' ? { hidden: prev.hidden } : {}),
        })
      }
      return inverse
    }
    case 'clear_breakpoint_override': {
      const node = findNode(before.root, op.nodeId)
      if (!node) return null
      const prev = node.breakpoints?.[op.breakpoint]
      if (!prev) return null
      if (!op.keys?.length) {
        return [
          {
            op: 'set_breakpoint_override',
            nodeId: op.nodeId,
            breakpoint: op.breakpoint,
            ...(prev.props ? { props: structuredClone(prev.props) } : {}),
            ...(prev.tokenBindings
              ? { tokenBindings: structuredClone(prev.tokenBindings) }
              : {}),
            ...(typeof prev.hidden === 'boolean' ? { hidden: prev.hidden } : {}),
          },
        ]
      }
      const props: Record<string, unknown> = {}
      const tokenBindings: Record<string, string> = {}
      const clearProps = op.clearProps !== false
      const clearTokens = op.clearTokens !== false
      for (const key of op.keys) {
        if (clearProps && prev.props && key in prev.props) {
          props[key] = structuredClone(prev.props[key])
        }
        if (clearTokens && prev.tokenBindings?.[key]) {
          tokenBindings[key] = prev.tokenBindings[key]!
        }
      }
      const restoreHidden =
        op.clearHidden && typeof prev.hidden === 'boolean' ? prev.hidden : undefined
      if (
        !Object.keys(props).length &&
        !Object.keys(tokenBindings).length &&
        restoreHidden === undefined
      ) {
        return null
      }
      return [
        {
          op: 'set_breakpoint_override',
          nodeId: op.nodeId,
          breakpoint: op.breakpoint,
          ...(Object.keys(props).length ? { props } : {}),
          ...(Object.keys(tokenBindings).length ? { tokenBindings } : {}),
          ...(restoreHidden !== undefined ? { hidden: restoreHidden } : {}),
        },
      ]
    }
    case 'set_state_override': {
      const node = findNode(before.root, op.nodeId)
      if (!node) return null
      const prev = node.states?.[op.state]
      const inverse: SceneOp[] = [
        { op: 'clear_state_override', nodeId: op.nodeId, state: op.state },
      ]
      if (prev && (prev.props || prev.tokenBindings || prev.style)) {
        inverse.push({
          op: 'set_state_override',
          nodeId: op.nodeId,
          state: op.state,
          ...(prev.props ? { props: structuredClone(prev.props) } : {}),
          ...(prev.tokenBindings
            ? { tokenBindings: structuredClone(prev.tokenBindings) }
            : {}),
          ...(prev.style ? { style: structuredClone(prev.style) } : {}),
        })
      }
      return inverse
    }
    case 'clear_state_override': {
      const node = findNode(before.root, op.nodeId)
      if (!node) return null
      const prev = node.states?.[op.state]
      if (!prev) return null
      return [
        {
          op: 'set_state_override',
          nodeId: op.nodeId,
          state: op.state,
          ...(prev.props ? { props: structuredClone(prev.props) } : {}),
          ...(prev.tokenBindings
            ? { tokenBindings: structuredClone(prev.tokenBindings) }
            : {}),
          ...(prev.style ? { style: structuredClone(prev.style) } : {}),
        },
      ]
    }
    case 'insert_child': {
      if (!op.child?.id) return null
      return [{ op: 'remove_node', nodeId: op.child.id }]
    }
    case 'remove_node': {
      const located = findParent(before.root, op.nodeId)
      if (!located) return null
      const child = located.parent.children?.[located.index]
      if (!child || child.id !== op.nodeId) return null
      return [
        {
          op: 'insert_child',
          parentId: located.parent.id,
          child: structuredClone(child),
          index: located.index,
        },
      ]
    }
    case 'reorder_node': {
      const located = findParent(before.root, op.nodeId)
      if (!located) return null
      return [{ op: 'reorder_node', nodeId: op.nodeId, index: located.index }]
    }
    case 'move_node': {
      const located = findParent(before.root, op.nodeId)
      if (!located) return null
      return [
        {
          op: 'move_node',
          nodeId: op.nodeId,
          parentId: located.parent.id,
          index: located.index,
        },
      ]
    }
    case 'set_flags': {
      const node = findNode(before.root, op.nodeId)
      if (!node) return null
      if (isInstanceNode(node)) {
        const ov = node.instanceOverrides
        return [
          {
            op: 'set_flags',
            nodeId: op.nodeId,
            hidden: ov?.hidden === true,
            locked: ov?.locked === true,
          },
        ]
      }
      return [
        {
          op: 'set_flags',
          nodeId: op.nodeId,
          hidden: node.hidden === true,
          locked: node.locked === true,
        },
      ]
    }
    case 'wrap_nodes': {
      if (!op.containerId?.trim()) return null
      return [{ op: 'unwrap_node', nodeId: op.containerId }]
    }
    case 'unwrap_node': {
      const node = findNode(before.root, op.nodeId)
      if (!node || !isWrapContainerType(node.type)) return null
      const childIds = (node.children ?? []).map((c) => c.id)
      if (!childIds.length) return null
      return [
        {
          op: 'wrap_nodes',
          nodeIds: childIds,
          containerType: node.type as 'Stack' | 'Grid',
          containerId: op.nodeId,
        },
      ]
    }
    case 'add_interaction': {
      if (!op.interaction?.id) return null
      return [
        {
          op: 'remove_interaction',
          nodeId: op.nodeId,
          interactionId: op.interaction.id,
        },
      ]
    }
    case 'remove_interaction': {
      const node = findNode(before.root, op.nodeId)
      if (!node) return null
      const prev = (node.interactions ?? []).find((i) => i.id === op.interactionId)
      if (!prev) return null
      return [
        {
          op: 'add_interaction',
          nodeId: op.nodeId,
          interaction: structuredClone(prev),
        },
      ]
    }
    case 'update_interaction': {
      const node = findNode(before.root, op.nodeId)
      if (!node) return null
      const prev = (node.interactions ?? []).find((i) => i.id === op.interaction.id)
      if (!prev) return null
      return [
        {
          op: 'update_interaction',
          nodeId: op.nodeId,
          interaction: structuredClone(prev),
        },
      ]
    }
    case 'table_add_row':
      return [{ op: 'table_remove_row', nodeId: op.nodeId }]
    case 'table_add_column':
      return [{ op: 'table_remove_column', nodeId: op.nodeId }]
    case 'table_remove_row': {
      const table = findNode(before.root, op.nodeId)
      if (!table || table.type !== 'SiteTable') return null
      const rows = [...(table.children ?? [])]
      const bodyIndexes = rows
        .map((c, i) => ({ c, i }))
        .filter(({ c }) => c.type === 'SiteTableRow' && !isSiteTableHeaderRow(c))
        .map(({ i }) => i)
      if (bodyIndexes.length <= 1) return null
      const lastBody = bodyIndexes[bodyIndexes.length - 1]!
      const row = rows[lastBody]
      if (!row) return null
      return [
        {
          op: 'insert_child',
          parentId: op.nodeId,
          child: structuredClone(row),
          index: lastBody,
        },
      ]
    }
    case 'table_remove_column': {
      const table = findNode(before.root, op.nodeId)
      if (!table || table.type !== 'SiteTable') return null
      const tableRows = (table.children ?? []).filter((c) => c.type === 'SiteTableRow')
      const inverse: SceneOp[] = []
      for (const row of tableRows) {
        const cells = [...(row.children ?? [])]
        let lastCell = -1
        for (let i = cells.length - 1; i >= 0; i -= 1) {
          if (cells[i]?.type === 'SiteTableCell') {
            lastCell = i
            break
          }
        }
        if (lastCell < 0) continue
        const cell = cells[lastCell]
        if (!cell) continue
        inverse.push({
          op: 'insert_child',
          parentId: row.id,
          child: structuredClone(cell),
          index: lastCell,
        })
      }
      if (!inverse.length) return null
      return inverse
    }
    case 'rename_page': {
      const page = pageList(before).find((p) => p.id === op.pageId)
      if (!page) return null
      return [{ op: 'rename_page', pageId: op.pageId, name: page.name }]
    }
    case 'set_active_page': {
      const pages = pageList(before)
      const prev =
        typeof before.activePageId === 'string' && pages.some((p) => p.id === before.activePageId)
          ? before.activePageId
          : pages[0]?.id
      if (!prev) return null
      return [{ op: 'set_active_page', pageId: prev }]
    }
    case 'set_cover_page': {
      const prev = before.coverPageId
      if (!prev || typeof prev !== 'string') return null
      return [{ op: 'set_cover_page', pageId: prev }]
    }
    case 'reorder_pages': {
      const ids = pageList(before).map((p) => p.id)
      if (!ids.length) return null
      return [{ op: 'reorder_pages', pageIds: ids }]
    }
    case 'move_page_frame': {
      const page = pageList(before).find((p) => p.id === op.pageId)
      if (!page?.frame || !Number.isFinite(page.frame.x) || !Number.isFinite(page.frame.y)) {
        return null
      }
      return [{ op: 'move_page_frame', pageId: op.pageId, x: page.frame.x, y: page.frame.y }]
    }
    case 'set_page_frame': {
      const page = pageList(before).find((p) => p.id === op.pageId)
      if (!page) return null
      const frame = page.frame ?? { x: 0, y: 0 }
      return [
        {
          op: 'set_page_frame',
          pageId: op.pageId,
          x: frame.x,
          y: frame.y,
          ...(typeof frame.width === 'number' && frame.width > 0
            ? { width: frame.width }
            : { clearWidth: true }),
          ...(typeof frame.height === 'number' && frame.height > 0
            ? { height: frame.height }
            : { clearHeight: true }),
        },
      ]
    }
    case 'set_page_breakpoint': {
      const page = pageList(before).find((p) => p.id === op.pageId)
      if (!page) return null
      return [
        {
          op: 'set_page_breakpoint',
          pageId: op.pageId,
          breakpoint: page.breakpoint ?? null,
        },
      ]
    }
    case 'add_page':
    case 'duplicate_page':
      return invertAddedPage(before, after)
    case 'delete_page': {
      const pages = pageList(before)
      if (pages.length <= 1) return null
      const idx = pages.findIndex((p) => p.id === op.pageId)
      if (idx < 0) return null
      const page = pages[idx]!
      const nodeIds = collectNodeIds(page.root)
      const comments = (before.comments ?? []).filter(
        (c) => c.nodeId && nodeIds.has(c.nodeId),
      )
      return [
        {
          op: 'restore_page',
          page: structuredClone(page),
          index: idx,
          ...(before.activePageId ? { activePageId: before.activePageId } : {}),
          coverPageId: before.coverPageId ?? null,
          ...(comments.length ? { comments: structuredClone(comments) } : {}),
        },
      ]
    }
    case 'move_node_to_page': {
      const located = findParentAcrossPages(before, op.nodeId)
      if (!located) return null
      const inverse: SceneOp[] = [
        {
          op: 'move_node_to_page',
          nodeId: op.nodeId,
          toPageId: located.pageId,
          parentId: located.parentId,
          index: located.index,
        },
      ]
      const prevActive = before.activePageId ?? pageList(before)[0]?.id
      if (prevActive) {
        inverse.push({ op: 'set_active_page', pageId: prevActive })
      }
      return inverse
    }
    case 'rename_master':
    case 'bind_master_composition':
    case 'update_master_root':
    case 'add_master_variant':
    case 'rename_master_variant':
    case 'delete_master_variant':
    case 'set_master_default_variant':
    case 'update_master_variant_root':
    case 'add_master_axis':
    case 'rename_master_axis':
    case 'delete_master_axis':
    case 'add_master_axis_value':
    case 'rename_master_axis_value':
    case 'delete_master_axis_value':
    case 'upsert_master_variant_cell':
      return restoreMasterInverse(before, op.masterId)
    case 'delete_master':
      return restoreMasterInverse(before, op.masterId)
    case 'create_master': {
      const beforeIds = new Set((before.masters ?? []).map((m) => m.id))
      const master = (after.masters ?? []).find((m) => !beforeIds.has(m.id))
      const located = findParent(before.root, op.nodeId)
      const original = findNode(before.root, op.nodeId)
      if (!master || !located || !original) return null
      return [
        { op: 'remove_node', nodeId: op.nodeId },
        {
          op: 'insert_child',
          parentId: located.parent.id,
          child: structuredClone(original),
          index: located.index,
        },
        { op: 'delete_master', masterId: master.id },
      ]
    }
    case 'ensure_palette_master': {
      const beforeIds = new Set((before.masters ?? []).map((m) => m.id))
      const master = (after.masters ?? []).find((m) => !beforeIds.has(m.id))
      if (!master) return []
      return [{ op: 'delete_master', masterId: master.id }]
    }
    case 'insert_instance': {
      const beforeKids = new Set(
        (findNode(before.root, op.parentId)?.children ?? []).map((c) => c.id),
      )
      const afterParent = findNode(after.root, op.parentId)
      const added = (afterParent?.children ?? []).find((c) => !beforeKids.has(c.id))
      if (!added) return null
      return [{ op: 'remove_node', nodeId: added.id }]
    }
    case 'detach_instance': {
      const located = findParent(before.root, op.nodeId)
      const instance = findNode(before.root, op.nodeId)
      if (!located || !instance || !isInstanceNode(instance)) return null
      const afterParent = findNode(after.root, located.parent.id)
      const detached = afterParent?.children?.[located.index]
      if (!detached) return null
      return [
        { op: 'remove_node', nodeId: detached.id },
        {
          op: 'insert_child',
          parentId: located.parent.id,
          child: structuredClone(instance),
          index: located.index,
        },
      ]
    }
    case 'set_instance_variant': {
      const node = findNode(before.root, op.nodeId)
      if (!node || !isInstanceNode(node) || !node.instanceVariantId) return null
      return [
        {
          op: 'set_instance_variant',
          nodeId: op.nodeId,
          variantId: node.instanceVariantId,
        },
      ]
    }
    case 'set_instance_variant_axes': {
      const node = findNode(before.root, op.nodeId)
      if (!node || !isInstanceNode(node) || !node.instanceVariantAxes) return null
      return [
        {
          op: 'set_instance_variant_axes',
          nodeId: op.nodeId,
          axes: { ...node.instanceVariantAxes },
        },
      ]
    }
    case 'set_primary_breakpoint': {
      const prev = resolvePrimaryBreakpoint(before)
      return [{ op: 'set_primary_breakpoint', breakpoint: prev }]
    }
    default:
      return null
  }
}

/**
 * Build reverse-ordered inverse ops for an allowlisted batch, or `null` to force snapshot history.
 *
 * Pass `committedAfter` (the scene already produced by applying `ops`) so id-minting ops
 * (`add_page` / `duplicate_page`) invert against the real page ids. WHEN a minting op is not
 * the sole/last op in a multi-op batch, returns `null` (snapshot fallback).
 */
export function invertSceneOps(
  before: CompositionScene,
  ops: readonly SceneOp[],
  committedAfter?: CompositionScene,
): SceneOp[] | null {
  if (!ops.length) return null

  const mintIndexes = ops
    .map((op, i) => (ID_MINTING_OPS.has(op.op) ? i : -1))
    .filter((i) => i >= 0)
  if (mintIndexes.some((i) => i !== ops.length - 1)) {
    return null
  }
  if (mintIndexes.length && !committedAfter) {
    return null
  }

  const perOpInverse: SceneOp[][] = []
  let working = before
  for (let i = 0; i < ops.length; i += 1) {
    const op = ops[i]!
    const isLast = i === ops.length - 1
    let after: CompositionScene
    if (isLast && committedAfter) {
      after = committedAfter
    } else {
      const applied = applySceneOp(working, op)
      if (!applied.ok) return null
      after = applied.scene
    }
    const part = invertOne(working, after, op)
    if (!part) return null
    perOpInverse.push(part)
    working = after
  }
  const inverse: SceneOp[] = []
  for (let i = perOpInverse.length - 1; i >= 0; i -= 1) {
    inverse.push(...perOpInverse[i]!)
  }
  return inverse
}
