/**
 * Pure Collection data-bind helpers (safe for client + tests).
 * Spec: specs/domain/collection-data-bind.md
 */

export type CollectionDataProduct = 'metron' | 'checkion'
export type CollectionDataKind =
  | 'kpi_value'
  | 'scan_score'
  | 'scan_issue_count'
  | 'chart_series'

export type CollectionDataFieldKind = 'string' | 'number' | 'color'
export type CollectionDataFieldRole = 'label' | 'value' | 'color'

export type CollectionDataField = {
  key: string
  label: string
  kind: CollectionDataFieldKind
  role?: CollectionDataFieldRole
}

export type CollectionDataCatalogItem = {
  ref: string
  label: string
  product: CollectionDataProduct
  kind: CollectionDataKind
  hint?: string
  fields?: CollectionDataField[]
}

export type CollectionDataResolvedValue = {
  status: 'ok' | 'error'
  display?: string
  numeric?: number | null
  /** Chart-series sources: raw rows + field catalog for mapping. */
  rows?: Array<Record<string, unknown>>
  fields?: CollectionDataField[]
  source: CollectionDataProduct | 'fixture'
  error?: string
}

/** Scene prop: map source field keys → chart paint columns. */
export type ChartDataMap = {
  label: string
  value: string
  color?: string | null
}

/** Prop keys Inspect MAY bind as scalars. */
export const COLLECTION_DATA_BINDABLE_KEYS = new Set(['children', 'value'])

export const CHART_SERIES_SOURCE_BINDING_KEY = 'data'

const CHART_SERIES_VALUE_KEY = /^data\.(\d+)\.value$/

export const METRON_COLLECTION_KPIS_REF = 'metron.collection.kpis'
export const CHECKION_LATEST_FACETS_REF = 'checkion.scan.latest.facets'
export const CHECKION_LATEST_SCORES_REF = 'checkion.scan.latest.scores'
export const CHECKION_SCORE_HISTORY_REF = 'checkion.collection.scoreHistory'

