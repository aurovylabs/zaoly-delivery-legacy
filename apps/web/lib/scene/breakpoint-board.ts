/**
 * Ephemeral Desktop / Tablet / Mobile compare board — Wave A.
 * Spec: specs/domain/responsive-breakpoint-board.md
 */
import type { SceneBreakpointId, SceneNode, SceneNodeId } from '@zaoly/contracts'
import {
  EDITOR_BREAKPOINT_WIDTHS,
  type DigitalEditorBreakpoint,
} from './breakpoints'

export type { DigitalEditorBreakpoint }

export const BREAKPOINT_BOARD_ID = '__breakpoint-board__'
export const BREAKPOINT_BOARD_TILE_PREFIX = '__bp-tile:'
/** Remapped ids: `__bp-node:{bp}/{originalId}` */
export const BREAKPOINT_BOARD_NODE_PREFIX = '__bp-node:'

export const BREAKPOINT_COMPARE_BPS: readonly DigitalEditorBreakpoint[] = [
  'desktop',
  'tablet',
  'mobile',
]

export function isBreakpointBoardId(id: SceneNodeId | null | undefined): boolean {
  if (!id) return false
  return (
    id === BREAKPOINT_BOARD_ID ||
    id.startsWith(BREAKPOINT_BOARD_TILE_PREFIX) ||
    id.startsWith(BREAKPOINT_BOARD_NODE_PREFIX)
  )
}

export function breakpointBoardTileId(bp: DigitalEditorBreakpoint): string {
  return `${BREAKPOINT_BOARD_TILE_PREFIX}${bp}`
}

export function breakpointFromTileId(id: SceneNodeId): DigitalEditorBreakpoint | null {
  if (!id.startsWith(BREAKPOINT_BOARD_TILE_PREFIX)) return null
  const bp = id.slice(BREAKPOINT_BOARD_TILE_PREFIX.length).split(':')[0]
  if (bp === 'desktop' || bp === 'tablet' || bp === 'mobile') return bp
  return null
}

export function remapBreakpointBoardNodeId(
  bp: DigitalEditorBreakpoint,
  nodeId: SceneNodeId,
): string {
  return `${BREAKPOINT_BOARD_NODE_PREFIX}${bp}/${nodeId}`
}

export function parseBreakpointBoardRemappedId(
  id: SceneNodeId,
): { bp: DigitalEditorBreakpoint; nodeId: SceneNodeId } | null {
  if (!id.startsWith(BREAKPOINT_BOARD_NODE_PREFIX)) return null
  const rest = id.slice(BREAKPOINT_BOARD_NODE_PREFIX.length)
  const slash = rest.indexOf('/')
  if (slash <= 0) return null
  const bp = rest.slice(0, slash)
  const nodeId = rest.slice(slash + 1)
  if ((bp !== 'desktop' && bp !== 'tablet' && bp !== 'mobile') || !nodeId) return null
  return { bp, nodeId }
}

function remapTreeIds(node: SceneNode, bp: DigitalEditorBreakpoint): SceneNode {
  const next: SceneNode = {
    ...node,
    id: remapBreakpointBoardNodeId(bp, node.id),
  }
  if (node.children?.length) {
    next.children = node.children.map((c) => remapTreeIds(c, bp))
  }
  return next
}

export type BreakpointBoardLabels = Record<DigitalEditorBreakpoint, string>

export type BuildBreakpointCompareBoardOptions = {
  labels: BreakpointBoardLabels
  /** Optional min height for tile bodies (CSS px). */
  minHeight?: number
  /**
   * Wave G/H — localized “Primary” marker for the OP-9 base tile.
   * When omitted, primary tile still sets `data-breakpoint-primary` without suffix text.
   */
  primaryLabel?: string
  /** Wave H — which digital BP is the cascade base (default desktop). */
  primaryBreakpoint?: DigitalEditorBreakpoint
}

/**
 * Paint tree: three tiles of the same page root, cascaded per tile at paint time.
 * Active tile keeps persisted ids; inactive tiles remap ids for unique DOM ids.
 */
