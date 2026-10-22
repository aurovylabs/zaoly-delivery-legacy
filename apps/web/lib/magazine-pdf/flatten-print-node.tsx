import type { ReactNode } from 'react'
import { View } from '@react-pdf/renderer'
import type { SceneNode } from '@zaoly/contracts'
import {
  MagChapter,
  MagChip,
  MagChipRow,
  MagCover,
  MagDonut,
  MagLedger,
  MagPersonaCard,
  MagPersonaGrid,
  MagPullQuote,
  MagCallout,
  MagSteps,
  MagRankedList,
  MagScoreRing,
  MagTable,
  MagTraitBars,
  MagTwoColumn,
  type MagCoverKpi,
  type MagPersonaCardModel,
  type MagRankedItem,
  normalizePrintChipTone,
  normalizePrintCalloutVariant,
  normalizePrintColumnAlignList,
  normalizePrintStepsEmphasisIndex,
  normalizePrintStepsOrientation,
} from '@zaoly/ui/mag'
import type { InspectTokenOption } from '../inspect/token-catalog'
import { partitionSlottedChildren, slotPlainText } from '../scene/slots'
import { printTableFromProps } from '../scene/print-table'
import { isPrintSceneType } from './print-types'
import {
  resolveMagInstancePaint,
  resolveRankedRowLabelPaint,
  resolveSlotTextPaint,
  mergeMagTextStyles,
  type MagTextStyle,
} from './resolve-mag-instance-paint'

export type FlattenPrintContext = {
  /** Token pack / fixture catalog for instance tokenBindings (P84). */
  catalog?: InspectTokenOption[]
}

function numProp(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return fallback
}

function optionalString(value: unknown): string | undefined {
  return value != null && String(value) !== '' ? String(value) : undefined
}

function propBool(value: unknown, defaultTrue = false): boolean {
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  return defaultTrue
}

function rankedRowLabel(child: SceneNode): string {
  return (
    slotPlainText(child.children, 'label') ??
    (typeof child.props?.children === 'string' && child.props.children.trim()
      ? child.props.children.trim()
      : undefined) ??
    (typeof child.props?.label === 'string' && child.props.label.trim()
      ? child.props.label.trim()
      : undefined) ??
    'Item'
  )
}

function rankedRowMeta(child: SceneNode): string | undefined {
  return (
    slotPlainText(child.children, 'secondary') ??
    slotPlainText(child.children, 'value') ??
    (typeof child.props?.secondary === 'string' ? child.props.secondary : undefined) ??
    (typeof child.props?.meta === 'string' ? child.props.meta : undefined)
  )
}

/** Extract MagRankedList items from a PrintRankedList node (for tests + flatten). */
export function rankedItemsFromPrintNode(
  node: SceneNode,
  catalog?: InspectTokenOption[],
): MagRankedItem[] {
  const { body } = partitionSlottedChildren(node.children)
  return body
    .filter(
      (child) =>
        child.type === 'RankedRow' ||
        Boolean(slotPlainText(child.children, 'label')) ||
        (typeof child.props?.children === 'string' && Boolean(child.props.children.trim())),
    )
    .map((child) => {
      const item: MagRankedItem = {
        label: rankedRowLabel(child),
        meta: rankedRowMeta(child),
      }
      if (catalog) {
        const labelPaint = resolveRankedRowLabelPaint(child, catalog)
        if (labelPaint.color) item.color = labelPaint.color
        if (labelPaint.textStyle && Object.keys(labelPaint.textStyle).length) {
          item.labelStyle = labelPaint.textStyle as Record<string, string | number>
        }
      }
      return item
    })
}

function textStyleRecord(style?: MagTextStyle): Record<string, string | number> | undefined {
  if (!style || !Object.keys(style).length) return undefined
  const out: Record<string, string | number> = {}
  // Typed twin adapter — every MagTextStyle key Creation can author.
  const keys = [
    'fontSize',
    'fontWeight',
    'lineHeight',
    'letterSpacing',
    'textAlign',
    'color',
    'fontFamily',
    'textDecoration',
    'textTransform',
  ] as const
  for (const key of keys) {
    const v = style[key]
    if (v != null && v !== '') out[key] = v as string | number
  }
  return Object.keys(out).length ? out : undefined
}

