'use client'

/**
 * Chart studio shell — floating dock for SiteChart authoring.
 * Spec: `specs/domain/chart-studio-panel.md`
 */
import type { SceneNode, SceneOp } from '@zaoly/contracts'
import {
  SITE_CHART_VARIANTS,
  type SiteChartPoint,
  type SiteChartStyle,
} from '@zaoly/site-kit'
import { Button, Field, FloatingPanel, Select } from '@zaoly/ui'
import { paths } from '../../lib/paths'
import { fieldValue } from '../../lib/inspect/inspector-field-values'
import { cascadeInspectView } from '../../lib/inspect/cascade-inspect-view'
import type { InspectFieldDef } from '../../lib/inspect/field-catalog'
import { CHART_STUDIO_OWNED_PROP_NAMES } from '../../lib/chart-studio/owned-props'
import { chartStudioFieldIcon } from '../../lib/chart-studio/field-icons'
import {
  chartSeriesPointsEqual,
  readChartSeriesPoints,
  serializeChartSeriesForScene,
} from '../../lib/chart-studio/series'
import { patchChartStyle, readChartStyle } from '../../lib/chart-studio/marks'
import {
  CHART_SERIES_SOURCE_BINDING_KEY,
  CHECKION_FACET_SERIES_FIELDS,
  CHECKION_LATEST_FACETS_REF,
  CHECKION_LATEST_SCORES_REF,
  CHECKION_SCORE_CARD_FIELDS,
  CHECKION_SCORE_HISTORY_FIELDS,
  CHECKION_SCORE_HISTORY_REF,
  METRON_KPI_SERIES_FIELDS,
  METRON_COLLECTION_KPIS_REF,
  chartSeriesValueBindingKey,
  defaultChartDataMap,
  parseChartSeriesValueBindingKey,
  remapChartSeriesDataBindings,
  splitCollectionScopedRef,
  type ChartDataMap,
  type CollectionDataCatalogItem,
  type CollectionDataField,
} from '../../lib/collection-data/collection-data-core'
import { useCollectionDataResolve } from '../../lib/collection-data/collection-data-context'
import {
  ChartStudioDataSourceSection,
  chartDataMapFromProps,
} from './chart-studio-data-source'
import { ChartStudioSeriesTable } from './chart-studio-series-table'
import { ChartStudioMarksSection } from './chart-studio-marks'

const CHART_TYPE_FIELD: InspectFieldDef = {
  name: 'chartType',
  label: 'Chart type',
  kind: 'enum',
  section: 'component',
  appliesTo: ['SiteChart'],
  defaultValue: 'bar',
}

const CHART_TYPE_OPTIONS = SITE_CHART_VARIANTS.map((value) => ({
  value,
  label: value.replace(/_/g, ' '),
}))

function fieldsForSourceRef(ref: string | null | undefined): CollectionDataField[] | undefined {
  if (!ref) return undefined
  const local = splitCollectionScopedRef(ref).localRef
  if (local === METRON_COLLECTION_KPIS_REF) return METRON_KPI_SERIES_FIELDS
  if (local === CHECKION_LATEST_FACETS_REF) return CHECKION_FACET_SERIES_FIELDS
  if (local === CHECKION_LATEST_SCORES_REF) return CHECKION_SCORE_CARD_FIELDS
  if (local === CHECKION_SCORE_HISTORY_REF) return CHECKION_SCORE_HISTORY_FIELDS
  if (/^checkion\.scan\.[A-Za-z0-9_-]+\.scores$/.test(local)) return CHECKION_SCORE_CARD_FIELDS
  return undefined
}

