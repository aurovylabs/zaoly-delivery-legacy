/**
 * Wave I — nested Master variant rows × breakpoint tiles.
 * Spec: specs/domain/master-edit-variant-breakpoint-matrix.md
 */
import type {
  SceneBreakpointId,
  SceneMaster,
  SceneNode,
  SceneNodeId,
} from '@zaoly/contracts'
import {
  BREAKPOINT_COMPARE_BPS,
  type DigitalEditorBreakpoint,
  type BreakpointBoardLabels,
} from './breakpoint-board'
import { EDITOR_BREAKPOINT_WIDTHS } from './breakpoints'
import { listMasterVariants } from './master-variants'

export const MATRIX_BOARD_ID = '__master-bp-matrix__'
export const MATRIX_ROW_PREFIX = '__mx-row:'
export const MATRIX_NODE_PREFIX = '__mx-node:'

export function isMatrixBoardId(id: SceneNodeId | null | undefined): boolean {
  if (!id) return false
  return (
    id === MATRIX_BOARD_ID ||
    id.startsWith(MATRIX_ROW_PREFIX) ||
    id.startsWith(MATRIX_NODE_PREFIX) ||
    id.startsWith('__bp-tile:')
  )
}

export function remapMatrixNodeId(
  variantId: string,
  bp: DigitalEditorBreakpoint,
  nodeId: SceneNodeId,
): string {
  return `${MATRIX_NODE_PREFIX}${variantId}:${bp}/${nodeId}`
}

export function parseMatrixRemappedId(
  id: SceneNodeId,
): { variantId: string; bp: DigitalEditorBreakpoint; nodeId: SceneNodeId } | null {
  if (!id.startsWith(MATRIX_NODE_PREFIX)) return null
  const rest = id.slice(MATRIX_NODE_PREFIX.length)
  const slash = rest.indexOf('/')
  if (slash <= 0) return null
  const head = rest.slice(0, slash)
  const nodeId = rest.slice(slash + 1)
  const colon = head.indexOf(':')
  if (colon <= 0 || !nodeId) return null
  const variantId = head.slice(0, colon)
  const bp = head.slice(colon + 1)
  if (bp !== 'desktop' && bp !== 'tablet' && bp !== 'mobile') return null
  return { variantId, bp, nodeId }
}

function remapTreeIds(
  node: SceneNode,
  variantId: string,
  bp: DigitalEditorBreakpoint,
): SceneNode {
  const next: SceneNode = {
    ...node,
    id: remapMatrixNodeId(variantId, bp, node.id),
  }
  if (node.children?.length) {
    next.children = node.children.map((c) => remapTreeIds(c, variantId, bp))
  }
  return next
}

export type BuildMasterBreakpointMatrixOptions = {
  labels: BreakpointBoardLabels
  primaryLabel?: string
  primaryBreakpoint?: DigitalEditorBreakpoint
  minHeight?: number
}

/**
 * One row per variant; each row nests Desktop · Tablet · Mobile tiles.
 * Active cell (activeVariant × activeDigitalBp) keeps persisted ids.
 */