/** Parent Print* textStyle + slotted title/value Text paint (editor Size lives on the slot). */
function magTitleStyle(
  node: SceneNode,
  parentPaint: ReturnType<typeof resolveMagInstancePaint> | undefined,
  catalog: InspectTokenOption[] | undefined,
  slot: 'title' | 'value' = 'title',
): Record<string, string | number> | undefined {
  if (!catalog) return textStyleRecord(parentPaint?.textStyle)
  const slotPaint = resolveSlotTextPaint(node, slot, catalog)
  return textStyleRecord(mergeMagTextStyles(parentPaint?.textStyle, slotPaint))
}

function isBlockAlignSelf(value: unknown): boolean {
  return (
    value === 'center' ||
    value === 'flex-end' ||
    value === 'end' ||
    value === 'flex-start' ||
    value === 'start'
  )
}

function emitMag(
  node: SceneNode,
  ctx: FlattenPrintContext | undefined,
  mag: ReactNode,
): ReactNode[] {
  if (!ctx?.catalog) return [mag]
  const paint = resolveMagInstancePaint(node, ctx.catalog)
  if (!paint.wrapStyle) return [mag]
  // Prefer authored width over forced full measure so size inspect reaches PDF.
  // When alignSelf parks the block, omit default width:100% so Mag column can hug (P91).
  const centered = isBlockAlignSelf(paint.wrapStyle.alignSelf)
  const base: Record<string, string | number> =
    paint.wrapStyle.width != null || centered ? {} : { width: '100%' }
  return [
    <View key={node.id} style={[base, paint.wrapStyle]}>
      {mag}
    </View>,
  ]
}

function flattenLayoutContainer(
  node: SceneNode,
  ctx?: FlattenPrintContext,
): ReactNode[] {
  const kids: ReactNode[] = []
  for (const child of node.children ?? []) {
    for (const part of flattenPrintNode(child, ctx)) kids.push(part)
  }
  if (!kids.length) return []
  const paint = ctx?.catalog ? resolveMagInstancePaint(node, ctx.catalog) : undefined
  const direction =
    node.props?.direction === 'row' || node.props?.flexDirection === 'row' ? 'row' : 'column'
  const wrapStyle: Record<string, string | number> = {
    width: '100%',
    flexDirection: direction,
    ...(paint?.wrapStyle ?? {}),
  }
  if (wrapStyle.flexDirection == null) wrapStyle.flexDirection = direction
  return [
    <View key={node.id} style={wrapStyle}>
      {kids}
    </View>,
  ]
}

function flattenChildren(
  nodes: SceneNode[] | undefined,
  ctx?: FlattenPrintContext,
): ReactNode[] {
  const out: ReactNode[] = []
  for (const child of nodes ?? []) {
    const parts = flattenPrintNode(child, ctx)
    for (const part of parts) out.push(part)
  }
  return out
}