export function buildBreakpointCompareBoard(
  pageRoot: SceneNode,
  activeBreakpoint: SceneBreakpointId,
  options: BuildBreakpointCompareBoardOptions,
): SceneNode {
  const activeDigital: DigitalEditorBreakpoint =
    activeBreakpoint === 'tablet' || activeBreakpoint === 'mobile'
      ? activeBreakpoint
      : 'desktop'

  const primaryBp: DigitalEditorBreakpoint =
    options.primaryBreakpoint === 'tablet' || options.primaryBreakpoint === 'mobile'
      ? options.primaryBreakpoint
      : 'desktop'
  const tiles = BREAKPOINT_COMPARE_BPS.map((bp) => {
    const isActive = bp === activeDigital
    const isPrimary = bp === primaryBp
    const width = EDITOR_BREAKPOINT_WIDTHS[bp]
    const bodySource = structuredClone(pageRoot)
    const body = isActive ? bodySource : remapTreeIds(bodySource, bp)
    const tileId = breakpointBoardTileId(bp)
    const label = options.labels[bp]
    const displayLabel =
      isPrimary && options.primaryLabel
        ? `${label} · ${options.primaryLabel}`
        : label
    return {
      id: tileId,
      type: 'Stack' as const,
      name: displayLabel,
      locked: !isActive,
      props: {
        direction: 'column',
        gap: 'sm',
        align: 'start',
        'data-breakpoint-chrome': 'true',
        'data-breakpoint-tile': bp,
        'data-breakpoint-active': isActive ? 'true' : 'false',
        'data-breakpoint-paint': bp,
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
            children: isActive ? `Editing · ${displayLabel}` : displayLabel,
            role: 'meta',
            'data-breakpoint-label': 'true',
            'data-breakpoint-active': isActive ? 'true' : 'false',
            'data-breakpoint-tile': bp,
            ...(isPrimary ? { 'data-breakpoint-primary': 'true' } : {}),
          },
        },
        {
          id: `${tileId}:body`,
          type: 'Stack' as const,
          name: `${label} body`,
          locked: !isActive,
          props: {
            direction: 'column',
            align: 'stretch',
            'data-breakpoint-body': 'true',
            'data-breakpoint-paint': bp,
            ...(isActive ? { 'data-breakpoint-body-active': 'true' } : {}),
          },
          style: {
            width: '100%',
            minHeight: options.minHeight ?? 240,
            boxSizing: 'border-box' as const,
          },
          children: [
            {
              ...body,
              props: {
                ...(body.props ?? {}),
                'data-breakpoint-paint': bp,
              },
              style: {
                ...(body.style ?? {}),
                width: '100%',
                boxSizing: 'border-box',
              },
            },
          ],
        },
      ],
    }
  })

  return {
    id: BREAKPOINT_BOARD_ID,
    type: 'Stack',
    name: 'Breakpoint compare',
    locked: true,
    props: {
      direction: 'row',
      gap: 'xl',
      align: 'start',
      wrap: 'wrap',
      'data-breakpoint-board': 'true',
    },
    children: tiles,
  }
}

export function computeBreakpointBoardCanvasSize(
  activeBreakpoint: SceneBreakpointId,
  minHeight: number,
): { width: number; height: number } {
  const gap = 48
  const chromePad = 48
  const widths = BREAKPOINT_COMPARE_BPS.map((bp) => EDITOR_BREAKPOINT_WIDTHS[bp])
  const width = widths.reduce((a, b) => a + b, 0) + gap * (widths.length - 1) + chromePad
  void activeBreakpoint
  return { width, height: Math.max(minHeight + 80, 480) }
}

/**
 * Map a compare-board click to select-in-active or activate-breakpoint.
 */
export function resolveBreakpointBoardClick(
  clickedId: SceneNodeId,
  activeBreakpoint: SceneBreakpointId,
):
  | { type: 'select'; nodeId: SceneNodeId }
  | { type: 'activate'; breakpoint: DigitalEditorBreakpoint; selectId?: SceneNodeId }
  | { type: 'noop' } {
  if (clickedId === BREAKPOINT_BOARD_ID) return { type: 'noop' }

  const remapped = parseBreakpointBoardRemappedId(clickedId)
  if (remapped) {
    if (remapped.bp === activeBreakpoint || (activeBreakpoint === 'print' && remapped.bp === 'desktop')) {
      return { type: 'select', nodeId: remapped.nodeId }
    }
    return { type: 'activate', breakpoint: remapped.bp, selectId: remapped.nodeId }
  }

  // Tile / label / body chrome: `__bp-tile:tablet`, `__bp-tile:tablet:label`, …
  const chromeBp = breakpointFromTileId(clickedId)
  if (chromeBp) {
    const activeDigital: DigitalEditorBreakpoint =
      activeBreakpoint === 'tablet' || activeBreakpoint === 'mobile'
        ? activeBreakpoint
        : 'desktop'
    if (chromeBp === activeDigital) return { type: 'noop' }
    return { type: 'activate', breakpoint: chromeBp }
  }

  // Real id inside active tile body
  return { type: 'select', nodeId: clickedId }
}
