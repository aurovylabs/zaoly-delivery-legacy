'use client'

import type { CSSProperties, DragEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import { createElement, memo, useEffect, useMemo, useRef, useState } from 'react'
import { useSceneNodeSelected } from '../lib/editor/use-scene-node-selected'
import { useSceneNodePeerHalo } from '../lib/editor/use-scene-node-peer-halo'
import { useSceneNodeCompareGhost } from '../lib/editor/use-scene-node-compare-ghost'
import type { SceneBreakpointId, SceneNode } from '@zaoly/contracts'
import {
  extendableCssProperty,
  genericCatalogInspectProps,
  getComponentContract,
  isExtendablePrimitiveProp,
} from '@zaoly/contracts'
import {
  Accordion,
  AddTile,
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardActions,
  ChannelLane,
  ChannelStack,
  Chart,
  Checkbox,
  Chip,
  COMPONENT_PALETTE_DND_MIME,
  LAYERS_PANEL_DND_MIME,
  Divider,
  EmptyState,
  EntityCard,
  EventFooter,
  Field,
  FilterRow,
  FormSection,
  Gauge,
  Grid,
  Heading,
  Hint,
  Image,
  Input,
  Lede,
  Link,
  LoadingText,
  Meter,
  MetricChip,
  PageTitle,
  Panel,
  PrintChip,
  PrintChipRow,
  PrintCallout,
  PrintPage,
  PrintScoreRing,
  PrintTwoColumn,
  RankedList,
  RankedRow,
  ScrollArea,
  normalizePrintChipTone,
  normalizePrintCalloutVariant,
  normalizePrintColumnAlignList,
  normalizePrintStepsEmphasisIndex,
  normalizePrintStepsOrientation,
  SectionChrome,
  Select,
  Slider,
  Spacer,
  Spinner,
  Stack,
  StatusDot,
  StepStrip,
  StepStripItem,
  Switch,
  Tabs,
  TagInput,
  Text,
  Textarea,
  ToggleGroup,
  TopStatus,
  type AccordionItem,
  type ChartPoint,
  type ChartVariant,
  type GaugeTone,
  type SelectOption,
  isChartVariant,
  type TabItem,
  type ToggleOption,
} from '@zaoly/ui'
import { catalogComponent } from '@zaoly/ui/catalog-registry'
import { siteKitComponent } from '../lib/site-kit/registry'
import {
  ensureSiteKitLayoutPaint,
  resolveSiteKitGapCss,
} from '../lib/site-kit/sync-tree'
import { paths } from '../lib/paths'
import { tokenChannelForNode } from '../lib/inspect/digital-css'
import { partitionSlottedChildren, slotOf, slotPlainText, type SceneSlotKey } from '../lib/scene/slots'
import {
  cssGapLiteral,
  layoutGapFromBindings,
  resolveNodePaintStyle,
} from '../lib/inspect/resolve-bindings'
import { previewForBinding, tokenByPath } from '../lib/inspect/token-catalog'
import { useInspectTokenCatalog } from '../lib/inspect/token-catalog-context'
import { useCollectionDataResolve } from '../lib/collection-data/collection-data-context'
import { useInteractiveState } from '../lib/inspect/interactive-state-context'
import { cascadeNodeForBreakpoint } from '../lib/scene/cascade'
import { cascadeNodeHidden } from '../lib/scene/breakpoint-visibility'
import { usePrimaryBreakpoint } from '../lib/scene/primary-breakpoint-context'
import { cascadeNodeForState, writesToStateOverride } from '../lib/scene/state-cascade'
import { sceneNodeViewPropsAreEqual } from '../lib/scene/scene-node-view-memo'
import {
  canInlineEditCanvasNode,
  isInlineLabelShellType,
  isTextLeafNodeType,
} from '../lib/scene/text-ink-bounds'
import { shouldStartBoardFrameDrag, isSceneBoardNodeId } from '../lib/scene/scene-board'
import { InlineCanvasTextEdit } from './editor/inline-canvas-text-edit'
import {
  dropEdgeFromPoint,
  isSceneContainerType,
  type PaletteDropEdge,
} from '../lib/scene/ops'
import {
  brandTokenPayloadFromDrop,
  getActiveBrandTokenDrag,
  hasBrandTokenDrag,
  planTokenDrop,
  setActiveBrandTokenDrag,
  type BrandTokenDragPayload,
} from '../lib/inspect/token-drop'
import { mediaNodeHostStyle } from '../lib/editor/media-node-host-style'
import { catalogGenericGrainPaint } from '../lib/scene/catalog-generic-grain'
import { printChipSurfacePaint } from '../lib/scene/print-chip-surface'
import { resolveChartSeriesColors } from '../lib/chart-studio/resolve-colors'
import { printSurfaceGrainPaint } from '../lib/scene/print-surface-grain'
import { printTableFromProps } from '../lib/scene/print-table'

const GENERIC_INSPECT_STYLE_NAMES = new Set(genericCatalogInspectProps().map((p) => p.name))

function genericCatalogProps(props: Record<string, unknown>): Record<string, unknown> {
  const next: Record<string, unknown> = {}
  const style: Record<string, string | number> = {}
  if (props.style && typeof props.style === 'object') {
    Object.assign(style, props.style as Record<string, string | number>)
  }
  for (const [key, value] of Object.entries(props)) {
    if (value == null || key === 'style') continue
    const kind = typeof value
    // SiteChart fixture series may be a point[] until Inspect rewrites it as text.
    if (key === 'data' && Array.isArray(value)) {
      next[key] = value
      continue
    }
    // SiteChart mark map — object prop for Chart studio Marks.
    if (key === 'chartStyle' && typeof value === 'object' && !Array.isArray(value)) {
      next[key] = value
      continue
    }
    if (kind !== 'string' && kind !== 'number' && kind !== 'boolean') continue
    if (isExtendablePrimitiveProp(key) && typeof value === 'string') {
      const css = extendableCssProperty(key)
      if (css) style[css] = value
      continue
    }
    if (GENERIC_INSPECT_STYLE_NAMES.has(key)) continue
    next[key] = value
  }
  if (Object.keys(style).length) next.style = style
  return next
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** HTML-import pseudo decor (`::before` / `::after`) — out of flex flow in the canvas. */
function isHtmlPseudoDecorNode(node: SceneNode): boolean {
  return node.name === '::before' || node.name === '::after'
}

function hasPaletteDrag(transfer: DataTransfer): boolean {
  const types = Array.from(transfer.types)
  return types.includes(COMPONENT_PALETTE_DND_MIME) || types.includes('text/plain')
}

function paletteTypeFromDrop(transfer: DataTransfer): string {
  return (
    transfer.getData(COMPONENT_PALETTE_DND_MIME) || transfer.getData('text/plain') || ''
  ).trim()
}

function hasLayerPanelDrag(transfer: DataTransfer): boolean {
  const types = Array.from(transfer.types)
  if (types.includes(COMPONENT_PALETTE_DND_MIME)) return false
  // Browsers often hide custom MIME during dragover — accept text/plain too (LayersPanel).
  return (
    types.includes(LAYERS_PANEL_DND_MIME) ||
    types.includes('text/plain') ||
    types.includes('Text')
  )
}

function layerIdFromDrop(transfer: DataTransfer): string {
  const custom = transfer.getData(LAYERS_PANEL_DND_MIME).trim()
  if (custom) return custom
  // text/plain is shared with palette drops — only fall back when not a palette drag.
  if (transfer.getData(COMPONENT_PALETTE_DND_MIME)) return ''
  return transfer.getData('text/plain').trim()
}

function pageIdFromFrameHost(el: HTMLElement): string {
  const frame = el.closest('[data-page-frame-chrome="true"]')
  if (!(frame instanceof HTMLElement)) return ''
  return frame.getAttribute('data-page-id')?.trim() || ''
}

function layerDropPositionFromEdge(edge: PaletteDropEdge): 'before' | 'after' | 'into' {
  if (edge === 'before') return 'before'
  if (edge === 'after') return 'after'
  return 'into'
}

function dropGhostLabel(edge: PaletteDropEdge, valid: boolean): string {
  if (!valid) return "Can't drop"
  if (edge === 'into') return 'Drop into'
  if (edge === 'before') return 'Drop before'
  return 'Drop after'
}

function clearDropFeedback(el: HTMLElement) {
  delete el.dataset.dropEdge
  delete el.dataset.dropValid
  delete el.dataset.dropLabel
}

function applyDropFeedback(
  el: HTMLElement,
  edge: PaletteDropEdge,
  valid: boolean,
  transfer: DataTransfer,
  label?: string,
) {
  el.dataset.dropEdge = edge
  el.dataset.dropValid = valid ? 'true' : 'false'
  el.dataset.dropLabel = label ?? dropGhostLabel(edge, valid)
  transfer.dropEffect = valid ? 'copy' : 'none'
}

/** Leaf Text/Heading: paint type enums on the element (wrap inheritance alone loses to DS role CSS). */
function leafTextPaintStyle(props: Record<string, unknown>): CSSProperties {
  const style: CSSProperties = {}
  const textAlign = props.textAlign
  if (typeof textAlign === 'string' && textAlign) {
    style.textAlign = textAlign as CSSProperties['textAlign']
  }
  const textTransform = props.textTransform
  if (typeof textTransform === 'string' && textTransform) {
    style.textTransform = textTransform as CSSProperties['textTransform']
  }
  const textDecoration = props.textDecoration
  if (typeof textDecoration === 'string' && textDecoration) {
    style.textDecoration = textDecoration
  }
  return style
}

function selectOptionsFromProps(props: Record<string, unknown>): SelectOption[] {
  const raw = props.options
  if (!Array.isArray(raw) || !raw.length) {
    return [
      { value: 'a', label: 'Option A' },
      { value: 'b', label: 'Option B' },
    ]
  }
  const options: SelectOption[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const row = item as { value?: unknown; label?: unknown }
    if (typeof row.value !== 'string' || !row.value.trim()) continue
    options.push({
      value: row.value,
      label: typeof row.label === 'string' ? row.label : row.value,
    })
  }
  return options.length
    ? options
    : [
        { value: 'a', label: 'Option A' },
        { value: 'b', label: 'Option B' },
      ]
}

function numProp(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return fallback
}

/** Fixture ChartPoint[] from scene props — invalid entries dropped. Spec: editor-palette-charts.md */
function chartPointsFromProps(value: unknown): ChartPoint[] {
  if (!Array.isArray(value)) return []
  const out: ChartPoint[] = []
  for (const row of value) {
    if (!row || typeof row !== 'object') continue
    const label = String((row as { label?: unknown }).label ?? '').trim()
    const raw = (row as { value?: unknown }).value
    const n =
      typeof raw === 'number'
        ? raw
        : typeof raw === 'string' && raw.trim() !== ''
          ? Number(raw)
          : NaN
    if (!label || !Number.isFinite(n)) continue
    out.push({ label, value: n })
  }
  return out
}

function slottedPaint(kidsById: Map<string, ReactNode>, children: SceneNode[] | undefined) {
  const { slots, body } = partitionSlottedChildren(children)
  const slotKids = (slot: SceneSlotKey) => {
    const nodes = (slots[slot] ?? [])
      .map((child) => kidsById.get(child.id))
      .filter((kid): kid is NonNullable<typeof kid> => kid != null)
    return nodes.length ? nodes : undefined
  }
  const bodyKids = body
    .map((child) => kidsById.get(child.id))
    .filter((kid): kid is NonNullable<typeof kid> => kid != null)
  return { slotKids, bodyKids }
}

function tabItemsFromProps(props: Record<string, unknown>): TabItem[] {
  const raw = props.items
  if (!Array.isArray(raw) || !raw.length) {
    return [
      { id: 'a', label: 'Tab A', panel: 'Panel A' },
      { id: 'b', label: 'Tab B', panel: 'Panel B' },
    ]
  }
  const items: TabItem[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const row = item as { id?: unknown; label?: unknown; panel?: unknown }
    if (typeof row.id !== 'string' || !row.id.trim()) continue
    items.push({
      id: row.id,
      label: typeof row.label === 'string' ? row.label : row.id,
      panel: typeof row.panel === 'string' ? row.panel : '',
    })
  }
  return items.length
    ? items
    : [
        { id: 'a', label: 'Tab A', panel: 'Panel A' },
        { id: 'b', label: 'Tab B', panel: 'Panel B' },
      ]
}

function accordionItemsFromProps(props: Record<string, unknown>): AccordionItem[] {
  const raw = props.items
  if (!Array.isArray(raw) || !raw.length) {
    return [
      { id: 'a', title: 'Section A', preview: 'Preview A', panel: 'Body A' },
      { id: 'b', title: 'Section B', preview: 'Preview B', panel: 'Body B' },
    ]
  }
  const items: AccordionItem[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const row = item as { id?: unknown; title?: unknown; preview?: unknown; panel?: unknown }
    if (typeof row.id !== 'string' || !row.id.trim()) continue
    items.push({
      id: row.id,
      title: typeof row.title === 'string' ? row.title : row.id,
      preview: typeof row.preview === 'string' ? row.preview : undefined,
      panel: typeof row.panel === 'string' ? row.panel : '',
    })
  }
  return items.length
    ? items
    : [
        { id: 'a', title: 'Section A', preview: 'Preview A', panel: 'Body A' },
        { id: 'b', title: 'Section B', preview: 'Preview B', panel: 'Body B' },
      ]
}

function tagsFromProps(props: Record<string, unknown>): string[] {
  const raw = props.tags ?? props.value
  if (!Array.isArray(raw) || !raw.length) return ['alpha', 'beta']
  const tags = raw.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
  return tags.length ? tags : ['alpha', 'beta']
}

function toggleOptionsFromProps(props: Record<string, unknown>): ToggleOption[] {
  const raw = props.options
  if (!Array.isArray(raw) || !raw.length) {
    return [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ]
  }
  const options: ToggleOption[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const row = item as { value?: unknown; label?: unknown }
    if (typeof row.value !== 'string' || !row.value.trim()) continue
    options.push({
      value: row.value,
      label: typeof row.label === 'string' ? row.label : row.value,
    })
  }
  return options.length
    ? options
    : [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ]
}

const PANEL_ROLES = [
  'foresight',
  'research',
  'waves',
  'signals',
  'sources',
  'ops',
  'corpus',
  'pipeline',
] as const

type ListPaintContext = {
  parentType?: string
  startIndex?: number
  bodyIndex?: number
  divergingDomain?: number
  ledgerMax?: number
  donutTotal?: number
  /** P92 PrintTable per-column text-align */
  columnAlign?: Array<'left' | 'center' | 'right'>
  /** P92 PrintSteps emphasis (0-based) */
  emphasisIndex?: number
}
function bodyRowLabel(child: SceneNode): string {
  return (
    slotPlainText(child.children, 'label') ??
    (typeof child.props?.children === 'string' && child.props.children.trim()
      ? child.props.children
      : child.type)
  )
}

function padRankIndex(index: number): string {
  const n = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0
  return String(n).padStart(2, '0')
}

function formatSigned(value: number): string {
  const rounded = Math.round(value * 100) / 100
  const text = Number.isInteger(rounded) ? String(rounded) : String(rounded)
  return value > 0 ? `+${text}` : text
}

function traitPctFromScore(score: number): number {
  return Math.round(score <= 1 ? score * 100 : score)
}

/** Pinned DS PrintLedger tones (`printMagColors`) — compose locally; do not bump DS. */
const PRINT_LEDGER_TONES = {
  neg: '#c23b2a',
  warn: '#b45309',
  accentInk: '#007a33',
} as const

/** Pinned DS donut swatches (`printMagColors.donut`) — compose center + slice RankedRows (P59). */
const PRINT_DONUT_COLORS = [
  '#141414',
  '#00ca55',
  '#5a5a5a',
  '#9a9a9a',
  '#c23b2a',
  '#3a7bd5',
  '#b45309',
  '#6b6b6b',
] as const

function divergingDomainFromBody(children: SceneNode[] | undefined): number {
  const { body } = partitionSlottedChildren(children)
  const peak = body.reduce((max, child) => Math.max(max, Math.abs(numProp(slotPlainText(child.children, 'value'), 0))), 0)
  return Math.max(1, peak)
}

function optionalString(value: unknown): string | undefined {
  return value != null && String(value) !== '' ? String(value) : undefined
}

function printDonutSlicesFromNode(
  node: SceneNode,
  props: Record<string, unknown>,
): Array<{ id: string; label: string; value: number }> {
  const { body } = partitionSlottedChildren(node.children)
  const rows = body.filter((child) => child.type === 'RankedRow')
  if (rows.length) {
    return rows.map((child) => ({
      id: child.id,
      label: slotPlainText(child.children, 'label') ?? child.id,
      value: numProp(slotPlainText(child.children, 'value'), 0),
    }))
  }
  return printDonutSlicesFromProps(props)
}

function printDonutSlicesFromProps(
  props: Record<string, unknown>,
): Array<{ id: string; label: string; value: number }> {
  const raw = props.slices
  if (!Array.isArray(raw) || !raw.length) {
    return [
      { id: 'a', label: 'A', value: 40 },
      { id: 'b', label: 'B', value: 32 },
    ]
  }
  const items: Array<{ id: string; label: string; value: number }> = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const row = item as { id?: unknown; label?: unknown; value?: unknown }
    if (typeof row.id !== 'string' || !row.id.trim()) continue
    items.push({
      id: row.id,
      label: typeof row.label === 'string' ? row.label : row.id,
      value: numProp(row.value, 0),
    })
  }
  return items.length
    ? items
    : [
        { id: 'a', label: 'A', value: 40 },
        { id: 'b', label: 'B', value: 32 },
      ]
}

function printDonutStops(slices: Array<{ id: string; label: string; value: number }>): {
  positive: Array<{ id: string; label: string; value: number }>
  total: number
  stops: string[]
} {
  const positive = slices.filter((s) => s.value > 0)
  const total = positive.reduce((sum, s) => sum + s.value, 0) || 1
  let acc = 0
  const stops: string[] = []
  positive.forEach((slice, i) => {
    const start = (acc / total) * 100
    acc += slice.value
    const end = (acc / total) * 100
    const color = PRINT_DONUT_COLORS[Math.min(i, PRINT_DONUT_COLORS.length - 1)]
    stops.push(`${color} ${start}% ${end}%`)
  })
  return { positive, total, stops }
}

export type SceneNodeViewProps = {
  node: SceneNode
  onSelect: (id: string, event?: { shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean }) => void
  onPaletteDrop?: (type: string, targetId: string, edge: PaletteDropEdge) => void
  /** Optional live validity check for palette→canvas drop chrome (P63). */
  evaluatePaletteDrop?: (targetId: string, edge: PaletteDropEdge) => boolean
  /** CT-19: Token Studio leaf → bind default Inspect field. */
  onTokenDrop?: (payload: BrandTokenDragPayload, targetId: string) => void
  evaluateTokenDrop?: (payload: BrandTokenDragPayload, targetId: string) => boolean
  onLayerPanelDrop?: (
    draggedId: string,
    targetId: string,
    position: 'before' | 'after' | 'into',
  ) => void
  onLayerPanelDropToPage?: (draggedId: string, pageId: string) => void
  /** Live validity for layer/canvas cross-page drops (P82 Wave A). */
  evaluateLayerDrop?: (targetId: string, edge: PaletteDropEdge) => boolean
  evaluateLayerDropToPage?: (pageId: string) => boolean
  onLayerDragStart?: (nodeId: string) => void
  onLayerDragEnd?: () => void
  /** When true (scene board), content nodes start HTML5 DnD for cross-page moves. */
  enableCanvasNodeDrag?: boolean
  onSetProp?: (nodeId: string, key: string, value: unknown) => void
  onBoardFramePointerDown?: (pageId: string, event: ReactPointerEvent<HTMLElement>) => void
  /** Double-click inactive frame body → activate page and select page root (P81.1 Wave C). */
  onBoardFrameActivate?: (pageId: string) => void
  boardFrameDragBlocked?: boolean
  boardFrameDraggingPageId?: string | null
  activeBreakpoint?: SceneBreakpointId
  insidePrintPage?: boolean
  listPaint?: ListPaintContext
  onDropIndicatorChange?: (
    indicator: {
      visible: boolean
      edge: 'before' | 'after' | 'into' | null
      direction?: string
      rect: { left: number; top: number; width: number; height: number } | null
      label?: string
    } | null,
  ) => void
}

type SceneNodeViewInnerProps = SceneNodeViewProps & {
  selected: boolean
  compareGhost?: boolean
  peerHaloColor?: string | null
  peerHaloName?: string | null
}

function StepStripStepRow({
  child,
  index,
  nestedInsidePrint,
  onSelect,
  onPaletteDrop,
  evaluatePaletteDrop,
  onTokenDrop,
  evaluateTokenDrop,
  onSetProp,
  onBoardFramePointerDown,
  activeBreakpoint,
}: {
  child: SceneNode
  index: number
  nestedInsidePrint: boolean
  onSelect: SceneNodeViewProps['onSelect']
  onPaletteDrop?: SceneNodeViewProps['onPaletteDrop']
  evaluatePaletteDrop?: SceneNodeViewProps['evaluatePaletteDrop']
  onTokenDrop?: SceneNodeViewProps['onTokenDrop']
  evaluateTokenDrop?: SceneNodeViewProps['evaluateTokenDrop']
  onSetProp?: SceneNodeViewProps['onSetProp']
  onBoardFramePointerDown?: SceneNodeViewProps['onBoardFramePointerDown']
  activeBreakpoint: SceneBreakpointId
}) {
  const stepSelected = useSceneNodeSelected(child.id)
  return (
    <StepStripItem
      index={index}
      label={typeof child.name === 'string' && child.name ? child.name : child.type}
      selected={stepSelected}
    >
      <SceneNodeView
        node={child}
        onSelect={onSelect}
        onPaletteDrop={onPaletteDrop}
        evaluatePaletteDrop={evaluatePaletteDrop}
        onTokenDrop={onTokenDrop}
        evaluateTokenDrop={evaluateTokenDrop}
        onSetProp={onSetProp}
        onBoardFramePointerDown={onBoardFramePointerDown}
        activeBreakpoint={activeBreakpoint}
        insidePrintPage={nestedInsidePrint}
      />
    </StepStripItem>
  )
}

function SceneNodeViewInner({
  node,
  selected,
  compareGhost = false,
  peerHaloColor = null,
  peerHaloName = null,
  onSelect,
  onPaletteDrop,
  evaluatePaletteDrop,
  onTokenDrop,
  evaluateTokenDrop,
  onLayerPanelDrop,
  onLayerPanelDropToPage,
  evaluateLayerDrop,
  evaluateLayerDropToPage,
  onLayerDragStart,
  onLayerDragEnd,
  enableCanvasNodeDrag = false,
  onSetProp,
  onBoardFramePointerDown,
  onBoardFrameActivate,
  boardFrameDragBlocked = false,
  boardFrameDraggingPageId = null,
  activeBreakpoint = 'desktop',
  insidePrintPage = false,
  listPaint,
  onDropIndicatorChange,
}: SceneNodeViewInnerProps) {
  const catalog = useInspectTokenCatalog()
  const [editing, setEditing] = useState(false)
  const editRef = useRef<HTMLSpanElement | null>(null)
  useEffect(() => {
    if (!editing) return
    const el = editRef.current
    if (!el) return
    el.focus()
    const range = document.createRange()
    range.selectNodeContents(el)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
  }, [editing])

  const { activeState } = useInteractiveState()
  const primaryBreakpoint = usePrimaryBreakpoint()
  const paintBreakpoint =
    typeof node.props?.['data-breakpoint-paint'] === 'string'
      ? (node.props['data-breakpoint-paint'] as SceneBreakpointId)
      : activeBreakpoint
  const bpCascaded = cascadeNodeForBreakpoint(node, paintBreakpoint, primaryBreakpoint)
  /** Inspect state bar force-previews :hover/:focus/… on the selected node only. */
  const forceState =
    selected && writesToStateOverride(activeState) ? activeState : ('default' as const)
  const stateCascaded =
    forceState !== 'default'
      ? cascadeNodeForState(
          node,
          forceState,
          bpCascaded.props,
          bpCascaded.tokenBindings,
          (node.style ?? {}) as Record<string, string | number>,
        )
      : null
  const cascaded = stateCascaded
    ? {
        props: stateCascaded.props,
        tokenBindings: stateCascaded.tokenBindings,
        dataBindings: bpCascaded.dataBindings,
        overrideKeys: new Set([...bpCascaded.overrideKeys, ...stateCascaded.overrideKeys]),
        style: stateCascaded.style,
      }
    : {
        ...bpCascaded,
        style: (node.style ?? {}) as Record<string, string | number>,
      }
  const { applyToProps } = useCollectionDataResolve()
  const props = applyToProps(cascaded.props, cascaded.dataBindings)
  const childListPaint: ListPaintContext = useMemo(
    () => {
      const columnAlign =
        node.type === 'PrintTable'
          ? normalizePrintColumnAlignList(
              props.columnAlign,
              (() => {
                const { slots } = partitionSlottedChildren(node.children)
                const n = (slots.label ?? []).length
                return n > 0 ? n : printTableFromProps(props).columns.length
              })(),
            )
          : undefined
      const stepBody =
        node.type === 'PrintSteps'
          ? partitionSlottedChildren(node.children).body.filter((c) => c.type === 'RankedRow')
          : []
      return {
        parentType: node.type,
        startIndex:
          node.type === 'PrintRankedList'
            ? Math.max(1, Math.round(numProp(props.startIndex, 1)))
            : undefined,
        ledgerMax: node.type === 'PrintLedger' ? numProp(props.max, 100) : undefined,
        divergingDomain:
          node.type === 'DivergingBar' ? divergingDomainFromBody(node.children) : undefined,
        donutTotal:
          node.type === 'PrintDonut'
            ? printDonutStops(printDonutSlicesFromNode(node, props)).total
            : undefined,
        columnAlign,
        emphasisIndex:
          node.type === 'PrintSteps'
            ? normalizePrintStepsEmphasisIndex(props.emphasisIndex, stepBody.length)
            : undefined,
      }
    },
    [node.type, node.children, props],
  )

  if (cascadeNodeHidden(node, paintBreakpoint, primaryBreakpoint)) return null

  const tokenChannel = tokenChannelForNode(insidePrintPage, node.type)
  const style = resolveNodePaintStyle(
    cascaded.props,
    cascaded.tokenBindings,
    cascaded.style as CSSProperties,
    catalog,
    tokenChannel,
  )
  if (
    (node.type === 'Text' || node.type === 'Heading') &&
    (style.color == null || style.color === '')
  ) {
    const ink = tokenByPath('color.neutral.700', catalog)
    if (ink) style.color = previewForBinding(ink, 'color', tokenChannel)
  }
  const layoutGap = layoutGapFromBindings(props, cascaded.tokenBindings)
  const innerGap = cssGapLiteral(props)
  const nestedInsidePrint = insidePrintPage || node.type.startsWith('Print')
  const { body } = partitionSlottedChildren(node.children)
  const bodyIndexById = new Map(body.map((child, index) => [child.id, index]))
  const pseudoDecor = isHtmlPseudoDecorNode(node)
  const kids = (node.children ?? []).map((child) => (
    <SceneNodeView
      key={child.id}
      node={child}
      onSelect={onSelect}
      onPaletteDrop={onPaletteDrop}
      evaluatePaletteDrop={evaluatePaletteDrop}
      onTokenDrop={onTokenDrop}
      evaluateTokenDrop={evaluateTokenDrop}
      onLayerPanelDrop={onLayerPanelDrop}
      onLayerPanelDropToPage={onLayerPanelDropToPage}
      evaluateLayerDrop={evaluateLayerDrop}
      evaluateLayerDropToPage={evaluateLayerDropToPage}
      onLayerDragStart={onLayerDragStart}
      onLayerDragEnd={onLayerDragEnd}
      enableCanvasNodeDrag={enableCanvasNodeDrag}
      onSetProp={onSetProp}
      onBoardFramePointerDown={onBoardFramePointerDown}
      onBoardFrameActivate={onBoardFrameActivate}
      boardFrameDragBlocked={boardFrameDragBlocked}
      boardFrameDraggingPageId={boardFrameDraggingPageId}
      activeBreakpoint={paintBreakpoint}
      insidePrintPage={nestedInsidePrint}
      listPaint={{ ...childListPaint, bodyIndex: bodyIndexById.get(child.id) }}
      onDropIndicatorChange={onDropIndicatorChange}
    />
  ))
  const kidsById = new Map((node.children ?? []).map((child, index) => [child.id, kids[index]]))
  const { slotKids, bodyKids } = slottedPaint(kidsById, node.children)
  const printChipSurface = node.type === 'PrintChip' ? printChipSurfacePaint(style) : null
  const printGrain =
    node.type.startsWith('Print')
      ? printSurfaceGrainPaint(printChipSurface?.wrapStyle ?? style)
      : null
  const catalogGrain = !getComponentContract(node.type) ? catalogGenericGrainPaint(style) : null

  const wrap = (content: ReactNode, opts?: { paintOnSelf?: boolean; flowTransparent?: boolean }) => {
    const painted =
      !insidePrintPage && node.type !== 'PrintPage' && node.type.startsWith('Print') ? (
        <PrintPage folioTitle="beispiel.de" folioPage="1 — 8">
          {content}
        </PrintPage>
      ) : (
        content
      )
    const contentsPaint =
      (listPaint?.parentType === 'PrintTable' && (node.type === 'RankedRow' || node.type === 'Text')) ||
      (listPaint?.parentType === 'PrintDonut' && node.type === 'RankedRow')
    const canInlineEdit = canInlineEditCanvasNode(node)
    const isPageFrameChrome = node.props?.['data-page-frame-chrome'] === 'true'
    const isPageFrameActive = node.props?.['data-page-frame-active'] === 'true'
    const isPageFrameBody = node.props?.['data-page-frame-body'] === 'true'
    const isPageFrameLabel = node.props?.['data-page-frame-label'] === 'true'
    const pageFrameId = String(node.props?.['data-page-id'] ?? '')
    const isMasterVariantChrome = node.props?.['data-master-variant-chrome'] === 'true'
    const isMasterVariantActive = node.props?.['data-master-variant-active'] === 'true'
    const isMasterVariantLabel = node.props?.['data-master-variant-label'] === 'true'
    const isMasterVariantBody = node.props?.['data-master-variant-body'] === 'true'
    const isMasterVariantBodyActive =
      node.props?.['data-master-variant-body-active'] === 'true'
    const isMasterVariantAdd = node.props?.['data-master-variant-add'] === 'true'
    const isMasterVariantPlaceholder = node.props?.['data-master-variant-placeholder'] === 'true'
    const isMasterVariantAddHint = node.props?.['data-master-variant-add-hint'] === 'true'
    const isBreakpointChrome = node.props?.['data-breakpoint-chrome'] === 'true'
    const isBreakpointActive = node.props?.['data-breakpoint-active'] === 'true'
    const isBreakpointLabel = node.props?.['data-breakpoint-label'] === 'true'
    const isBreakpointBody = node.props?.['data-breakpoint-body'] === 'true'
    const isBreakpointBodyActive = node.props?.['data-breakpoint-body-active'] === 'true'
    const breakpointTile =
      typeof node.props?.['data-breakpoint-tile'] === 'string'
        ? String(node.props['data-breakpoint-tile'])
        : ''
    const isPageFrameDragging = Boolean(
      pageFrameId && boardFrameDraggingPageId && boardFrameDraggingPageId === pageFrameId,
    )
    const canCanvasDrag =
      enableCanvasNodeDrag &&
      Boolean(onLayerPanelDrop || onLayerPanelDropToPage) &&
      !node.locked &&
      !pseudoDecor &&
      !isSceneBoardNodeId(node.id) &&
      !isPageFrameChrome &&
      !isPageFrameLabel &&
      !isPageFrameBody
    const isPageDropSurface = isPageFrameChrome || isPageFrameBody || isPageFrameLabel
    /** Site Kit shells own flex/paint; wrap stays selection chrome only.
     * Media (SiteImage/SiteSvg) still need a host size mode so flex stretch
     * does not inflate the selection box to full artboard width when hugging. */
    const hostStyle = opts?.flowTransparent
      ? { display: 'contents' as const }
      : opts?.paintOnSelf
      ? mediaNodeHostStyle(node.type, style.width)
      : contentsPaint
        ? { ...(catalogGrain?.wrapStyle ?? style), display: 'contents' as const }
        : printGrain
          ? printGrain.wrapStyle
          : printChipSurface
            ? printChipSurface.wrapStyle
            : (catalogGrain?.wrapStyle ?? style)
    const peerHaloStyle =
      peerHaloColor && !selected
        ? ({
            ...(typeof hostStyle === 'object' && hostStyle ? hostStyle : {}),
            ['--creation-peer-halo' as string]: peerHaloColor,
          } as CSSProperties)
        : hostStyle

    return (
    <div
      className={cx(
        'creation-scene-node',
        selected && 'creation-scene-node--selected',
        compareGhost && !selected && 'creation-scene-node--bp-compare-ghost',
        peerHaloColor && !selected && 'creation-scene-node--peer-selected',
        node.locked && 'creation-scene-node--locked',
        canCanvasDrag && 'creation-scene-node--canvas-drag',
        isPageFrameChrome && 'creation-scene-page-frame',
        isPageFrameChrome && isPageFrameActive && 'creation-scene-page-frame--active',
        isPageFrameChrome && !isPageFrameActive && 'creation-scene-page-frame--inactive',
        isPageFrameChrome && isPageFrameDragging && 'creation-scene-page-frame--dragging',
        isPageFrameBody && 'creation-scene-page-frame__body',
        isPageFrameLabel && 'creation-scene-page-frame__label',
        isMasterVariantChrome && 'creation-scene-master-variant',
        isMasterVariantChrome &&
          isMasterVariantActive &&
          'creation-scene-master-variant--active',
        isMasterVariantChrome &&
          !isMasterVariantActive &&
          !isMasterVariantAdd &&
          !isMasterVariantPlaceholder &&
          'creation-scene-master-variant--inactive',
        isMasterVariantChrome &&
          isMasterVariantPlaceholder &&
          'creation-scene-master-variant--placeholder',
        isMasterVariantChrome && isMasterVariantAdd && 'creation-scene-master-variant--add',
        isMasterVariantLabel && 'creation-scene-master-variant__label',
        isMasterVariantLabel &&
          isMasterVariantActive &&
          'creation-scene-master-variant__label--active',
        isMasterVariantBody && 'creation-scene-master-variant__body',
        isMasterVariantBodyActive && 'creation-scene-master-variant__body--active',
        isMasterVariantAddHint && 'creation-scene-master-variant__add-hint',
        isBreakpointChrome && 'creation-scene-breakpoint-tile',
        isBreakpointChrome && isBreakpointActive && 'creation-scene-breakpoint-tile--active',
        isBreakpointChrome && !isBreakpointActive && 'creation-scene-breakpoint-tile--inactive',
        isBreakpointLabel && 'creation-scene-breakpoint-tile__label',
        isBreakpointLabel && isBreakpointActive && 'creation-scene-breakpoint-tile__label--active',
        isBreakpointBody && 'creation-scene-breakpoint-tile__body',
        isBreakpointBodyActive && 'creation-scene-breakpoint-tile__body--active',
        printChipSurface?.className,
        printGrain?.className,
        catalogGrain?.className,
      )}
      data-peer-halo={peerHaloName || undefined}
      data-bp-compare-ghost={compareGhost && !selected ? 'true' : undefined}
      data-node-id={node.id}
      data-node-type={node.type}
      data-force-state={forceState !== 'default' ? forceState : undefined}
      data-disabled={forceState === 'disabled' ? 'true' : undefined}
      data-pseudo-decor={pseudoDecor ? 'true' : undefined}
      aria-hidden={pseudoDecor ? true : undefined}
      data-page-frame-body={isPageFrameBody ? 'true' : undefined}
      data-page-frame-label={isPageFrameLabel ? 'true' : undefined}
      data-page-frame-chrome={isPageFrameChrome ? 'true' : undefined}
      data-page-id={pageFrameId || undefined}
      data-page-frame-active={
        isPageFrameChrome ? (isPageFrameActive ? 'true' : 'false') : undefined
      }
      data-master-variant-chrome={isMasterVariantChrome ? 'true' : undefined}
      data-master-variant-active={
        isMasterVariantChrome || isMasterVariantLabel
          ? isMasterVariantActive
            ? 'true'
            : 'false'
          : undefined
      }
      data-master-variant-label={isMasterVariantLabel ? 'true' : undefined}
      data-master-variant-body={isMasterVariantBody ? 'true' : undefined}
      data-master-variant-add={isMasterVariantAdd ? 'true' : undefined}
      data-master-variant-placeholder={isMasterVariantPlaceholder ? 'true' : undefined}
      data-breakpoint-chrome={isBreakpointChrome ? 'true' : undefined}
      data-breakpoint-active={
        isBreakpointChrome || isBreakpointLabel
          ? isBreakpointActive
            ? 'true'
            : 'false'
          : undefined
      }
      data-breakpoint-label={isBreakpointLabel ? 'true' : undefined}
      data-breakpoint-body={isBreakpointBody ? 'true' : undefined}
      data-breakpoint-tile={breakpointTile || undefined}
      data-node-locked={node.locked ? 'true' : undefined}
      aria-label={node.type === 'Chip' ? 'Chip' : undefined}
      data-print-surface-stroke={printChipSurface?.stroke ? 'true' : undefined}
      data-print-surface-radius={printChipSurface?.radius ? 'true' : undefined}
      data-print-surface-ink={printChipSurface?.ink ? 'true' : undefined}
      data-print-surface-fill={printChipSurface?.fill ? 'true' : undefined}
      data-print-surface-size={printChipSurface?.size ? 'true' : undefined}
      data-print-text-align={printGrain?.textAlign ? 'true' : undefined}
      data-print-justify={printGrain?.justifyContent ? 'true' : undefined}
      data-print-align-items={printGrain?.alignItems ? 'true' : undefined}
      data-print-typography={printGrain?.typography ? 'true' : undefined}
      data-print-block-align={printGrain?.blockAlign ? 'true' : undefined}
      data-catalog-fill={catalogGrain?.fill ? 'true' : undefined}
      data-catalog-radius={catalogGrain?.radius ? 'true' : undefined}
      data-catalog-stroke={catalogGrain?.stroke ? 'true' : undefined}
      data-catalog-typo={catalogGrain?.typography ? 'true' : undefined}
      draggable={canCanvasDrag}
      onDragStart={(e: DragEvent<HTMLDivElement>) => {
        if (!canCanvasDrag) return
        e.stopPropagation()
        e.dataTransfer.setData(LAYERS_PANEL_DND_MIME, node.id)
        e.dataTransfer.setData('text/plain', node.id)
        e.dataTransfer.effectAllowed = 'move'

        // P102: Floating Ghost Preview Badge [ ☷ Type: "Name" ]
        if (typeof document !== 'undefined') {
          const ghost = document.createElement('div')
          ghost.className = 'creation-canvas-ghost-preview'
          const label = node.name || (typeof node.props?.label === 'string' ? node.props.label : '') || node.type
          ghost.innerHTML = `<span>☷</span> <span>${node.type}: "${label.slice(0, 24)}"</span>`
          ghost.style.position = 'absolute'
          ghost.style.top = '-9999px'
          ghost.style.left = '-9999px'
          document.body.appendChild(ghost)
          if (e.dataTransfer.setDragImage) {
            e.dataTransfer.setDragImage(ghost, 24, 16)
          }
          setTimeout(() => {
            if (ghost.parentNode) ghost.parentNode.removeChild(ghost)
          }, 0)
        }

        onLayerDragStart?.(node.id)
        e.currentTarget.classList.add('creation-scene-node--dragging')
      }}
      onDragEnd={(e: DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('creation-scene-node--dragging')
        clearDropFeedback(e.currentTarget)
        onDropIndicatorChange?.(null)
        onLayerDragEnd?.()
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(node.id, {
          shiftKey: e.shiftKey,
          metaKey: e.metaKey,
          ctrlKey: e.ctrlKey,
        })
      }}
      onPointerDown={(e) => {
        if (e.button !== 0 || !onBoardFramePointerDown) return
        const pageId = isPageFrameChrome
          ? String(node.props?.['data-page-id'] ?? '')
          : isPageFrameLabel
            ? String(node.props?.['data-page-id'] ?? '')
            : ''
        if (!pageId) return
        const frameRoot = isPageFrameChrome
          ? e.currentTarget
          : (e.currentTarget.closest('[data-page-frame-chrome="true"]') as HTMLElement | null)
        if (!(frameRoot instanceof HTMLElement)) return
        if (
          !shouldStartBoardFrameDrag({
            isPageFrameChrome,
            isPageFrameLabel,
            frameDragBlocked: boardFrameDragBlocked,
            altKey: e.altKey,
            target: e.target as HTMLElement,
            frameRoot,
          })
        ) {
          return
        }
        onBoardFramePointerDown(pageId, e)
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        const inactivePageId =
          !isPageFrameActive && pageFrameId
            ? pageFrameId
            : isPageFrameBody && !isPageFrameActive
              ? String(node.props?.['data-page-id'] ?? '')
              : ''
        const isPlaceholder = node.props?.['data-page-frame-placeholder'] === 'true'
        if (onBoardFrameActivate && inactivePageId && (isPageFrameBody || isPlaceholder)) {
          onBoardFrameActivate(inactivePageId)
          return
        }
        onSelect(node.id, {
          shiftKey: e.shiftKey,
          metaKey: e.metaKey,
          ctrlKey: e.ctrlKey,
        })
        if (canInlineEdit && onSetProp) setEditing(true)
      }}
      onDragOver={(e: DragEvent<HTMLDivElement>) => {
        if (onTokenDrop && hasBrandTokenDrag(e.dataTransfer)) {
          e.preventDefault()
          e.stopPropagation()
          const payload = getActiveBrandTokenDrag()
          const plan = payload
            ? planTokenDrop(payload.type, node.type)
            : ({ ok: false, label: "Can't drop" } as const)
          const valid =
            Boolean(payload) &&
            plan.ok &&
            !node.locked &&
            (evaluateTokenDrop && payload ? evaluateTokenDrop(payload, node.id) : true)
          applyDropFeedback(
            e.currentTarget,
            'into',
            valid,
            e.dataTransfer,
            plan.ok && valid ? plan.label : "Can't drop",
          )
          return
        }
        if (onLayerPanelDropToPage && isPageDropSurface && hasLayerPanelDrag(e.dataTransfer)) {
          e.preventDefault()
          e.stopPropagation()
          const pageId =
            pageFrameId ||
            String(node.props?.['data-page-id'] ?? '') ||
            pageIdFromFrameHost(e.currentTarget)
          const valid = pageId
            ? evaluateLayerDropToPage
              ? evaluateLayerDropToPage(pageId)
              : true
            : false
          e.dataTransfer.dropEffect = valid ? 'move' : 'none'
          e.currentTarget.classList.remove('creation-scene-page-frame--layer-drop')
          e.currentTarget.classList.toggle(
            'creation-scene-page-frame--layer-drop',
            valid,
          )
          e.currentTarget.classList.toggle(
            'creation-scene-page-frame--layer-drop-invalid',
            !valid,
          )
          return
        }
        if (onLayerPanelDrop && hasLayerPanelDrag(e.dataTransfer)) {
          e.preventDefault()
          e.stopPropagation()
          const rect = e.currentTarget.getBoundingClientRect()
          const edge = dropEdgeFromPoint(
            isSceneContainerType(node.type),
            e.clientY,
            rect.top,
            rect.height,
            e.clientX,
            rect.left,
            rect.width,
            String(props.direction ?? ''),
          )
          const valid = evaluateLayerDrop
            ? evaluateLayerDrop(node.id, edge)
            : true
          applyDropFeedback(e.currentTarget, edge, valid, e.dataTransfer)
          if (onDropIndicatorChange) {
            const shell = e.currentTarget.closest<HTMLElement>('.creation-editor-canvas-shell')
            const vr = shell ? shell.getBoundingClientRect() : { left: 0, top: 0 }
            onDropIndicatorChange({
              visible: true,
              edge: valid ? edge : null,
              direction: String(props.direction ?? 'column'),
              rect: {
                left: rect.left - vr.left,
                top: rect.top - vr.top,
                width: rect.width,
                height: rect.height,
              },
              label: dropGhostLabel(edge, valid),
            })
          }
          return
        }
        if (!onPaletteDrop || !hasPaletteDrag(e.dataTransfer)) return
        e.preventDefault()
        e.stopPropagation()
        const rect = e.currentTarget.getBoundingClientRect()
        const edge = dropEdgeFromPoint(
          isSceneContainerType(node.type),
          e.clientY,
          rect.top,
          rect.height,
          e.clientX,
          rect.left,
          rect.width,
          String(props.direction ?? ''),
        )
        const valid = evaluatePaletteDrop
          ? evaluatePaletteDrop(node.id, edge)
          : !(node.locked && edge === 'into')
        applyDropFeedback(e.currentTarget, edge, valid, e.dataTransfer)
        if (onDropIndicatorChange) {
          const shell = e.currentTarget.closest<HTMLElement>('.creation-editor-canvas-shell')
          const vr = shell ? shell.getBoundingClientRect() : { left: 0, top: 0 }
          onDropIndicatorChange({
            visible: true,
            edge: valid ? edge : null,
            direction: String(props.direction ?? 'column'),
            rect: {
              left: rect.left - vr.left,
              top: rect.top - vr.top,
              width: rect.width,
              height: rect.height,
            },
            label: dropGhostLabel(edge, valid),
          })
        }
      }}
      onDragLeave={(e: DragEvent<HTMLDivElement>) => {
        const next = e.relatedTarget
        if (next instanceof Node && e.currentTarget.contains(next)) return
        e.currentTarget.classList.remove('creation-scene-page-frame--layer-drop')
        e.currentTarget.classList.remove('creation-scene-page-frame--layer-drop-invalid')
        clearDropFeedback(e.currentTarget)
        onDropIndicatorChange?.(null)
      }}
      onDrop={(e: DragEvent<HTMLDivElement>) => {
        onDropIndicatorChange?.(null)
        if (onTokenDrop && hasBrandTokenDrag(e.dataTransfer)) {
          e.preventDefault()
          e.stopPropagation()
          clearDropFeedback(e.currentTarget)
          const payload = brandTokenPayloadFromDrop(e.dataTransfer)
          setActiveBrandTokenDrag(null)
          if (!payload || node.locked) return
          const plan = planTokenDrop(payload.type, node.type)
          if (!plan.ok) return
          if (evaluateTokenDrop && !evaluateTokenDrop(payload, node.id)) return
          onTokenDrop(payload, node.id)
          return
        }
        const layerId = layerIdFromDrop(e.dataTransfer)
        if (layerId && onLayerPanelDropToPage && isPageDropSurface) {
          const pageId =
            pageFrameId ||
            String(node.props?.['data-page-id'] ?? '') ||
            pageIdFromFrameHost(e.currentTarget)
          if (pageId) {
            e.preventDefault()
            e.stopPropagation()
            e.currentTarget.classList.remove('creation-scene-page-frame--layer-drop')
            e.currentTarget.classList.remove('creation-scene-page-frame--layer-drop-invalid')
            clearDropFeedback(e.currentTarget)
            onLayerPanelDropToPage(layerId, pageId)
          }
          return
        }
        if (layerId && onLayerPanelDrop) {
          e.preventDefault()
          e.stopPropagation()
          const rect = e.currentTarget.getBoundingClientRect()
          const edge = dropEdgeFromPoint(
            isSceneContainerType(node.type),
            e.clientY,
            rect.top,
            rect.height,
            e.clientX,
            rect.left,
            rect.width,
            String(props.direction ?? ''),
          )
          clearDropFeedback(e.currentTarget)
          onLayerPanelDrop(layerId, node.id, layerDropPositionFromEdge(edge))
          return
        }
        if (!onPaletteDrop) return
        const type = paletteTypeFromDrop(e.dataTransfer)
        if (!type) return
        e.preventDefault()
        e.stopPropagation()
        const rect = e.currentTarget.getBoundingClientRect()
        const edge = dropEdgeFromPoint(
          isSceneContainerType(node.type),
          e.clientY,
          rect.top,
          rect.height,
          e.clientX,
          rect.left,
          rect.width,
          String(props.direction ?? ''),
        )
        clearDropFeedback(e.currentTarget)
        if (evaluatePaletteDrop && !evaluatePaletteDrop(node.id, edge)) return
        onPaletteDrop(type, node.id, edge)
      }}
      style={peerHaloStyle}
    >
      {peerHaloColor && !selected && peerHaloName ? (
        <span className="creation-scene-node__peer-chip" aria-hidden="true" data-testid="peer-lock-chip">
          {peerHaloName.startsWith('Locked') ? peerHaloName : `Locked · ${peerHaloName}`}
        </span>
      ) : null}
      {painted}
    </div>
    )
  }

  switch (node.type) {
    case 'Stack': {
      const dirRaw = String(props.direction ?? 'column')
      const stackDir = dirRaw.includes('row') ? 'row' : 'column'
      const reverse = dirRaw.endsWith('-reverse')
      return wrap(
        <Stack
          direction={stackDir}
          gap={layoutGap}
          align={props.align as CSSProperties['alignItems'] | undefined}
          justify={props.justify as CSSProperties['justifyContent'] | undefined}
          wrap={props.wrap === true || props.wrap === 'true'}
          style={{
            flexDirection: reverse ? (dirRaw as CSSProperties['flexDirection']) : undefined,
            alignContent: props.alignContent as CSSProperties['alignContent'] | undefined,
            gap: innerGap,
          }}
        >
          {kids}
        </Stack>,
      )
    }
    case 'Grid':
      return wrap(
        <Grid
          columns={
            typeof props.columns === 'number' || typeof props.columns === 'string'
              ? props.columns
              : 2
          }
          gap={layoutGap}
          style={{
            ...(innerGap != null ? { gap: innerGap } : null),
            ...(typeof props.gridTemplateColumns === 'string' && props.gridTemplateColumns.trim()
              ? { gridTemplateColumns: props.gridTemplateColumns.trim() }
              : null),
          }}
        >
          {kids}
        </Grid>,
      )
    case 'Card':
      return wrap(
        <Card
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: style.gap,
            justifyContent: style.justifyContent,
            alignItems: style.alignItems,
          }}
        >
          {kids.length ? kids : String(props.children ?? '')}
        </Card>,
      )
    case 'Button':
      return wrap(
        <Button
          type="button"
          variant={(props.variant as 'primary' | 'ghost' | 'subtle' | 'danger' | 'link') || 'primary'}
          size={(props.size as 'md') || 'md'}
          shape={(props.shape as 'square' | 'pill' | 'rounded' | 'default') || 'square'}
        >
          {editing && onSetProp && canInlineEditCanvasNode(node) ? (
            <InlineCanvasTextEdit
              editRef={editRef}
              value={String(props.children ?? 'Button')}
              onCommit={(text) => {
                onSetProp(node.id, 'children', text)
                setEditing(false)
              }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            (slotKids('label') ?? String(props.children ?? 'Button'))
          )}
        </Button>,
      )
    case 'Text':
      if (editing) {
        return wrap(
          <InlineCanvasTextEdit
            editRef={editRef}
            value={String(props.children ?? '')}
            style={leafTextPaintStyle(props)}
            onCommit={(text) => {
              onSetProp?.(node.id, 'children', text)
              setEditing(false)
            }}
            onCancel={() => setEditing(false)}
          />,
        )
      }
      return wrap(
        <Text
          role={(props.role as 'body') || 'body'}
          style={leafTextPaintStyle(props)}
        >
          {String(props.children ?? '')}
        </Text>,
      )
    case 'Heading': {
      const levelRaw = Number(props.level ?? 2)
      const level = ([1, 2, 3, 4, 5, 6].includes(levelRaw) ? levelRaw : 2) as 1 | 2 | 3 | 4 | 5 | 6
      if (editing) {
        return wrap(
          <InlineCanvasTextEdit
            editRef={editRef}
            value={String(props.children ?? 'Heading')}
            style={leafTextPaintStyle(props)}
            onCommit={(text) => {
              onSetProp?.(node.id, 'children', text)
              setEditing(false)
            }}
            onCancel={() => setEditing(false)}
          />,
        )
      }
      return wrap(
        <Heading level={level} style={leafTextPaintStyle(props)}>
          {String(props.children ?? 'Heading')}
        </Heading>,
      )
    }
    case 'Link':
      if (editing) {
        return wrap(
          <InlineCanvasTextEdit
            editRef={editRef}
            value={String(props.children ?? 'Link')}
            style={leafTextPaintStyle(props)}
            onCommit={(text) => {
              onSetProp?.(node.id, 'children', text)
              setEditing(false)
            }}
            onCancel={() => setEditing(false)}
          />,
        )
      }
      return wrap(
        <Link
          href={String(props.href ?? paths.routes.home)}
          onClick={(e) => e.preventDefault()}
        >
          {String(props.children ?? 'Link')}
        </Link>,
      )
    case 'Badge':
      return wrap(
        <Badge tone={(props.tone as 'neutral') || 'neutral'}>
          {editing && onSetProp && canInlineEditCanvasNode(node) ? (
            <InlineCanvasTextEdit
              editRef={editRef}
              value={String(props.children ?? 'Badge')}
              onCommit={(text) => {
                onSetProp(node.id, 'children', text)
                setEditing(false)
              }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            (slotKids('label') ?? String(props.children ?? 'Badge'))
          )}
        </Badge>,
      )
    case 'Spacer':
      return wrap(
        <Spacer
          size={(props.size as 'md') || 'md'}
          axis={(props.axis as 'y') || 'y'}
        />,
      )
    case 'Input':
      return wrap(
        <Input
          placeholder={String(props.placeholder ?? '')}
          defaultValue={props.value != null ? String(props.value) : undefined}
          readOnly
        />,
      )
    case 'Checkbox':
      return wrap(
        <Checkbox
          label={String(props.label ?? 'Checkbox')}
          defaultChecked={props.checked === true || props.checked === 'true'}
          readOnly
        />,
      )
    case 'Switch':
      return wrap(
        <Switch
          label={String(props.label ?? 'Switch')}
          checked={props.checked === true || props.checked === 'true'}
        />,
      )
    case 'Select':
      return wrap(
        <Select
          options={selectOptionsFromProps(props)}
          defaultValue={typeof props.value === 'string' ? props.value : undefined}
          placeholder={String(props.placeholder ?? 'Select')}
          size={props.size === 'md' ? 'md' : 'sm'}
        />,
      )
    case 'Textarea':
      return wrap(
        <Textarea
          placeholder={String(props.placeholder ?? '')}
          defaultValue={props.value != null ? String(props.value) : undefined}
          size={props.size === 'md' ? 'md' : 'sm'}
          readOnly
        />,
      )
    case 'Chip':
      return wrap(
        <Chip
          static={true}
          selected={props.selected === true || props.selected === 'true'}
          size={props.size === 'md' ? 'md' : 'sm'}
        >
          {editing && onSetProp && canInlineEditCanvasNode(node) ? (
            <InlineCanvasTextEdit
              editRef={editRef}
              value={String(props.children ?? 'Chip')}
              onCommit={(text) => {
                onSetProp(node.id, 'children', text)
                setEditing(false)
              }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            (slotKids('label') ?? String(props.children ?? 'Chip'))
          )}
        </Chip>,
      )
    case 'Divider':
      return wrap(
        <Divider orientation={props.orientation === 'vertical' ? 'vertical' : 'horizontal'} />,
      )
    case 'Avatar': {
      const size = props.size === 'md' || props.size === 'lg' ? props.size : 'sm'
      return wrap(
        <Avatar
          name={String(props.displayName ?? props.name ?? 'Ada Lovelace')}
          size={size}
          shape={props.shape === 'round' ? 'round' : 'square'}
        />,
      )
    }
    case 'Alert': {
      const tone = props.tone === 'ok' || props.tone === 'info' ? props.tone : 'error'
      return wrap(<Alert tone={tone}>{slotKids('value') ?? 'Alert'}</Alert>)
    }
    case 'Hint':
      return wrap(
        <Hint panel={props.panel === true || props.panel === 'true'}>
          {slotKids('value') ?? 'Hint'}
        </Hint>,
      )
    case 'Spinner':
      return wrap(
        <Spinner
          size={props.size === 'md' ? 'md' : 'sm'}
          label={String(props.label ?? 'Loading')}
        />,
      )
    case 'StatusDot': {
      const level =
        props.level === 'warn' || props.level === 'critical' ? props.level : 'ok'
      return wrap(<StatusDot level={level} />)
    }
    case 'EmptyState':
      return wrap(<EmptyState>{slotKids('value') ?? 'Nothing here yet'}</EmptyState>)
    case 'Slider':
      return wrap(
        <Slider
          value={numProp(props.value, 50)}
          min={numProp(props.min, 0)}
          max={numProp(props.max, 100)}
          step={numProp(props.step, 1)}
          onChange={() => undefined}
        />,
      )
    case 'Field':
      return wrap(
        <Field
          label={slotKids('label') ?? 'Field'}
          hint={slotKids('hint')}
          error={slotKids('error')}
          invalid={props.invalid === true || props.invalid === 'true'}
          size={props.size === 'md' ? 'md' : 'sm'}
          layout={props.layout === 'inline' ? 'inline' : 'stack'}
        >
          {bodyKids.length ? bodyKids : <Input placeholder="Input" readOnly />}
        </Field>,
      )
    case 'Panel': {
      const variant =
        props.variant === 'default' || props.variant === 'flush' || props.variant === 'card'
          ? props.variant
          : 'editorial'
      return wrap(
        <Panel variant={variant}>
          {bodyKids.length ? (
            <Stack direction="column" gap={layoutGap}>
              {bodyKids}
            </Stack>
          ) : null}
        </Panel>,
      )
    }
    case 'Tabs': {
      const items = tabItemsFromProps(props)
      const value = typeof props.value === 'string' && props.value ? props.value : items[0]?.id ?? 'a'
      return wrap(<Tabs items={items} value={value} onChange={() => undefined} />)
    }
    case 'Accordion': {
      const items = accordionItemsFromProps(props)
      const value = typeof props.value === 'string' && props.value ? props.value : items[0]?.id ?? 'a'
      return wrap(<Accordion items={items} value={value} onChange={() => undefined} />)
    }
    case 'LoadingText':
      return wrap(<LoadingText>{slotKids('value') ?? 'Loading…'}</LoadingText>)
    case 'PageTitle':
      return wrap(<PageTitle>{slotKids('title') ?? 'Page title'}</PageTitle>)
    case 'AddTile':
      return wrap(<AddTile label={slotKids('label') ?? 'Add'} />)
    case 'TagInput':
      return wrap(
        <TagInput
          value={tagsFromProps(props)}
          onChange={() => undefined}
          placeholder={String(props.placeholder ?? 'Add…')}
          size={props.size === 'md' ? 'md' : 'sm'}
          disabled={props.disabled === true || props.disabled === 'true'}
        />,
      )
    case 'ToggleGroup': {
      const options = toggleOptionsFromProps(props)
      const value = typeof props.value === 'string' && props.value ? props.value : options[0]?.value ?? 'a'
      return wrap(
        <ToggleGroup
          options={options}
          value={value}
          onChange={() => undefined}
          size={props.size === 'md' ? 'md' : 'sm'}
          variant={props.variant === 'icon' ? 'icon' : 'chip'}
        />,
      )
    }
    case 'MetricChip':
      return wrap(
        <MetricChip label={slotKids('label') ?? 'Metric'}>{slotKids('value') ?? '42'}</MetricChip>,
      )
    case 'Meter':
      return wrap(
        <Meter
          label={String(props.label ?? 'Meter')}
          hint={props.hint != null && String(props.hint) !== '' ? String(props.hint) : undefined}
          valueLabel={
            props.valueLabel != null && String(props.valueLabel) !== ''
              ? String(props.valueLabel)
              : undefined
          }
          value={numProp(props.value, 50)}
          min={numProp(props.min, 0)}
          max={numProp(props.max, 100)}
          step={numProp(props.step, 1)}
          onChange={() => undefined}
        />,
      )
    case 'Chart': {
      const variant: ChartVariant = isChartVariant(String(props.variant ?? ''))
        ? (String(props.variant) as ChartVariant)
        : 'bar'
      const title =
        props.title != null && String(props.title).trim() !== ''
          ? String(props.title)
          : undefined
      const height = props.height == null || String(props.height).trim() === ''
        ? 220
        : Math.max(80, Math.round(numProp(props.height, 220)))
      return wrap(
        <Chart
          variant={variant}
          data={chartPointsFromProps(props.data)}
          title={title}
          height={height}
          showTicks
          showValueLabels
        />,
      )
    }
    case 'Gauge': {
      const tone: GaugeTone =
        props.tone === 'ok' || props.tone === 'warn' || props.tone === 'bad'
          ? props.tone
          : 'neutral'
      return wrap(
        <Gauge
          value={numProp(props.value, 0)}
          min={numProp(props.min, 0)}
          max={numProp(props.max, 100)}
          label={
            props.label != null && String(props.label).trim() !== ''
              ? String(props.label)
              : undefined
          }
          unit={
            props.unit != null && String(props.unit).trim() !== ''
              ? String(props.unit)
              : undefined
          }
          tone={tone}
        />,
      )
    }
    case 'Lede': {
      const tone =
        props.tone === 'pos' ||
        props.tone === 'low' ||
        props.tone === 'neg' ||
        props.tone === 'ok' ||
        props.tone === 'choice'
          ? props.tone
          : 'default'
      const kind = props.kind === 'text' || props.kind === 'empty' ? props.kind : 'number'
      const labelText = slotPlainText(node.children, 'label') ?? 'Lede'
      const valueText = slotPlainText(node.children, 'value') ?? '42'
      const unitText = slotPlainText(node.children, 'unit')
      if (listPaint?.parentType === 'KpiStrip') {
        return wrap(
          <div className="kpi-card">
            <span className="kpi-label">{slotKids('label') ?? labelText}</span>
            <p className="kpi-value">{slotKids('value') ?? valueText}</p>
            {unitText ? <p className="kpi-meta">{slotKids('unit') ?? unitText}</p> : null}
          </div>,
        )
      }
      if (listPaint?.parentType === 'PrintCover') {
        const ringRaw = props.ringPct
        const ringPct = ringRaw == null || ringRaw === '' ? undefined : numProp(ringRaw, 0)
        return wrap(
          <div className="zaoly-print-kpi">
            {ringPct != null ? (
              <PrintScoreRing value={ringPct} />
            ) : (
              <div className="zaoly-print-kpi__value">{slotKids('value') ?? valueText}</div>
            )}
            <div className="zaoly-print-kpi__label">{slotKids('label') ?? labelText}</div>
          </div>,
        )
      }
      return wrap(
        <Lede
          value={slotKids('value') ?? '42'}
          label={slotKids('label') ?? 'Lede'}
          unit={slotKids('unit')}
          tone={tone}
          kind={kind}
        />,
      )
    }
    case 'ScrollArea': {
      const orientation =
        props.orientation === 'horizontal' || props.orientation === 'both'
          ? props.orientation
          : 'vertical'
      return wrap(
        <ScrollArea orientation={orientation}>
          {kids.length ? kids : String(props.children ?? '')}
        </ScrollArea>,
      )
    }
    case 'FormSection':
      return wrap(
        <FormSection
          title={slotKids('title') ?? 'Section'}
          columns={Math.max(1, Math.round(numProp(props.columns, 1)))}
          tone={props.tone === 'advanced' ? 'advanced' : 'default'}
        >
          {bodyKids.length ? (
            <Stack direction="column" gap={layoutGap}>
              {bodyKids}
            </Stack>
          ) : null}
        </FormSection>,
      )
    case 'CardActions':
      return wrap(
        <CardActions hairline={props.hairline !== false && props.hairline !== 'false'}>
          {kids.length ? kids : <Button type="button">Action</Button>}
        </CardActions>,
      )
    case 'FilterRow':
      return wrap(
        <FilterRow label={slotKids('label')} variant={props.variant === 'toolbar' ? 'toolbar' : 'magazine'}>
          {bodyKids.length ? bodyKids : <Chip static={true}>Filter</Chip>}
        </FilterRow>,
      )
    case 'SectionChrome': {
      const role = PANEL_ROLES.includes(props.role as (typeof PANEL_ROLES)[number])
        ? (props.role as (typeof PANEL_ROLES)[number])
        : undefined
      return wrap(
        <SectionChrome
          title={slotPlainText(node.children, 'title') ?? 'Section'}
          meta={slotKids('meta')}
          metaTone={props.metaTone === 'accent' ? 'accent' : 'muted'}
          role={role}
          as={props.as === 'h3' ? 'h3' : 'h2'}
          quiet={props.quiet === true || props.quiet === 'true'}
        />,
      )
    }
    case 'RankedRow': {
      const parent = listPaint?.parentType
      const labelText = bodyRowLabel(node)
      if (parent === 'PrintRankedList') {
        const index =
          listPaint?.startIndex != null && listPaint.bodyIndex != null
            ? listPaint.startIndex + listPaint.bodyIndex
            : Math.max(1, Math.round(numProp(props.index, 1)))
        const metaKids = slotKids('secondary') ?? slotKids('meta')
        return wrap(
          <div className="zaoly-print-ranked__row">
            <span className="zaoly-print-ranked__i">{padRankIndex(index)}</span>
            <div className="zaoly-print-ranked__text">
              <p className="zaoly-print-ranked__label">{slotKids('label') ?? labelText}</p>
              {metaKids ? <p className="zaoly-print-meta">{metaKids}</p> : null}
            </div>
          </div>,
        )
      }
      if (parent === 'PrintSteps') {
        const index = (listPaint?.bodyIndex ?? 0) + 1
        const emphasis =
          listPaint?.emphasisIndex != null && listPaint.bodyIndex === listPaint.emphasisIndex
        const detailKids = slotKids('secondary') ?? slotKids('value')
        return wrap(
          <li
            className={
              emphasis
                ? 'zaoly-print-steps__item zaoly-print-steps__item--emphasis'
                : 'zaoly-print-steps__item'
            }
            data-emphasis={emphasis ? 'true' : undefined}
          >
            <span className="zaoly-print-steps__badge" aria-hidden>
              {padRankIndex(index)}
            </span>
            <div className="zaoly-print-steps__copy">
              <p className="zaoly-print-steps__label">{slotKids('label') ?? labelText}</p>
              {detailKids ? <p className="zaoly-print-steps__detail">{detailKids}</p> : null}
            </div>
          </li>,
        )
      }
      if (parent === 'PrintTraitBars') {
        const score = numProp(slotPlainText(node.children, 'value'), 0)
        const pct = traitPctFromScore(score)
        return wrap(
          <div className="zaoly-print-traits__row">
            <div className="zaoly-print-traits__meta">
              <span>{slotKids('label') ?? labelText}</span>
              <span>{pct}%</span>
            </div>
            <div className="zaoly-print-traits__track">
              <div
                className="zaoly-print-traits__fill"
                style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
              />
            </div>
          </div>,
        )
      }
      if (parent === 'PrintLedger') {
        const score = numProp(slotPlainText(node.children, 'value'), 0)
        const max = listPaint?.ledgerMax ?? 100
        const tone =
          score < max * 0.4
            ? PRINT_LEDGER_TONES.neg
            : score < max * 0.7
              ? PRINT_LEDGER_TONES.warn
              : PRINT_LEDGER_TONES.accentInk
        const detailKids = slotKids('summary')
        const index = (listPaint?.bodyIndex ?? 0) + 1
        return wrap(
          <div className="zaoly-print-ledger__row">
            <span className="zaoly-print-ranked__i">{padRankIndex(index)}</span>
            <span className="zaoly-print-ledger__score" style={{ color: tone }}>
              {slotKids('value') ?? Math.round(score)}
            </span>
            <div className="zaoly-print-ranked__text">
              <p className="zaoly-print-ranked__label">{slotKids('label') ?? labelText}</p>
              {detailKids ? <p className="zaoly-print-meta">{detailKids}</p> : null}
            </div>
          </div>,
        )
      }
      if (parent === 'DivergingBar') {
        const value = numProp(slotPlainText(node.children, 'value'), 0)
        const domain = Math.max(1, listPaint?.divergingDomain ?? (Math.abs(value) || 1))
        const tone = value < 0 ? 'neg' : value > 0 ? 'pos' : 'neu'
        const pct = Math.min(100, (Math.abs(value) / domain) * 100)
        return wrap(
          <div data-tone={tone} className="ds-diverging-bar">
            <span className="ds-diverging-bar-label">{slotKids('label') ?? labelText}</span>
            <div className="ds-diverging-bar-track" aria-hidden>
              <span className="ds-diverging-bar-zero" />
              <span
                className="ds-diverging-bar-fill"
                data-tone={tone}
                style={{ ['--bar-pct' as string]: `${pct}%` }}
              />
            </div>
            <strong className="ds-diverging-bar-value ds-text-numeric">{formatSigned(value)}</strong>
          </div>,
        )
      }
      if (parent === 'PrintDonut') {
        const value = numProp(slotPlainText(node.children, 'value'), 0)
        const total = Math.max(1, listPaint?.donutTotal ?? 1)
        const pct = Math.round((100 * Math.max(0, value)) / total)
        const color =
          PRINT_DONUT_COLORS[Math.min(listPaint?.bodyIndex ?? 0, PRINT_DONUT_COLORS.length - 1)]
        return wrap(
          <li>
            <span
              className="zaoly-print-donut__swatch"
              style={{ ['--print-swatch' as string]: color } as CSSProperties}
            />
            <span>{slotKids('label') ?? labelText}</span>
            <span>{pct}%</span>
          </li>,
        )
      }
      if (parent === 'PrintTable') {
        const aligns = listPaint?.columnAlign ?? []
        const cellAlign = (ci: number): CSSProperties | undefined => {
          const ta = aligns[ci]
          return ta ? { textAlign: ta } : undefined
        }
        const extra = (node.children ?? [])
          .filter((kid) => slotOf(kid) === 'body' && kid.type === 'Text')
          .map((kid) => kidsById.get(kid.id))
          .filter((kid): kid is NonNullable<typeof kid> => kid != null)
        return wrap(
          <tr>
            <td style={cellAlign(0)}>{slotKids('label') ?? '–'}</td>
            <td style={cellAlign(1)}>{slotKids('value') ?? '–'}</td>
            {extra.map((cell, index) => (
              <td key={index} style={cellAlign(index + 2)}>
                {cell}
              </td>
            ))}
          </tr>,
        )
      }
      return wrap(
        <RankedRow
          index={Math.max(1, Math.round(numProp(props.index, 1)))}
          label={slotKids('label') ?? 'Row'}
          value={slotKids('value')}
          secondary={slotKids('secondary')}
          barPct={props.barPct == null || props.barPct === '' ? undefined : numProp(props.barPct, 0)}
          active={props.active === true || props.active === 'true'}
        />,
      )
    }
    case 'RankedList':
      return wrap(
        <RankedList hint={props.hint != null && String(props.hint) !== '' ? String(props.hint) : undefined}>
          {kids.length ? kids : <RankedRow index={1} label="Row" />}
        </RankedList>,
      )
    case 'TopStatus':
      return wrap(
        <TopStatus
          level={props.level === 'warn' || props.level === 'critical' ? props.level : 'ok'}
          primary={slotKids('primary') ?? 'Status'}
          secondary={slotKids('secondary')}
          live={props.live === true || props.live === 'true'}
        />,
      )
    case 'EventFooter':
      return wrap(
        <EventFooter summary={slotKids('summary')} actions={slotKids('actions')}>
          {bodyKids.length ? (
            <Stack direction="column" gap={layoutGap}>
              {bodyKids}
            </Stack>
          ) : null}
        </EventFooter>,
      )
    case 'EntityCard': {
      const titleKids = slotKids('title')
      return wrap(
        <EntityCard
          title={titleKids ?? 'Entity'}
          meta={slotKids('meta')}
          badge={slotKids('badge')}
          toolbar={slotKids('toolbar')}
          headActions={slotKids('headActions')}
          footer={slotKids('footer')}
          size={props.size === 'tall' ? 'tall' : 'default'}
        >
          {bodyKids.length ? (
            <Stack direction="column" gap={layoutGap}>
              {bodyKids}
            </Stack>
          ) : null}
        </EntityCard>,
      )
    }
    case 'ChannelStack':
      return wrap(<ChannelStack>{kids.length ? kids : null}</ChannelStack>)
    case 'ChannelLane':
      return wrap(
        <ChannelLane
          label={slotKids('label') ?? 'Lane'}
          compact={props.compact === true || props.compact === 'true'}
          defaultOpen={props.defaultOpen !== false && props.defaultOpen !== 'false'}
        >
          {bodyKids.length ? (
            <Stack direction="column" gap={layoutGap}>
              {bodyKids}
            </Stack>
          ) : null}
        </ChannelLane>,
      )
    case 'StepStrip':
      return wrap(
        <StepStrip hint={props.hint != null && String(props.hint) !== '' ? String(props.hint) : undefined}>
          {(node.children ?? []).map((child, index) => (
            <StepStripStepRow
              key={child.id}
              child={child}
              index={index}
              nestedInsidePrint={nestedInsidePrint}
              onSelect={onSelect}
              onPaletteDrop={onPaletteDrop}
              evaluatePaletteDrop={evaluatePaletteDrop}
              onTokenDrop={onTokenDrop}
              evaluateTokenDrop={evaluateTokenDrop}
              onSetProp={onSetProp}
              onBoardFramePointerDown={onBoardFramePointerDown}
              activeBreakpoint={paintBreakpoint}
            />
          ))}
        </StepStrip>,
      )
    case 'KpiStrip':
      return wrap(<div className="kpi-strip">{bodyKids}</div>)
    case 'DivergingBar':
      return wrap(
        <ul className="ds-diverging-bars" aria-label="Category scores">
          {bodyKids}
        </ul>,
      )
    case 'PrintPage':
      return wrap(
        <div className="zaoly-print-page">
          {bodyKids}
          <footer className="zaoly-print-folio">
            <span>{slotKids('label') ?? 'beispiel.de'}</span>
            <span>{slotKids('footer') ?? '1 — 8'}</span>
          </footer>
        </div>,
      )
    case 'PrintChapter': {
      const index = optionalString(props.index)
      const summaryKids = slotKids('summary')
      return wrap(
        <section className="zaoly-print-chapter">
          {index ? <p className="zaoly-print-chapter-index">{index}</p> : null}
          <p className="zaoly-print-eyebrow">{slotKids('label') ?? 'Chapter'}</p>
          <h3 className="zaoly-print-headline">{slotKids('title') ?? 'Print chapter'}</h3>
          <div className="zaoly-print-accent-rule" aria-hidden />
          {summaryKids ? <p className="zaoly-print-lede">{summaryKids}</p> : null}
          {bodyKids}
        </section>,
      )
    }
    case 'PrintCover': {
      const url = optionalString(props.url)
      const metaKids = slotKids('meta')
      const footerKids = slotKids('footer')
      return wrap(
        <header>
          <p className="zaoly-print-eyebrow">{slotKids('label') ?? 'Quick Check'}</p>
          <h2 className="zaoly-print-cover-headline">{slotKids('title') ?? 'Print cover'}</h2>
          <div className="zaoly-print-accent-rule" aria-hidden />
          <div className="zaoly-print-cover-meta">
            {url ? <p className="zaoly-print-meta">{url}</p> : null}
            {metaKids ? <p className="zaoly-print-meta">{metaKids}</p> : null}
          </div>
          {footerKids ? (
            <aside className="zaoly-print-pull">
              <div className="zaoly-print-pull__bar" aria-hidden />
              <div>
                <p className="zaoly-print-sub-eyebrow">Fazit</p>
                <p className="zaoly-print-body" style={{ marginBottom: 0 }}>
                  {footerKids}
                </p>
              </div>
            </aside>
          ) : null}
          {bodyKids.length ? <div className="zaoly-print-kpi-row">{bodyKids}</div> : null}
        </header>,
      )
    }
    case 'PrintPullQuote': {
      const labelKids = slotKids('label')
      return wrap(
        <aside className="zaoly-print-pull">
          <div className="zaoly-print-pull__bar" aria-hidden />
          <div>
            {labelKids ? <p className="zaoly-print-sub-eyebrow">{labelKids}</p> : null}
            <p className="zaoly-print-body" style={{ marginBottom: 0 }}>
              {slotKids('value') ?? 'Print pull quote.'}
            </p>
          </div>
        </aside>,
      )
    }
    case 'PrintCallout': {
      return wrap(
        <PrintCallout
          label={slotKids('label')}
          variant={normalizePrintCalloutVariant(props.variant)}
        >
          {slotKids('value') ?? 'Report callout body.'}
        </PrintCallout>,
      )
    }
    case 'PrintSteps': {
      const orientation = normalizePrintStepsOrientation(props.orientation)
      return wrap(
        <ol
          className={
            orientation === 'vertical'
              ? 'zaoly-print-steps zaoly-print-steps--vertical'
              : 'zaoly-print-steps zaoly-print-steps--horizontal'
          }
          data-orientation={orientation}
        >
          {bodyKids}
        </ol>,
      )
    }
    case 'PrintScoreRing': {
      const value = numProp(slotPlainText(node.children, 'value') ?? props.value, 72)
      const max = numProp(props.max, 100)
      const safeMax = max > 0 ? max : 100
      const pct = Math.max(0, Math.min(100, (value / safeMax) * 100))
      const valueKids = slotKids('value')
      const labelKids = slotKids('label')
      return wrap(
        <div>
          <div
            className="zaoly-print-ring"
            style={{ ['--print-ring-pct' as string]: pct } as CSSProperties}
            role="img"
            aria-label={`${Math.round(value)} von ${safeMax}`}
          >
            <div className="zaoly-print-ring__chart" aria-hidden />
            <div className="zaoly-print-ring__value">
              {valueKids ?? Math.round(value)}
            </div>
          </div>
          {labelKids ? <div className="zaoly-print-kpi__label">{labelKids}</div> : null}
        </div>,
      )
    }
    case 'PrintChip':
      return wrap(
        <PrintChip tone={normalizePrintChipTone(props.tone)}>
          {slotKids('label') ?? 'Print chip'}
        </PrintChip>,
      )
    case 'PrintChipRow':
      return wrap(
        <PrintChipRow>{kids.length ? kids : <PrintChip>Print chip</PrintChip>}</PrintChipRow>,
      )
    case 'PrintTwoColumn':
      return wrap(
        <PrintTwoColumn
          left={kids[0] ?? null}
          right={kids[1] ?? null}
        />,
      )
    case 'PrintDonut': {
      const slices = printDonutSlicesFromNode(node, props)
      const { stops } = printDonutStops(slices)
      const valueKids = slotKids('value')
      const labelKids = slotKids('label')
      return wrap(
        <div className="zaoly-print-donut">
          <div
            className="zaoly-print-donut__chart"
            style={{
              background: `conic-gradient(from -90deg, ${stops.join(', ') || 'var(--print-line) 0 100%'})`,
            }}
            role="img"
            aria-label={slotPlainText(node.children, 'label') ?? 'Verteilung'}
          >
            <div className="zaoly-print-donut__hole">
              {valueKids ? <span className="zaoly-print-donut__center-v">{valueKids}</span> : null}
              {labelKids ? <span className="zaoly-print-donut__center-k">{labelKids}</span> : null}
            </div>
          </div>
          <ul className="zaoly-print-donut__legend">{bodyKids}</ul>
        </div>,
      )
    }
    case 'PrintRankedList': {
      const compact = props.compact === true || props.compact === 'true'
      const columns = props.columns === 2 || props.columns === '2' ? 2 : 1
      const rankedClass = compact ? 'zaoly-print-ranked zaoly-print-ranked--compact' : 'zaoly-print-ranked'
      const eyebrow = slotKids('label')
      const listPainted =
        columns === 2 && bodyKids.length > 1 ? (
          <div className="zaoly-print-two-col">
            <div className="zaoly-print-two-col__cell">
              <ol className={rankedClass}>{bodyKids.slice(0, Math.ceil(bodyKids.length / 2))}</ol>
            </div>
            <div className="zaoly-print-two-col__cell">
              <ol className={rankedClass}>{bodyKids.slice(Math.ceil(bodyKids.length / 2))}</ol>
            </div>
          </div>
        ) : (
          <ol className={rankedClass}>{bodyKids}</ol>
        )
      return wrap(
        <>
          {eyebrow ? <p className="zaoly-print-sub-eyebrow">{eyebrow}</p> : null}
          {listPainted}
        </>,
      )
    }
    case 'PrintLedger':
      return wrap(<ol className="zaoly-print-ledger">{bodyKids}</ol>)
    case 'PrintTraitBars':
      return wrap(<div className="zaoly-print-traits">{bodyKids}</div>)
    case 'PrintTable': {
      const table = printTableFromProps(props)
      const { slots } = partitionSlottedChildren(node.children)
      const colNodes = slots.label ?? []
      const colCount = colNodes.length || table.columns.length
      const aligns = normalizePrintColumnAlignList(props.columnAlign, colCount)
      return wrap(
        <table className="zaoly-print-table">
          <thead>
            <tr>
              {colNodes.length
                ? colNodes.map((child, ci) => (
                    <th key={child.id} style={{ textAlign: aligns[ci] ?? 'left' }}>
                      {kidsById.get(child.id)}
                    </th>
                  ))
                : table.columns.map((column, ci) => (
                    <th key={column} style={{ textAlign: aligns[ci] ?? 'left' }}>
                      {column}
                    </th>
                  ))}
            </tr>
          </thead>
          <tbody>{bodyKids}</tbody>
        </table>,
      )
    }
    case 'PrintPersonaCard': {
      const spread = props.spread !== false && props.spread !== 'false'
      const titleKids = slotKids('title')
      const summaryKids = slotKids('summary')
      const { body } = partitionSlottedChildren(node.children)
      const chipRows: ReactNode[] = []
      const rest: ReactNode[] = []
      for (const child of body) {
        const view = kidsById.get(child.id)
        if (view == null) continue
        if (child.type === 'PrintChipRow') chipRows.push(view)
        else rest.push(view)
      }
      return wrap(
        <article
          className={
            spread ? 'zaoly-print-persona zaoly-print-persona--spread' : 'zaoly-print-persona'
          }
        >
          <h4 className="zaoly-print-persona__name">{titleKids ?? 'Alex Rivera'}</h4>
          {chipRows}
          {summaryKids ? <p className="zaoly-print-persona__bio">{summaryKids}</p> : null}
          {rest}
        </article>,
      )
    }
    case 'PrintPersonaGrid': {
      const { body } = partitionSlottedChildren(node.children)
      const cardNodes = body.filter((child) => child.type === 'PrintPersonaCard')
      const cardViews = cardNodes
        .map((child) => kidsById.get(child.id))
        .filter((kid): kid is NonNullable<typeof kid> => kid != null)
      const extra = body
        .filter((child) => child.type !== 'PrintPersonaCard')
        .map((child) => kidsById.get(child.id))
        .filter((kid): kid is NonNullable<typeof kid> => kid != null)
      if (cardViews.length <= 1) {
        return wrap(
          <>
            {cardViews[0] ?? null}
            {extra}
          </>,
        )
      }
      const rows: ReactNode[] = []
      for (let i = 0; i < cardViews.length; i += 2) {
        const pair = cardViews.slice(i, i + 2)
        rows.push(
          <div
            key={cardNodes[i]?.id ?? `pair-${i}`}
            className="zaoly-print-two-col"
            style={i > 0 ? { marginTop: '1.35rem' } : undefined}
          >
            {pair.map((view, pi) => (
              <div key={cardNodes[i + pi]?.id ?? pi} className="zaoly-print-two-col__cell">
                {view}
              </div>
            ))}
          </div>,
        )
      }
      return wrap(
        <div className="zaoly-print-persona-grid">
          {rows}
          {extra}
        </div>,
      )
    }
    case 'Image':
      return wrap(
        <Image
          src={String(props.src ?? paths.imagePlaceholderUrl)}
          alt={String(props.alt ?? '')}
        />,
      )
    case 'SiteTable': {
      const TableComp = siteKitComponent('SiteTable')
      if (!TableComp) {
        return wrap(
          <Text role="meta" data-testid="scene-node-unsupported">
            Unsupported type: SiteTable
          </Text>,
        )
      }
      const rowNodes = (node.children ?? []).filter((child) => child.type === 'SiteTableRow')
      const headerRows = rowNodes.filter(
        (row) => row.props?.header === true || row.props?.header === 'true',
      )
      const bodyRows = rowNodes.filter((row) => !headerRows.includes(row))
      const extras = (node.children ?? [])
        .filter((child) => child.type !== 'SiteTableRow')
        .map((child) => kidsById.get(child.id))
        .filter((view): view is NonNullable<typeof view> => view != null)
      const captionRaw = props.caption != null ? String(props.caption).trim() : ''
      const densityRaw = String(props.density ?? 'default')
      const density =
        densityRaw === 'compact' || densityRaw === 'comfortable' ? densityRaw : 'default'
      const bordersRaw = String(props.borders ?? 'row')
      const borders =
        bordersRaw === 'none' || bordersRaw === 'all' ? bordersRaw : 'row'
      return wrap(
        <TableComp
          density={density}
          borders={borders}
          striped={props.striped === true || props.striped === 'true'}
          caption={captionRaw || undefined}
          style={style}
        >
          {headerRows.length > 0 ? (
            <thead>{headerRows.map((row) => kidsById.get(row.id))}</thead>
          ) : null}
          <tbody>
            {bodyRows.map((row) => kidsById.get(row.id))}
            {extras}
          </tbody>
        </TableComp>,
        { paintOnSelf: true },
      )
    }
    default: {
      const SiteComp = siteKitComponent(node.type)
      if (SiteComp) {
        if (editing && isTextLeafNodeType(node.type) && onSetProp) {
          return wrap(
            <InlineCanvasTextEdit
              editRef={editRef}
              value={String(props.children ?? '')}
              style={style}
              className={node.type === 'SiteText' ? 'site-text' : undefined}
              onCommit={(text) => {
                onSetProp(node.id, 'children', text)
                setEditing(false)
              }}
              onCancel={() => setEditing(false)}
            />,
            { paintOnSelf: true, flowTransparent: pseudoDecor },
          )
        }
        const siteProps = genericCatalogProps(props)
        if (node.type === 'SiteChart') {
          siteProps.data = resolveChartSeriesColors(
            props.data,
            catalog,
            tokenChannel,
          )
        }
        let paintStyle: CSSProperties = { ...style }
        const gapCss = resolveSiteKitGapCss(props)
        if (gapCss != null && (paintStyle.gap == null || paintStyle.gap === '')) {
          paintStyle.gap = gapCss
        }
        paintStyle = ensureSiteKitLayoutPaint(node.type, props, paintStyle)
        const prior =
          siteProps.style && typeof siteProps.style === 'object'
            ? (siteProps.style as CSSProperties)
            : {}
        const paintedProps = {
          ...siteProps,
          style: { ...prior, ...paintStyle },
        }
        const tableChrome =
          node.type === 'SiteTableRow' || node.type === 'SiteTableCell'
        // Label shell (SiteButton, …): keep chrome, edit string children inline.
        if (
          editing &&
          onSetProp &&
          isInlineLabelShellType(node.type) &&
          canInlineEditCanvasNode(node)
        ) {
          return wrap(
            createElement(
              SiteComp,
              paintedProps,
              <InlineCanvasTextEdit
                editRef={editRef}
                value={String(props.children ?? '')}
                onCommit={(text) => {
                  onSetProp(node.id, 'children', text)
                  setEditing(false)
                }}
                onCancel={() => setEditing(false)}
              />,
            ),
            { paintOnSelf: true, flowTransparent: tableChrome || pseudoDecor },
          )
        }
        // Empty kids array would override props.children in createElement.
        return wrap(
          kids.length
            ? createElement(SiteComp, paintedProps, ...kids)
            : createElement(SiteComp, paintedProps),
          { paintOnSelf: true, flowTransparent: tableChrome || pseudoDecor },
        )
      }
      const Comp = catalogComponent(node.type)
      if (Comp) {
        return wrap(createElement(Comp, genericCatalogProps(props), kids))
      }
      return wrap(
        <Text role="meta" data-testid="scene-node-unsupported">
          Unsupported type: {node.type}
          {kids}
        </Text>,
      )
    }
  }
}

function SceneNodeView(props: SceneNodeViewProps) {
  const selected = useSceneNodeSelected(props.node.id)
  const compareGhost = useSceneNodeCompareGhost(props.node.id)
  const peerHalo = useSceneNodePeerHalo(props.node.id)
  return (
    <SceneNodeViewMemo
      {...props}
      selected={selected}
      compareGhost={compareGhost}
      peerHaloColor={peerHalo?.color ?? null}
      peerHaloName={peerHalo ? `Locked · ${peerHalo.name}` : null}
    />
  )
}

const SceneNodeViewMemo = memo(SceneNodeViewInner, sceneNodeViewPropsAreEqual)

export { SceneNodeView }