/** Walk any node: Print* → Mag; Stack/Grid keep gap/align; others skipped but children walked. */
export function flattenPrintNode(
  node: SceneNode,
  ctx?: FlattenPrintContext,
): ReactNode[] {
  if (node.hidden) return []
  if (!isPrintSceneType(node.type)) {
    if (node.type === 'Stack' || node.type === 'Grid') {
      return flattenLayoutContainer(node, ctx)
    }
    return flattenChildren(node.children, ctx)
  }

  const props = (node.props ?? {}) as Record<string, unknown>
  const { body } = partitionSlottedChildren(node.children)
  const listPaint = ctx?.catalog ? resolveMagInstancePaint(node, ctx.catalog) : undefined

  switch (node.type) {
    case 'PrintPage':
      // Page shell is MagPage; still honor page padding/align via wrap around children.
      {
        const content = flattenChildren(body, ctx)
        if (!ctx?.catalog) return content
        const paint = resolveMagInstancePaint(node, ctx.catalog)
        if (!paint.wrapStyle) return content
        return [
          <View key={node.id} style={[{ width: '100%' }, paint.wrapStyle]}>
            {content}
          </View>,
        ]
      }
    case 'PrintCover': {
      const kpis: MagCoverKpi[] = body
        .filter((child) => child.type === 'Lede' || child.type === 'PrintScoreRing')
        .map((child) => {
          if (child.type === 'PrintScoreRing') {
            const value = numProp(slotPlainText(child.children, 'value') ?? child.props?.value, 0)
            const max = numProp(child.props?.max, 100)
            return {
              label: slotPlainText(child.children, 'label') ?? 'Score',
              value: String(Math.round(value)),
              ringValue: value,
              ringMax: max,
            }
          }
          const label = slotPlainText(child.children, 'label') ?? 'KPI'
          const value = slotPlainText(child.children, 'value') ?? '—'
          const unit = slotPlainText(child.children, 'unit')
          const ringPct = child.props?.ringPct
          const ring =
            typeof ringPct === 'number'
              ? ringPct
              : typeof ringPct === 'string'
                ? Number(ringPct)
                : null
          return {
            label,
            value: unit ? `${value} ${unit}` : value,
            ringValue: ring != null && Number.isFinite(ring) ? ring : null,
            ringMax: 100,
          }
        })
      return emitMag(
        node,
        ctx,
        <MagCover
          key={node.id}
          eyebrow={slotPlainText(node.children, 'label') ?? 'Quick Check'}
          title={slotPlainText(node.children, 'title') ?? 'Print cover'}
          url={optionalString(props.url)}
          meta={slotPlainText(node.children, 'meta')}
          fazit={slotPlainText(node.children, 'footer')}
          kpis={kpis}
          titleStyle={magTitleStyle(node, listPaint, ctx?.catalog, 'title')}
        />,
      )
    }
    case 'PrintChapter': {
      const kids = flattenChildren(body, ctx)
      return emitMag(
        node,
        ctx,
        <MagChapter
          key={node.id}
          eyebrow={slotPlainText(node.children, 'label') ?? 'Chapter'}
          title={slotPlainText(node.children, 'title') ?? 'Print chapter'}
          lede={slotPlainText(node.children, 'summary')}
          index={optionalString(props.index)}
          titleStyle={magTitleStyle(node, listPaint, ctx?.catalog, 'title')}
        >
          {kids}
        </MagChapter>,
      )
    }
    case 'PrintPullQuote':
      return emitMag(
        node,
        ctx,
        <MagPullQuote
          key={node.id}
          label={slotPlainText(node.children, 'label')}
          body={slotPlainText(node.children, 'value') ?? 'Print pull quote.'}
          bodyStyle={magTitleStyle(node, listPaint, ctx?.catalog, 'value')}
        />,
      )
    case 'PrintCallout':
      return emitMag(
        node,
        ctx,
        <MagCallout
          key={node.id}
          label={slotPlainText(node.children, 'label')}
          body={slotPlainText(node.children, 'value') ?? 'Report callout body.'}
          variant={normalizePrintCalloutVariant(node.props?.variant)}
          bodyStyle={magTitleStyle(node, listPaint, ctx?.catalog, 'value')}
        />,
      )
    case 'PrintSteps': {
      const steps = body
        .filter((child) => child.type === 'RankedRow')
        .map((row) => ({
          label: slotPlainText(row.children, 'label') ?? 'Step',
          detail:
            slotPlainText(row.children, 'secondary') ??
            slotPlainText(row.children, 'value') ??
            undefined,
        }))
      return emitMag(
        node,
        ctx,
        <MagSteps
          key={node.id}
          steps={steps.length ? steps : [{ label: 'Step' }]}
          orientation={normalizePrintStepsOrientation(node.props?.orientation)}
          emphasisIndex={normalizePrintStepsEmphasisIndex(
            node.props?.emphasisIndex,
            steps.length || 1,
          )}
        />,
      )
    }
    case 'PrintScoreRing': {
      const value = numProp(slotPlainText(node.children, 'value') ?? props.value, 72)
      const max = numProp(props.max, 100)
      return emitMag(
        node,
        ctx,
        <MagScoreRing
          key={node.id}
          value={value}
          max={max}
          label={slotPlainText(node.children, 'label')}
        />,
      )
    }
    case 'PrintChip':
      return emitMag(
        node,
        ctx,
        <MagChip key={node.id} tone={normalizePrintChipTone(node.props?.tone)}>
          {slotPlainText(node.children, 'label') ?? 'Print chip'}
        </MagChip>,
      )
    case 'PrintChipRow': {
      const chips = flattenChildren(node.children, ctx)
      return emitMag(node, ctx, <MagChipRow key={node.id}>{chips}</MagChipRow>)
    }
    case 'PrintTwoColumn': {
      const kids = node.children ?? []
      const leftParts = kids[0] ? flattenPrintNode(kids[0], ctx) : []
      const rightParts = kids[1] ? flattenPrintNode(kids[1], ctx) : []
      return emitMag(
        node,
        ctx,
        <MagTwoColumn
          key={node.id}
          left={<>{leftParts}</>}
          right={<>{rightParts}</>}
          gap={
            typeof listPaint?.wrapStyle?.gap === 'number'
              ? listPaint.wrapStyle.gap
              : undefined
          }
        />,
      )
    }
    case 'PrintDonut': {
      const rows = body.filter((child) => child.type === 'RankedRow')
      const slices = rows.length
        ? rows.map((child) => ({
            id: child.id,
            label: slotPlainText(child.children, 'label') ?? child.id,
            value: numProp(slotPlainText(child.children, 'value'), 0),
          }))
        : Array.isArray(props.slices)
          ? (props.slices as Array<{ id?: string; label?: string; value?: unknown }>)
              .filter((s) => s && typeof s.id === 'string')
              .map((s) => ({
                id: s.id!,
                label: typeof s.label === 'string' ? s.label : s.id!,
                value: numProp(s.value, 0),
              }))
          : [
              { id: 'a', label: 'A', value: 40 },
              { id: 'b', label: 'B', value: 32 },
            ]
      return emitMag(
        node,
        ctx,
        <MagDonut
          key={node.id}
          slices={slices}
          centerValue={slotPlainText(node.children, 'value')}
          centerLabel={slotPlainText(node.children, 'label')}
        />,
      )
    }
    case 'PrintRankedList': {
      const items = rankedItemsFromPrintNode(node, ctx?.catalog)
      const columns = props.columns === 2 || props.columns === '2' ? 2 : 1
      const compact = propBool(props.compact)
      const startIndex = Math.max(1, Math.round(numProp(props.startIndex, 1)))
      return emitMag(
        node,
        ctx,
        <MagRankedList
          key={node.id}
          items={items}
          columns={columns}
          compact={compact}
          startIndex={startIndex}
          tones={listPaint?.tones}
          labelStyle={textStyleRecord(listPaint?.textStyle)}
          gap={
            typeof listPaint?.wrapStyle?.gap === 'number'
              ? listPaint.wrapStyle.gap
              : undefined
          }
        />,
      )
    }
    case 'PrintLedger': {
      const items = body.map((child) => ({
        label: slotPlainText(child.children, 'label') ?? 'Item',
        score: numProp(slotPlainText(child.children, 'value'), 0),
        detail: slotPlainText(child.children, 'summary'),
      }))
      return emitMag(
        node,
        ctx,
        <MagLedger key={node.id} items={items} max={numProp(props.max, 100)} />,
      )
    }
    case 'PrintTraitBars': {
      const traits = body.map((child) => ({
        displayName: slotPlainText(child.children, 'label') ?? 'Trait',
        score: numProp(slotPlainText(child.children, 'value'), 0),
      }))
      return emitMag(
        node,
        ctx,
        <MagTraitBars key={node.id} traits={traits} compact={propBool(props.compact)} />,
      )
    }
    case 'PrintTable': {
      const { slots } = partitionSlottedChildren(node.children)
      const colNodes = slots.label ?? []
      const columns = colNodes.length
        ? colNodes.map(
            (c) =>
              (typeof c.props?.children === 'string' && c.props.children) ||
              slotPlainText(c.children, 'label') ||
              'Col',
          )
        : printTableFromProps(props).columns
      const catalog = ctx?.catalog
      const headStyle = catalog
        ? textStyleRecord(
            mergeMagTextStyles(
              listPaint?.textStyle,
              ...colNodes.map((c) => resolveMagInstancePaint(c, catalog).textStyle),
            ),
          )
        : textStyleRecord(listPaint?.textStyle)
      const rowsFromBody = body.map((row) => {
        const label = slotPlainText(row.children, 'label')
        const value = slotPlainText(row.children, 'value')
        if (label != null || value != null) {
          return [label ?? '', value ?? ''] as Array<string | number | null>
        }
        const cells = (row.children ?? []).map((cell) => {
          const t = slotPlainText(cell.children, 'label') ?? cell.props?.children
          return typeof t === 'string' || typeof t === 'number' ? t : String(t ?? '')
        })
        return cells
      })
      const rows = rowsFromBody.length ? rowsFromBody : printTableFromProps(props).rows
      const columnAlign = normalizePrintColumnAlignList(
        node.props?.columnAlign,
        columns.length,
      )
      const cellStyles =
        catalog && body.length
          ? body.map((row) => {
              const labelChild = row.children?.find((c) => c.props?.slot === 'label')
              const valueChild = row.children?.find((c) => c.props?.slot === 'value')
              if (labelChild || valueChild) {
                return [
                  textStyleRecord(resolveMagInstancePaint(labelChild ?? row, catalog).textStyle),
                  textStyleRecord(
                    resolveMagInstancePaint(valueChild ?? labelChild ?? row, catalog).textStyle,
                  ),
                ]
              }
              return (row.children ?? []).map((cell) =>
                textStyleRecord(resolveMagInstancePaint(cell, catalog).textStyle),
              )
            })
          : undefined
      return emitMag(
        node,
        ctx,
        <MagTable
          key={node.id}
          columns={columns}
          rows={rows}
          headStyle={headStyle}
          cellStyle={textStyleRecord(listPaint?.textStyle)}
          cellStyles={cellStyles}
          columnAlign={columnAlign}
          fit={isBlockAlignSelf(listPaint?.wrapStyle?.alignSelf) ? 'hug' : 'stretch'}
          gap={
            typeof listPaint?.wrapStyle?.gap === 'number'
              ? listPaint.wrapStyle.gap
              : undefined
          }
        />,
      )
    }
    case 'PrintPersonaCard': {
      return emitMag(
        node,
        ctx,
        <MagPersonaCard
          key={node.id}
          persona={personaFromNode(node)}
          spread={props.spread !== false && props.spread !== 'false'}
        />,
      )
    }
    case 'PrintPersonaGrid': {
      const cards = body
        .filter((child) => child.type === 'PrintPersonaCard')
        .map(personaFromNode)
      return emitMag(node, ctx, <MagPersonaGrid key={node.id} personas={cards} />)
    }
    default:
      return flattenChildren(node.children, ctx)
  }
}