export function ChartStudioPanel({
  node,
  open,
  onDismiss,
  onOps,
  platformProjectId = null,
  t,
}: {
  node: SceneNode
  open: boolean
  onDismiss: () => void
  onOps: (ops: SceneOp[]) => void
  platformProjectId?: string | null
  t: (key: string, vars?: Record<string, string>) => string
}) {
  const { resolved } = useCollectionDataResolve()

  if (!open || node.type !== 'SiteChart') return null

  const cascaded = cascadeInspectView(node, 'desktop', 'default')
  const chartType = fieldValue(node, CHART_TYPE_FIELD, cascaded) || 'bar'
  const literalPoints = readChartSeriesPoints(cascaded.props.data)
  const chartStyle = readChartStyle(cascaded.props.chartStyle)
  const dataBindings = cascaded.dataBindings
  const sourceRef = dataBindings?.[CHART_SERIES_SOURCE_BINDING_KEY] ?? null
  const sourceResolved = sourceRef ? resolved[sourceRef] : undefined
  const fields =
    sourceResolved?.fields ?? fieldsForSourceRef(sourceRef) ?? undefined
  const chartDataMap =
    chartDataMapFromProps(cascaded.props.chartDataMap) ??
    (sourceRef ? defaultChartDataMap(fields) : null)

  const previewPoints =
    sourceRef && sourceResolved?.status === 'ok' && sourceResolved.rows
      ? readChartSeriesPoints(
          sourceResolved.rows.map((row) => {
            const map = chartDataMap ?? defaultChartDataMap(fields)
            const labelRaw = row[map.label]
            const valueRaw = row[map.value]
            return {
              label:
                labelRaw == null
                  ? '—'
                  : typeof labelRaw === 'string'
                    ? labelRaw
                    : String(labelRaw),
              value:
                typeof valueRaw === 'number' && Number.isFinite(valueRaw)
                  ? valueRaw
                  : Number(valueRaw) || 0,
              ...(map.color && typeof row[map.color] === 'string'
                ? { color: row[map.color] as string }
                : {}),
            }
          }),
        )
      : literalPoints

  const points = sourceRef ? previewPoints : literalPoints
  const sourceBound = Boolean(sourceRef)
  const sourceError =
    sourceRef && sourceResolved?.status === 'error'
      ? sourceResolved.error ?? 'resolve_failed'
      : null
  const sourceEmpty =
    sourceBound &&
    sourceResolved?.status === 'ok' &&
    (!sourceResolved.rows || sourceResolved.rows.length === 0)

  function setChartType(next: string) {
    if (!next || next === chartType) return
    onOps([
      { op: 'set_prop', nodeId: node.id, key: 'chartType', value: next },
      { op: 'set_prop', nodeId: node.id, key: 'variant', value: next },
    ])
  }

  function setSeries(
    next: SiteChartPoint[],
    meta?: { removeIndex?: number; swap?: [number, number] },
  ) {
    if (sourceBound) return
    const ops: SceneOp[] = []
    if (!chartSeriesPointsEqual(literalPoints, next)) {
      ops.push({
        op: 'set_prop',
        nodeId: node.id,
        key: 'data',
        value: serializeChartSeriesForScene(next),
      })
    }

    let mapIndex: ((oldIndex: number) => number | null) | null = null
    if (meta?.removeIndex != null) {
      const removed = meta.removeIndex
      mapIndex = (old) => (old === removed ? null : old > removed ? old - 1 : old)
    } else if (meta?.swap) {
      const [a, b] = meta.swap
      mapIndex = (old) => (old === a ? b : old === b ? a : old)
    }
    if (mapIndex) {
      const remapped = remapChartSeriesDataBindings(dataBindings, mapIndex)
      if (remapped !== dataBindings) {
        const prevKeys = new Set(
          Object.keys(dataBindings ?? {}).filter((k) => k.startsWith('data.')),
        )
        const nextKeys = new Set(
          Object.keys(remapped ?? {}).filter((k) => k.startsWith('data.')),
        )
        for (const key of prevKeys) {
          if (!nextKeys.has(key)) {
            ops.push({ op: 'clear_data_binding', nodeId: node.id, key })
          }
        }
        for (const [key, dataRef] of Object.entries(remapped ?? {})) {
          if (!key.startsWith('data.')) continue
          if (dataBindings?.[key] !== dataRef) {
            ops.push({ op: 'set_data_binding', nodeId: node.id, key, dataRef })
          }
        }
      }
    }

    if (ops.length) onOps(ops)
  }

  function setMarks(patch: Partial<SiteChartStyle>) {
    const next = patchChartStyle(cascaded.props.chartStyle, patch)
    onOps([{ op: 'set_prop', nodeId: node.id, key: 'chartStyle', value: next }])
  }

  function bindSource(dataRef: string, item?: CollectionDataCatalogItem) {
    const ops: SceneOp[] = [
      {
        op: 'set_data_binding',
        nodeId: node.id,
        key: CHART_SERIES_SOURCE_BINDING_KEY,
        dataRef,
      },
      {
        op: 'set_prop',
        nodeId: node.id,
        key: 'chartDataMap',
        value: defaultChartDataMap(item?.fields ?? fieldsForSourceRef(dataRef)),
      },
    ]
    for (const key of Object.keys(dataBindings ?? {})) {
      if (parseChartSeriesValueBindingKey(key) != null) {
        ops.push({ op: 'clear_data_binding', nodeId: node.id, key })
      }
    }
    onOps(ops)
  }

  function clearSource() {
    const ops: SceneOp[] = [
      {
        op: 'clear_data_binding',
        nodeId: node.id,
        key: CHART_SERIES_SOURCE_BINDING_KEY,
      },
      { op: 'set_prop', nodeId: node.id, key: 'chartDataMap', value: null },
    ]
    onOps(ops)
  }

  function setChartDataMap(next: ChartDataMap) {
    onOps([{ op: 'set_prop', nodeId: node.id, key: 'chartDataMap', value: next }])
  }

  return (
    <div className="creation-chart-studio" data-testid="creation-chart-studio">
      <FloatingPanel
        storageKey={paths.chartStudioDockStorageKey}
        defaultEdge="right"
        defaultOffset={1.5}
        title={t('editor.chartStudioTitle')}
        ariaLabel={t('editor.chartStudioTitle')}
        variant="panel"
        surface="solid"
        zIndex={40}
        className="creation-chart-studio__panel"
      >
        <div className="creation-chart-studio__toolbar">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            data-testid="chart-studio-dismiss"
            onClick={onDismiss}
          >
            {t('editor.chartStudioHide')}
          </Button>
        </div>

        <div className="creation-chart-studio__body ds-inspect-density">
          <ChartStudioDataSourceSection
            sourceRef={sourceRef}
            chartDataMap={chartDataMap}
            fields={fields}
            platformProjectId={platformProjectId}
            sourceError={sourceError}
            sourceEmpty={sourceEmpty}
            onBindSource={bindSource}
            onClearSource={clearSource}
            onChangeMap={setChartDataMap}
            t={t}
          />

          <div data-testid="chart-studio-kind">
            <Field
              label={t('editor.chartStudioKind')}
              icon={chartStudioFieldIcon('chartType')}
              size="sm"
            >
              <Select
                value={chartType}
                onChange={setChartType}
                options={CHART_TYPE_OPTIONS}
                aria-label={t('editor.chartStudioKind')}
                size="sm"
              />
            </Field>
          </div>

          <ChartStudioSeriesTable
            points={points}
            dataBindings={dataBindings}
            platformProjectId={platformProjectId}
            sourceBound={sourceBound}
            onChange={setSeries}
            onBindValue={(index, dataRef) =>
              onOps([
                {
                  op: 'set_data_binding',
                  nodeId: node.id,
                  key: chartSeriesValueBindingKey(index),
                  dataRef,
                },
              ])
            }
            onClearValue={(index) =>
              onOps([
                {
                  op: 'clear_data_binding',
                  nodeId: node.id,
                  key: chartSeriesValueBindingKey(index),
                },
              ])
            }
            t={t}
          />

          <ChartStudioMarksSection
            chartType={chartType}
            chartStyle={chartStyle}
            onChange={setMarks}
            t={t}
          />
        </div>
      </FloatingPanel>
    </div>
  )
}

/** Prop names Chart studio owns — hide from Inspect Component when studio is available. */
export { CHART_STUDIO_OWNED_PROP_NAMES }