/** `collection.{uuid}.` prefix for cross-Collection refs. */
const COLLECTION_SCOPE_RE =
  /^collection\.([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.(.+)$/i

export function splitCollectionScopedRef(ref: string): {
  scopePlatformProjectId: string | null
  localRef: string
} {
  const raw = ref.trim()
  const m = COLLECTION_SCOPE_RE.exec(raw)
  if (m?.[1] && m[2]) {
    return { scopePlatformProjectId: m[1], localRef: m[2] }
  }
  return { scopePlatformProjectId: null, localRef: raw }
}

/** Prefix a local ref when binding from a Collection other than the open scene. */
export function scopeCollectionDataRef(
  localRef: string,
  sourcePlatformProjectId: string | null | undefined,
  scenePlatformProjectId: string | null | undefined,
): string {
  const local = localRef.trim()
  const source = sourcePlatformProjectId?.trim() || ''
  const scene = scenePlatformProjectId?.trim() || ''
  if (!source || !scene || source === scene) return local
  if (COLLECTION_SCOPE_RE.test(local)) return local
  return `collection.${source}.${local}`
}

export const METRON_KPI_SERIES_FIELDS: CollectionDataField[] = [
  { key: 'name', label: 'Name', kind: 'string', role: 'label' },
  { key: 'value', label: 'Value', kind: 'number', role: 'value' },
]

export const CHECKION_FACET_SERIES_FIELDS: CollectionDataField[] = [
  { key: 'label', label: 'Label', kind: 'string', role: 'label' },
  { key: 'value', label: 'Value', kind: 'number', role: 'value' },
]

export const CHECKION_SCORE_CARD_FIELDS: CollectionDataField[] = [
  { key: 'label', label: 'Label', kind: 'string', role: 'label' },
  { key: 'value', label: 'Value', kind: 'number', role: 'value' },
  { key: 'kind', label: 'Kind', kind: 'string' },
  { key: 'max', label: 'Max', kind: 'number' },
]

export const CHECKION_SCORE_HISTORY_FIELDS: CollectionDataField[] = [
  { key: 'label', label: 'Label', kind: 'string', role: 'label' },
  { key: 'value', label: 'Overall score', kind: 'number', role: 'value' },
  { key: 'issueCount', label: 'Issues', kind: 'number' },
  { key: 'completedAt', label: 'Completed', kind: 'string' },
]

export function checkionScanScoresRef(scanId: string): string {
  return `checkion.scan.${scanId}.scores`
}

export function isCollectionDataBindableKey(key: string): boolean {
  return (
    COLLECTION_DATA_BINDABLE_KEYS.has(key) ||
    key === CHART_SERIES_SOURCE_BINDING_KEY ||
    CHART_SERIES_VALUE_KEY.test(key)
  )
}

export function isChartSeriesCatalogKind(kind: CollectionDataKind): boolean {
  return kind === 'chart_series'
}

export function chartSeriesValueBindingKey(index: number): string {
  return `data.${index}.value`
}

export function parseChartSeriesValueBindingKey(key: string): number | null {
  const m = CHART_SERIES_VALUE_KEY.exec(key.trim())
  if (!m?.[1]) return null
  const idx = Number(m[1])
  return Number.isInteger(idx) && idx >= 0 ? idx : null
}

/**
 * Remap `data.N.value` bindings after series remove/reorder.
 * `mapIndex(old) → new | null` (null drops the binding).
 */
export function remapChartSeriesDataBindings(
  bindings: Record<string, string> | undefined,
  mapIndex: (oldIndex: number) => number | null,
): Record<string, string> | undefined {
  if (!bindings) return undefined
  const next: Record<string, string> = {}
  let changed = false
  for (const [key, ref] of Object.entries(bindings)) {
    const idx = parseChartSeriesValueBindingKey(key)
    if (idx == null) {
      next[key] = ref
      continue
    }
    const mapped = mapIndex(idx)
    if (mapped == null) {
      changed = true
      continue
    }
    const nextKey = chartSeriesValueBindingKey(mapped)
    if (nextKey !== key) changed = true
    next[nextKey] = ref
  }
  if (!changed && Object.keys(next).length === Object.keys(bindings).length) {
    return bindings
  }
  return Object.keys(next).length ? next : undefined
}

/** Drop all `data.N.value` bindings when a whole-series source is set. */
export function clearPerRowChartDataBindings(
  bindings: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!bindings) return undefined
  const next: Record<string, string> = {}
  let changed = false
  for (const [key, ref] of Object.entries(bindings)) {
    if (parseChartSeriesValueBindingKey(key) != null) {
      changed = true
      continue
    }
    next[key] = ref
  }
  if (!changed) return bindings
  return Object.keys(next).length ? next : undefined
}

export function defaultChartDataMap(fields: CollectionDataField[] | undefined): ChartDataMap {
  const label =
    fields?.find((f) => f.role === 'label')?.key ??
    fields?.find((f) => f.kind === 'string')?.key ??
    'label'
  const value =
    fields?.find((f) => f.role === 'value')?.key ??
    fields?.find((f) => f.kind === 'number')?.key ??
    'value'
  const color = fields?.find((f) => f.role === 'color')?.key ?? null
  return color ? { label, value, color } : { label, value, color: null }
}

export function readChartDataMap(raw: unknown): ChartDataMap | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Record<string, unknown>
  if (typeof row.label !== 'string' || !row.label.trim()) return null
  if (typeof row.value !== 'string' || !row.value.trim()) return null
  const color =
    typeof row.color === 'string' && row.color.trim() ? row.color.trim() : null
  return { label: row.label.trim(), value: row.value.trim(), color }
}

export function mapSourceRowsToChartPoints(
  rows: Array<Record<string, unknown>> | undefined,
  map: ChartDataMap,
): Array<{ label: string; value: number; color?: string }> {
  if (!rows?.length) return []
  const out: Array<{ label: string; value: number; color?: string }> = []
  for (const row of rows) {
    const labelRaw = row[map.label]
    const valueRaw = row[map.value]
    const label =
      labelRaw == null || labelRaw === ''
        ? '—'
        : typeof labelRaw === 'string'
          ? labelRaw
          : String(labelRaw)
    const numeric =
      typeof valueRaw === 'number' && Number.isFinite(valueRaw)
        ? valueRaw
        : Number(valueRaw)
    if (!Number.isFinite(numeric)) continue
    const point: { label: string; value: number; color?: string } = {
      label,
      value: numeric,
    }
    if (map.color) {
      const colorRaw = row[map.color]
      if (typeof colorRaw === 'string' && colorRaw.trim()) {
        point.color = colorRaw.trim()
      }
    }
    out.push(point)
  }
  return out
}

export type ParsedCollectionDataRef =
  | { product: 'metron'; kind: 'kpi_value'; kpiId: string; scopePlatformProjectId?: string | null }
  | {
      product: 'metron'
      kind: 'chart_series'
      series: 'collection_kpis'
      scopePlatformProjectId?: string | null
    }
  | {
      product: 'checkion'
      kind: 'scan_score' | 'scan_issue_count'
      scanId: 'latest' | string
      scopePlatformProjectId?: string | null
    }
  | {
      product: 'checkion'
      kind: 'chart_series'
      series: 'latest_facets' | 'latest_scores' | 'score_history' | 'scan_scores'
      scanId?: string
      scopePlatformProjectId?: string | null
    }