function personaFromNode(node: SceneNode): MagPersonaCardModel {
  const { body } = partitionSlottedChildren(node.children)
  const traits: MagPersonaCardModel['traits'] = []
  const goals: string[] = []
  const painPoints: string[] = []
  for (const child of body) {
    if (child.type === 'PrintTraitBars') {
      const { body: rows } = partitionSlottedChildren(child.children)
      for (const row of rows) {
        traits.push({
          displayName: slotPlainText(row.children, 'label') ?? 'Trait',
          score: numProp(slotPlainText(row.children, 'value'), 0),
        })
      }
    } else if (child.type === 'PrintRankedList') {
      const eyebrow = (slotPlainText(child.children, 'label') ?? '').toLowerCase()
      const { body: rows } = partitionSlottedChildren(child.children)
      const labels = rows.map((r) => slotPlainText(r.children, 'label') ?? '').filter(Boolean)
      if (eyebrow.includes('pain') || eyebrow.includes('schmerz')) painPoints.push(...labels)
      else goals.push(...labels)
    }
  }
  const confidenceRaw = node.props?.confidence
  return {
    id: node.id,
    name: slotPlainText(node.children, 'title') ?? 'Persona',
    segment: slotPlainText(node.children, 'meta'),
    confidence: numProp(confidenceRaw, 0.8),
    bio: slotPlainText(node.children, 'summary'),
    traits,
    goals,
    painPoints,
  }
}