export function buildMasterBreakpointMatrixBoard(
  master: SceneMaster,
  activeVariantId: string,
  activeBreakpoint: SceneBreakpointId,
  options: BuildMasterBreakpointMatrixOptions,
): SceneNode {
  const activeDigital: DigitalEditorBreakpoint =
    activeBreakpoint === 'tablet' || activeBreakpoint === 'mobile'
      ? activeBreakpoint
      : 'desktop'
  const primaryBp: DigitalEditorBreakpoint =
    options.primaryBreakpoint === 'tablet' || options.primaryBreakpoint === 'mobile'
      ? options.primaryBreakpoint
      : 'desktop'
  const variants = listMasterVariants(master)
  const rows = variants.map((variant) => {
    const rowActive = variant.id === activeVariantId
    const tiles = BREAKPOINT_COMPARE_BPS.map((bp) => {
      const cellActive = rowActive && bp === activeDigital
      const isPrimary = bp === primaryBp
      const width = EDITOR_BREAKPOINT_WIDTHS[bp]
      const bodySource = structuredClone(variant.root)
      const body = cellActive ? bodySource : remapTreeIds(bodySource, variant.id, bp)
      const tileId = `__bp-tile:${variant.id}:${bp}`
      const label = options.labels[bp]
      const displayLabel =
        isPrimary && options.primaryLabel
          ? `${label} · ${options.primaryLabel}`
          : label
      return {
        id: tileId,
        type: 'Stack' as const,
        name: displayLabel,
        locked: !cellActive,
        props: {
          direction: 'column',
          gap: 'sm',
          align: 'start',
          'data-breakpoint-chrome': 'true',
          'data-breakpoint-tile': bp,
          'data-breakpoint-active': cellActive ? 'true' : 'false',
          'data-breakpoint-paint': bp,
          'data-matrix-variant': variant.id,
          ...(isPrimary ? { 'data-breakpoint-primary': 'true' } : {}),
        },
        style: {
          width,
          minWidth: width,
          boxSizing: 'border-box' as const,
        },
        children: [
          {
            id: `${tileId}:label`,
            type: 'Text' as const,
            name: displayLabel,
            locked: true,
            props: {
              children: cellActive ? `Editing · ${displayLabel}` : displayLabel,
              role: 'meta',
              'data-breakpoint-label': 'true',
              'data-breakpoint-active': cellActive ? 'true' : 'false',
              'data-breakpoint-tile': bp,
              'data-matrix-variant': variant.id,
              ...(isPrimary ? { 'data-breakpoint-primary': 'true' } : {}),
            },
          },
          {
            id: `${tileId}:body`,
            type: 'Stack' as const,
            name: `${label} body`,
            locked: !cellActive,
            props: {
              direction: 'column',
              align: 'stretch',
              'data-breakpoint-body': 'true',
              'data-breakpoint-paint': bp,
              'data-matrix-variant': variant.id,
              ...(cellActive ? { 'data-breakpoint-body-active': 'true' } : {}),
            },
            style: {
              width: '100%',
              minHeight: options.minHeight ?? 200,
              boxSizing: 'border-box' as const,
            },
            children: [
              {
                ...body,
                props: {
                  ...(body.props ?? {}),
                  'data-breakpoint-paint': bp,
                  'data-matrix-variant': variant.id,
                },
              },
            ],
          },
        ],
      }
    })
    const rowId = `${MATRIX_ROW_PREFIX}${variant.id}`
    return {
      id: rowId,
      type: 'Stack' as const,
      name: variant.name,
      locked: !rowActive,
      props: {
        direction: 'column',
        gap: 'sm',
        align: 'start',
        'data-master-variant-chrome': 'true',
        'data-master-variant-active': rowActive ? 'true' : 'false',
        'data-matrix-row': variant.id,
      },
      children: [
        {
          id: `${rowId}:label`,
          type: 'Text' as const,
          name: variant.name,
          locked: true,
          props: {
            children: rowActive ? `Editing · ${variant.name}` : variant.name,
            role: 'meta',
            'data-master-variant-label': 'true',
            'data-matrix-row': variant.id,
          },
        },
        {
          id: `${rowId}:bps`,
          type: 'Stack' as const,
          name: `${variant.name} breakpoints`,
          locked: false,
          props: {
            direction: 'row',
            gap: 'md',
            align: 'start',
            'data-matrix-bp-strip': 'true',
            'data-matrix-row': variant.id,
          },
          children: tiles,
        },
      ],
    }
  })

  return {
    id: MATRIX_BOARD_ID,
    type: 'Stack',
    name: 'Variant × Breakpoint matrix',
    locked: true,
    props: {
      direction: 'column',
      gap: 'lg',
      align: 'start',
      'data-master-bp-matrix': 'true',
    },
    children: rows,
  }
}

export type MatrixBoardClick =
  | { kind: 'variant'; variantId: string }
  | { kind: 'cell'; variantId: string; bp: DigitalEditorBreakpoint; nodeId?: string }
  | null

export function resolveMatrixBoardClick(nodeId: SceneNodeId): MatrixBoardClick {
  const remapped = parseMatrixRemappedId(nodeId)
  if (remapped) {
    return {
      kind: 'cell',
      variantId: remapped.variantId,
      bp: remapped.bp,
      nodeId: remapped.nodeId,
    }
  }
  if (nodeId.startsWith('__bp-tile:')) {
    const rest = nodeId.slice('__bp-tile:'.length)
    const parts = rest.split(':')
    if (parts.length >= 2) {
      const variantId = parts[0]!
      const bp = parts[1]!
      if (bp === 'desktop' || bp === 'tablet' || bp === 'mobile') {
        return { kind: 'cell', variantId, bp }
      }
    }
  }
  if (nodeId.startsWith(MATRIX_ROW_PREFIX)) {
    const variantId = nodeId.slice(MATRIX_ROW_PREFIX.length).split(':')[0]
    if (variantId) return { kind: 'variant', variantId }
  }
  return null
}