function parseLocalCollectionDataRef(raw: string): ParsedCollectionDataRef | null {
  if (raw === METRON_COLLECTION_KPIS_REF) {
    return { product: 'metron', kind: 'chart_series', series: 'collection_kpis' }
  }
  if (raw === CHECKION_LATEST_FACETS_REF) {
    return { product: 'checkion', kind: 'chart_series', series: 'latest_facets' }
  }
  if (raw === CHECKION_LATEST_SCORES_REF) {
    return { product: 'checkion', kind: 'chart_series', series: 'latest_scores' }
  }
  if (raw === CHECKION_SCORE_HISTORY_REF) {
    return { product: 'checkion', kind: 'chart_series', series: 'score_history' }
  }
  const scanScores = /^checkion\.scan\.([A-Za-z0-9_-]+)\.scores$/.exec(raw)
  if (scanScores?.[1] && scanScores[1] !== 'latest') {
    return {
      product: 'checkion',
      kind: 'chart_series',
      series: 'scan_scores',
      scanId: scanScores[1],
    }
  }
  const metron = /^metron\.kpi\.([A-Za-z0-9_-]+)\.value$/.exec(raw)
  if (metron?.[1]) {
    return { product: 'metron', kind: 'kpi_value', kpiId: metron[1] }
  }
  const checkionLatest = /^checkion\.scan\.latest\.(overallScore|issueCount)$/.exec(raw)
  if (checkionLatest?.[1]) {
    return {
      product: 'checkion',
      kind: checkionLatest[1] === 'overallScore' ? 'scan_score' : 'scan_issue_count',
      scanId: 'latest',
    }
  }
  const checkionScan = /^checkion\.scan\.([A-Za-z0-9_-]+)\.(overallScore|issueCount)$/.exec(raw)
  if (checkionScan?.[1] && checkionScan[2]) {
    return {
      product: 'checkion',
      kind: checkionScan[2] === 'overallScore' ? 'scan_score' : 'scan_issue_count',
      scanId: checkionScan[1],
    }
  }
  return null
}

export function parseCollectionDataRef(ref: string): ParsedCollectionDataRef | null {
  const { scopePlatformProjectId, localRef } = splitCollectionScopedRef(ref)
  const parsed = parseLocalCollectionDataRef(localRef)
  if (!parsed) return null
  if (scopePlatformProjectId) {
    return { ...parsed, scopePlatformProjectId }
  }
  return parsed
}

/** Apply resolved display onto a shallow props clone (scalars + chart source / per-row). */
export function applyDataBindingsToProps(
  props: Record<string, unknown>,
  dataBindings: Record<string, string> | undefined,
  resolved: Record<string, CollectionDataResolvedValue> | undefined,
): Record<string, unknown> {
  if (!dataBindings || !resolved) return props
  const next = { ...props }
  let dataPoints: Array<Record<string, unknown>> | null = null

  const sourceRef = dataBindings[CHART_SERIES_SOURCE_BINDING_KEY]
  if (sourceRef) {
    const hit = resolved[sourceRef]
    if (hit?.status === 'ok' && hit.rows) {
      const map =
        readChartDataMap(next.chartDataMap) ?? defaultChartDataMap(hit.fields)
      const points = mapSourceRowsToChartPoints(hit.rows, map)
      next.data = points
      return next
    }
  }

  for (const [key, ref] of Object.entries(dataBindings)) {
    if (key === CHART_SERIES_SOURCE_BINDING_KEY) continue
    const hit = resolved[ref]
    if (!hit || hit.status !== 'ok' || hit.display == null) continue
    const seriesIdx = parseChartSeriesValueBindingKey(key)
    if (seriesIdx != null) {
      if (!dataPoints) {
        dataPoints = cloneChartDataPoints(next.data)
      }
      while (dataPoints.length <= seriesIdx) {
        dataPoints.push({ label: `Point ${dataPoints.length + 1}`, value: 0 })
      }
      const row = { ...dataPoints[seriesIdx]! }
      row.value = hit.numeric != null ? hit.numeric : Number(hit.display)
      if (!Number.isFinite(row.value as number)) row.value = hit.display
      dataPoints[seriesIdx] = row
      continue
    }
    if (key === 'value' && hit.numeric != null) {
      next[key] = hit.numeric
    } else {
      next[key] = hit.display
    }
  }

  if (dataPoints) next.data = dataPoints
  return next
}

function cloneChartDataPoints(raw: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(raw)) return []
  const out: Array<Record<string, unknown>> = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    out.push({ ...(row as Record<string, unknown>) })
  }
  return out
}
