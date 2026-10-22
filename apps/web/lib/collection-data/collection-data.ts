/**
 * Collection data bind — fixture catalog + upstream fetch (server/BFF only).
 * Spec: specs/domain/collection-data-bind.md · specs/api/collection-data-bff.md
 * Browser MUST NOT import this with secrets — use collection-data-core for client helpers.
 */

import { getFederationContractHeaders } from '../federation-contract'
import {
  checkionUpstreamProvisioningProjectUrl,
  metronUpstreamKpiEvaluateUrl,
  metronUpstreamKpisUrl,
} from '../paths'
import { checkionApiUrl, getServiceSecret, metronApiUrl } from '../runtime-config'
import {
  CHECKION_FACET_SERIES_FIELDS,
  CHECKION_LATEST_FACETS_REF,
  CHECKION_LATEST_SCORES_REF,
  CHECKION_SCORE_CARD_FIELDS,
  CHECKION_SCORE_HISTORY_FIELDS,
  CHECKION_SCORE_HISTORY_REF,
  METRON_COLLECTION_KPIS_REF,
  METRON_KPI_SERIES_FIELDS,
  checkionScanScoresRef,
  parseCollectionDataRef,
  splitCollectionScopedRef,
  type CollectionDataCatalogItem,
  type CollectionDataResolvedValue,
  type ParsedCollectionDataRef,
} from './collection-data-core'

export type {
  ChartDataMap,
  CollectionDataCatalogItem,
  CollectionDataField,
  CollectionDataKind,
  CollectionDataProduct,
  CollectionDataResolvedValue,
  ParsedCollectionDataRef,
} from './collection-data-core'

export {
  CHART_SERIES_SOURCE_BINDING_KEY,
  CHECKION_FACET_SERIES_FIELDS,
  CHECKION_LATEST_FACETS_REF,
  CHECKION_LATEST_SCORES_REF,
  CHECKION_SCORE_CARD_FIELDS,
  CHECKION_SCORE_HISTORY_FIELDS,
  CHECKION_SCORE_HISTORY_REF,
  COLLECTION_DATA_BINDABLE_KEYS,
  METRON_COLLECTION_KPIS_REF,
  METRON_KPI_SERIES_FIELDS,
  applyDataBindingsToProps,
  chartSeriesValueBindingKey,
  checkionScanScoresRef,
  clearPerRowChartDataBindings,
  defaultChartDataMap,
  isChartSeriesCatalogKind,
  isCollectionDataBindableKey,
  mapSourceRowsToChartPoints,
  parseChartSeriesValueBindingKey,
  parseCollectionDataRef,
  readChartDataMap,
  remapChartSeriesDataBindings,
  scopeCollectionDataRef,
  splitCollectionScopedRef,
} from './collection-data-core'

export type CollectionDataCatalogResult = {
  source: 'live' | 'fixture'
  platformProjectId: string
  items: CollectionDataCatalogItem[]
}

export type CollectionDataResolveResult = {
  platformProjectId: string
  values: Record<string, CollectionDataResolvedValue>
}

const FIXTURE_KPI_ID = 'kpi_fixture_demo'
const FIXTURE_SCORE = 78
const FIXTURE_ISSUES = 12
const FIXTURE_KPI_VALUE = 42
const FIXTURE_SCAN_ID = 'scan_fixture_demo'
const CATALOG_SCAN_CAP = 25

type CheckionScoreCard = {
  kind: string
  label: string
  value: number
  max: number
}

type CheckionHistoryRow = {
  id: string
  url: string
  overallScore: number | null
  issueCount: number
  completedAt: string | null
  source?: string
}

type CheckionDistillate = {
  latestCompletedScan?: {
    id?: string
    url?: string
    overallScore?: number | null
    issueCount?: number
    completedAt?: string | null
    scores?: CheckionScoreCard[]
  } | null
  scoreHistory?: CheckionHistoryRow[]
  recentScanScoreCards?: Array<{
    scanId: string
    url?: string
    completedAt?: string | null
    overallScore?: number | null
    kind: string
    label: string
    value: number
    max: number
  }>
}

type CheckionFetchResult =
  | { status: 'ok'; body: CheckionDistillate }
  | { status: 'not_found' }
  | { status: 'unconfigured' }
  | { status: 'error'; error: string }

export function fixtureCatalogItems(): CollectionDataCatalogItem[] {
  return [
    {
      ref: `metron.kpi.${FIXTURE_KPI_ID}.value`,
      label: 'Demo KPI',
      product: 'metron',
      kind: 'kpi_value',
      hint: 'Fixture evaluate',
    },
    {
      ref: METRON_COLLECTION_KPIS_REF,
      label: 'Collection KPIs (chart)',
      product: 'metron',
      kind: 'chart_series',
      hint: 'One row per active KPI',
      fields: METRON_KPI_SERIES_FIELDS,
    },
    {
      ref: 'checkion.scan.latest.overallScore',
      label: 'Latest scan score',
      product: 'checkion',
      kind: 'scan_score',
      hint: 'Fixture score',
    },
    {
      ref: 'checkion.scan.latest.issueCount',
      label: 'Latest issue count',
      product: 'checkion',
      kind: 'scan_issue_count',
      hint: 'Fixture issues',
    },
    {
      ref: CHECKION_LATEST_SCORES_REF,
      label: 'Latest scan scores (chart)',
      product: 'checkion',
      kind: 'chart_series',
      hint: 'Score cards',
      fields: CHECKION_SCORE_CARD_FIELDS,
    },
    {
      ref: checkionScanScoresRef(FIXTURE_SCAN_ID),
      label: 'Demo scan scores (chart)',
      product: 'checkion',
      kind: 'chart_series',
      hint: 'example.com · fixture',
      fields: CHECKION_SCORE_CARD_FIELDS,
    },
    {
      ref: CHECKION_SCORE_HISTORY_REF,
      label: 'Score history (chart)',
      product: 'checkion',
      kind: 'chart_series',
      hint: 'Overall score over scans',
      fields: CHECKION_SCORE_HISTORY_FIELDS,
    },
    {
      ref: CHECKION_LATEST_FACETS_REF,
      label: 'Latest scan facets (chart)',
      product: 'checkion',
      kind: 'chart_series',
      hint: 'Score + issue count as rows',
      fields: CHECKION_FACET_SERIES_FIELDS,
    },
  ]
}

function fixtureScoreRows(): Array<Record<string, unknown>> {
  return [
    { label: 'Performance', value: 82, kind: 'performance', max: 100 },
    { label: 'Accessibility', value: 74, kind: 'accessibility', max: 100 },
    { label: 'SEO', value: 91, kind: 'seo', max: 100 },
  ]
}

export function fixtureResolve(ref: string): CollectionDataResolvedValue | null {
  if (ref === `metron.kpi.${FIXTURE_KPI_ID}.value`) {
    return {
      status: 'ok',
      display: String(FIXTURE_KPI_VALUE),
      numeric: FIXTURE_KPI_VALUE,
      source: 'fixture',
    }
  }
  if (ref === METRON_COLLECTION_KPIS_REF) {
    return {
      status: 'ok',
      display: '2 KPIs',
      source: 'fixture',
      rows: [
        { name: 'Demo KPI', value: FIXTURE_KPI_VALUE },
        { name: 'Demo KPI B', value: 18 },
      ],
      fields: METRON_KPI_SERIES_FIELDS,
    }
  }
  if (ref === 'checkion.scan.latest.overallScore') {
    return {
      status: 'ok',
      display: String(FIXTURE_SCORE),
      numeric: FIXTURE_SCORE,
      source: 'fixture',
    }
  }
  if (ref === 'checkion.scan.latest.issueCount') {
    return {
      status: 'ok',
      display: String(FIXTURE_ISSUES),
      numeric: FIXTURE_ISSUES,
      source: 'fixture',
    }
  }
  if (ref === CHECKION_LATEST_FACETS_REF) {
    return {
      status: 'ok',
      display: '2 facets',
      source: 'fixture',
      rows: [
        { label: 'Overall score', value: FIXTURE_SCORE },
        { label: 'Issue count', value: FIXTURE_ISSUES },
      ],
      fields: CHECKION_FACET_SERIES_FIELDS,
    }
  }
  if (ref === CHECKION_LATEST_SCORES_REF || ref === checkionScanScoresRef(FIXTURE_SCAN_ID)) {
    const rows = fixtureScoreRows()
    return {
      status: 'ok',
      display: `${rows.length} scores`,
      source: 'fixture',
      rows,
      fields: CHECKION_SCORE_CARD_FIELDS,
    }
  }
  if (ref === CHECKION_SCORE_HISTORY_REF) {
    return {
      status: 'ok',
      display: '2 scans',
      source: 'fixture',
      rows: [
        {
          label: 'example.com · latest',
          value: FIXTURE_SCORE,
          issueCount: FIXTURE_ISSUES,
          completedAt: '2026-10-01T12:00:00.000Z',
        },
        {
          label: 'example.com · prior',
          value: 71,
          issueCount: 18,
          completedAt: '2026-09-20T12:00:00.000Z',
        },
      ],
      fields: CHECKION_SCORE_HISTORY_FIELDS,
    }
  }
  return null
}

function serviceHeaders(actorUserId: string): HeadersInit {
  const secret = getServiceSecret()
  return {
    accept: 'application/json',
    ...getFederationContractHeaders(secret || undefined),
    'X-Actor-User-Id': actorUserId,
  }
}

type MetronKpiRow = { id: string; name: string }

async function fetchMetronKpiRows(
  platformProjectId: string,
  actorUserId: string,
): Promise<MetronKpiRow[] | null> {
  const base = metronApiUrl()
  const secret = getServiceSecret()
  if (!base || !secret) return null
  try {
    const res = await fetch(metronUpstreamKpisUrl(base, platformProjectId), {
      method: 'GET',
      headers: serviceHeaders(actorUserId),
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const body = (await res.json()) as { items?: unknown }
    const raw = Array.isArray(body.items) ? body.items : []
    const rows: MetronKpiRow[] = []
    for (const entry of raw) {
      if (!entry || typeof entry !== 'object') continue
      const row = entry as Record<string, unknown>
      if (typeof row.id !== 'string' || !row.id) continue
      if (row.status === 'archived') continue
      const name = typeof row.name === 'string' && row.name.trim() ? row.name.trim() : row.id
      rows.push({ id: row.id, name })
    }
    return rows
  } catch {
    return null
  }
}

async function fetchMetronKpiItems(
  platformProjectId: string,
  actorUserId: string,
): Promise<CollectionDataCatalogItem[] | null> {
  const rows = await fetchMetronKpiRows(platformProjectId, actorUserId)
  if (!rows) return null
  const items: CollectionDataCatalogItem[] = rows.map((row) => ({
    ref: `metron.kpi.${row.id}.value`,
    label: row.name,
    product: 'metron',
    kind: 'kpi_value',
    hint: 'KPI evaluate',
  }))
  items.push({
    ref: METRON_COLLECTION_KPIS_REF,
    label: 'Collection KPIs (chart)',
    product: 'metron',
    kind: 'chart_series',
    hint: rows.length ? `${rows.length} active KPIs` : 'No active KPIs yet',
    fields: METRON_KPI_SERIES_FIELDS,
  })
  return items
}

async function fetchCheckionDistillate(
  platformProjectId: string,
  actorUserId: string,
): Promise<CheckionFetchResult> {
  const base = checkionApiUrl()
  const secret = getServiceSecret()
  if (!base || !secret) return { status: 'unconfigured' }
  try {
    const res = await fetch(checkionUpstreamProvisioningProjectUrl(base, platformProjectId), {
      method: 'GET',
      headers: serviceHeaders(actorUserId),
      signal: AbortSignal.timeout(12_000),
      cache: 'no-store',
    })
    if (res.status === 404) return { status: 'not_found' }
    if (!res.ok) return { status: 'error', error: `checkion_failed_${res.status}` }
    const body = (await res.json()) as CheckionDistillate
    return { status: 'ok', body }
  } catch {
    return { status: 'error', error: 'checkion_unreachable' }
  }
}

function shortUrl(url: string | undefined | null): string {
  if (!url?.trim()) return 'Scan'
  try {
    const u = new URL(url)
    return u.hostname || url
  } catch {
    return url.length > 40 ? `${url.slice(0, 37)}…` : url
  }
}

function formatScanWhen(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = Date.parse(iso)
  if (!Number.isFinite(d)) return ''
  return new Date(d).toISOString().slice(0, 10)
}

function scoreHistoryLabel(row: CheckionHistoryRow): string {
  const host = shortUrl(row.url)
  const when = formatScanWhen(row.completedAt)
  return when ? `${host} · ${when}` : host
}

function catalogFromDistillate(body: CheckionDistillate): CollectionDataCatalogItem[] {
  const latest = body.latestCompletedScan
  const history = Array.isArray(body.scoreHistory) ? body.scoreHistory : []
  const urlHint = typeof latest?.url === 'string' ? latest.url : undefined
  const items: CollectionDataCatalogItem[] = [
    {
      ref: 'checkion.scan.latest.overallScore',
      label: 'Latest scan score',
      product: 'checkion',
      kind: 'scan_score',
      hint: urlHint ?? (history.length ? 'Latest completed scan' : 'No completed scan yet'),
    },
    {
      ref: 'checkion.scan.latest.issueCount',
      label: 'Latest issue count',
      product: 'checkion',
      kind: 'scan_issue_count',
      hint: urlHint ?? (history.length ? 'Latest completed scan' : 'No completed scan yet'),
    },
    {
      ref: CHECKION_LATEST_SCORES_REF,
      label: 'Latest scan scores (chart)',
      product: 'checkion',
      kind: 'chart_series',
      hint: latest?.scores?.length
        ? `${latest.scores.length} score cards · ${shortUrl(latest.url)}`
        : 'No score cards yet',
      fields: CHECKION_SCORE_CARD_FIELDS,
    },
    {
      ref: CHECKION_SCORE_HISTORY_REF,
      label: 'Score history (chart)',
      product: 'checkion',
      kind: 'chart_series',
      hint: history.length ? `${history.length} completed scans` : 'No completed scans yet',
      fields: CHECKION_SCORE_HISTORY_FIELDS,
    },
    {
      ref: CHECKION_LATEST_FACETS_REF,
      label: 'Latest scan facets (chart)',
      product: 'checkion',
      kind: 'chart_series',
      hint: 'Overall score + issue count',
      fields: CHECKION_FACET_SERIES_FIELDS,
    },
  ]

  const seen = new Set<string>()
  for (const row of history) {
    if (!row?.id || seen.has(row.id)) continue
    seen.add(row.id)
    if (seen.size > CATALOG_SCAN_CAP) break
    items.push({
      ref: checkionScanScoresRef(row.id),
      label: `Scan scores · ${scoreHistoryLabel(row)}`,
      product: 'checkion',
      kind: 'chart_series',
      hint:
        row.overallScore != null && Number.isFinite(row.overallScore)
          ? `Overall ${row.overallScore}`
          : row.source ?? 'Completed scan',
      fields: CHECKION_SCORE_CARD_FIELDS,
    })
  }
  return items
}

async function fetchCheckionCatalogItems(
  platformProjectId: string,
  actorUserId: string,
): Promise<{ items: CollectionDataCatalogItem[]; mode: 'live' | 'fixture' | 'empty' } | null> {
  const hit = await fetchCheckionDistillate(platformProjectId, actorUserId)
  if (hit.status === 'unconfigured' || hit.status === 'error') return null
  if (hit.status === 'not_found') {
    return {
      mode: 'empty',
      items: [
        {
          ref: CHECKION_LATEST_SCORES_REF,
          label: 'Latest scan scores (chart)',
          product: 'checkion',
          kind: 'chart_series',
          hint: 'Checkion project not provisioned for this Collection',
          fields: CHECKION_SCORE_CARD_FIELDS,
        },
        {
          ref: CHECKION_SCORE_HISTORY_REF,
          label: 'Score history (chart)',
          product: 'checkion',
          kind: 'chart_series',
          hint: 'Checkion project not provisioned for this Collection',
          fields: CHECKION_SCORE_HISTORY_FIELDS,
        },
      ],
    }
  }
  return { mode: 'live', items: catalogFromDistillate(hit.body) }
}

export async function buildCollectionDataCatalog(
  platformProjectId: string,
  actorUserId: string,
): Promise<CollectionDataCatalogResult> {
  const [metron, checkion] = await Promise.all([
    fetchMetronKpiItems(platformProjectId, actorUserId),
    fetchCheckionCatalogItems(platformProjectId, actorUserId),
  ])
  const items: CollectionDataCatalogItem[] = []
  let live = false
  if (metron) {
    live = true
    items.push(...metron)
  } else {
    items.push(...fixtureCatalogItems().filter((i) => i.product === 'metron'))
  }
  if (checkion) {
    live = true
    items.push(...checkion.items)
  } else {
    items.push(...fixtureCatalogItems().filter((i) => i.product === 'checkion'))
  }
  return {
    source: live ? 'live' : 'fixture',
    platformProjectId,
    items,
  }
}

async function resolveMetronKpi(
  kpiId: string,
  actorUserId: string,
): Promise<CollectionDataResolvedValue> {
  const fixture = fixtureResolve(`metron.kpi.${kpiId}.value`)
  if (kpiId === FIXTURE_KPI_ID && fixture) return fixture

  const base = metronApiUrl()
  const secret = getServiceSecret()
  if (!base || !secret) {
    return fixture ?? { status: 'error', error: 'metron_unconfigured', source: 'metron' }
  }
  try {
    const res = await fetch(metronUpstreamKpiEvaluateUrl(base, kpiId), {
      method: 'POST',
      headers: {
        ...serviceHeaders(actorUserId),
        'content-type': 'application/json',
      },
      body: '{}',
      signal: AbortSignal.timeout(15_000),
      cache: 'no-store',
    })
    if (res.status === 404) {
      return { status: 'error', error: 'not_found', source: 'metron' }
    }
    if (!res.ok) {
      return { status: 'error', error: `metron_evaluate_failed_${res.status}`, source: 'metron' }
    }
    const body = (await res.json()) as {
      value?: unknown
      status?: unknown
      error?: unknown
    }
    if (body.status === 'error') {
      return {
        status: 'error',
        error: typeof body.error === 'string' ? body.error : 'evaluate_error',
        source: 'metron',
      }
    }
    const numeric = typeof body.value === 'number' && Number.isFinite(body.value) ? body.value : null
    return {
      status: 'ok',
      display: numeric == null ? '—' : String(numeric),
      numeric,
      source: 'metron',
    }
  } catch {
    return { status: 'error', error: 'metron_unreachable', source: 'metron' }
  }
}

async function resolveMetronCollectionKpis(
  platformProjectId: string,
  actorUserId: string,
): Promise<CollectionDataResolvedValue> {
  const fixture = fixtureResolve(METRON_COLLECTION_KPIS_REF)!
  const rows = await fetchMetronKpiRows(platformProjectId, actorUserId)
  if (!rows) {
    const base = metronApiUrl()
    const secret = getServiceSecret()
    if (!base || !secret) return fixture
    return { status: 'error', error: 'metron_unreachable', source: 'metron' }
  }
  if (rows.length === 0) {
    return {
      status: 'ok',
      display: '0 KPIs',
      source: 'metron',
      rows: [],
      fields: METRON_KPI_SERIES_FIELDS,
    }
  }
  const evaluated = await Promise.all(
    rows.map(async (row) => {
      const hit = await resolveMetronKpi(row.id, actorUserId)
      return {
        name: row.name,
        value: hit.status === 'ok' && hit.numeric != null ? hit.numeric : null,
      }
    }),
  )
  const seriesRows = evaluated
    .filter((r) => r.value != null)
    .map((r) => ({ name: r.name, value: r.value as number }))
  return {
    status: 'ok',
    display: `${seriesRows.length} KPIs`,
    source: 'metron',
    rows: seriesRows,
    fields: METRON_KPI_SERIES_FIELDS,
  }
}

function rowsFromScoreCards(
  cards: Array<{ label: string; value: number; kind?: string; max?: number }>,
): Array<Record<string, unknown>> {
  return cards
    .filter((c) => typeof c.value === 'number' && Number.isFinite(c.value))
    .map((c) => ({
      label: c.label || c.kind || 'Score',
      value: c.value,
      kind: c.kind ?? '',
      max: typeof c.max === 'number' ? c.max : 100,
    }))
}

function rowsFromHistory(history: CheckionHistoryRow[]): Array<Record<string, unknown>> {
  return history
    .filter((h) => h && typeof h.overallScore === 'number' && Number.isFinite(h.overallScore))
    .map((h) => ({
      label: scoreHistoryLabel(h),
      value: h.overallScore as number,
      issueCount: typeof h.issueCount === 'number' ? h.issueCount : 0,
      completedAt: h.completedAt ?? '',
      id: h.id,
    }))
}

async function resolveCheckionChartSeries(
  parsed: Extract<ParsedCollectionDataRef, { product: 'checkion'; kind: 'chart_series' }>,
  platformProjectId: string,
  actorUserId: string,
): Promise<CollectionDataResolvedValue> {
  const fixtureRef =
    parsed.series === 'latest_facets'
      ? CHECKION_LATEST_FACETS_REF
      : parsed.series === 'latest_scores'
        ? CHECKION_LATEST_SCORES_REF
        : parsed.series === 'score_history'
          ? CHECKION_SCORE_HISTORY_REF
          : parsed.scanId
            ? checkionScanScoresRef(parsed.scanId)
            : CHECKION_LATEST_SCORES_REF
  const fixture = fixtureResolve(fixtureRef)

  const hit = await fetchCheckionDistillate(platformProjectId, actorUserId)
  if (hit.status === 'unconfigured') {
    return fixture ?? { status: 'error', error: 'checkion_unconfigured', source: 'checkion' }
  }
  if (hit.status === 'not_found') {
    return {
      status: 'error',
      error: 'checkion_project_not_found',
      source: 'checkion',
    }
  }
  if (hit.status === 'error') {
    return fixture ?? { status: 'error', error: hit.error, source: 'checkion' }
  }

  const body = hit.body
  const latest = body.latestCompletedScan
  const history = Array.isArray(body.scoreHistory) ? body.scoreHistory : []
  const cards = Array.isArray(body.recentScanScoreCards) ? body.recentScanScoreCards : []

  if (parsed.series === 'latest_facets') {
    const rows: Array<Record<string, unknown>> = []
    if (typeof latest?.overallScore === 'number' && Number.isFinite(latest.overallScore)) {
      rows.push({ label: 'Overall score', value: latest.overallScore })
    }
    if (typeof latest?.issueCount === 'number' && Number.isFinite(latest.issueCount)) {
      rows.push({ label: 'Issue count', value: latest.issueCount })
    }
    return {
      status: 'ok',
      display: `${rows.length} facets`,
      source: 'checkion',
      rows,
      fields: CHECKION_FACET_SERIES_FIELDS,
    }
  }

  if (parsed.series === 'score_history') {
    const rows = rowsFromHistory(history)
    return {
      status: 'ok',
      display: `${rows.length} scans`,
      source: 'checkion',
      rows,
      fields: CHECKION_SCORE_HISTORY_FIELDS,
    }
  }

  if (parsed.series === 'latest_scores') {
    const fromLatest = Array.isArray(latest?.scores) ? latest!.scores! : []
    let rows = rowsFromScoreCards(fromLatest)
    if (!rows.length && latest?.id) {
      rows = rowsFromScoreCards(cards.filter((c) => c.scanId === latest.id))
    }
    return {
      status: 'ok',
      display: `${rows.length} scores`,
      source: 'checkion',
      rows,
      fields: CHECKION_SCORE_CARD_FIELDS,
    }
  }

  // scan_scores for specific id
  const scanId = parsed.scanId!
  let rows = rowsFromScoreCards(cards.filter((c) => c.scanId === scanId))
  if (!rows.length && latest?.id === scanId && Array.isArray(latest.scores)) {
    rows = rowsFromScoreCards(latest.scores)
  }
  if (!rows.length) {
    // Fall back to overall + issues so the chart is not blank for history-only rows
    const hist = history.find((h) => h.id === scanId)
    if (hist) {
      const facetRows: Array<Record<string, unknown>> = []
      if (typeof hist.overallScore === 'number' && Number.isFinite(hist.overallScore)) {
        facetRows.push({ label: 'Overall score', value: hist.overallScore, kind: 'overall', max: 100 })
      }
      if (typeof hist.issueCount === 'number' && Number.isFinite(hist.issueCount)) {
        facetRows.push({ label: 'Issue count', value: hist.issueCount, kind: 'issues', max: 0 })
      }
      return {
        status: 'ok',
        display: `${facetRows.length} facets`,
        source: 'checkion',
        rows: facetRows,
        fields: CHECKION_SCORE_CARD_FIELDS,
      }
    }
  }
  return {
    status: 'ok',
    display: `${rows.length} scores`,
    source: 'checkion',
    rows,
    fields: CHECKION_SCORE_CARD_FIELDS,
  }
}

async function resolveCheckionFacet(
  parsed: Extract<
    ParsedCollectionDataRef,
    { product: 'checkion'; kind: 'scan_score' | 'scan_issue_count' }
  >,
  platformProjectId: string,
  actorUserId: string,
): Promise<CollectionDataResolvedValue> {
  const ref =
    parsed.scanId === 'latest'
      ? `checkion.scan.latest.${parsed.kind === 'scan_score' ? 'overallScore' : 'issueCount'}`
      : `checkion.scan.${parsed.scanId}.${parsed.kind === 'scan_score' ? 'overallScore' : 'issueCount'}`
  const fixture = fixtureResolve(ref)

  const hit = await fetchCheckionDistillate(platformProjectId, actorUserId)
  if (hit.status === 'unconfigured') {
    return fixture ?? { status: 'error', error: 'checkion_unconfigured', source: 'checkion' }
  }
  if (hit.status === 'not_found') {
    return { status: 'error', error: 'not_found', source: 'checkion' }
  }
  if (hit.status === 'error') {
    return fixture ?? { status: 'error', error: hit.error, source: 'checkion' }
  }

  const body = hit.body
  let scan: { overallScore?: number | null; issueCount?: number } | null = null
  if (parsed.scanId === 'latest') {
    scan = body.latestCompletedScan ?? null
  } else if (Array.isArray(body.scoreHistory)) {
    scan = body.scoreHistory.find((s) => s && s.id === parsed.scanId) ?? null
  }
  if (!scan) {
    return { status: 'error', error: 'not_found', source: 'checkion' }
  }
  if (parsed.kind === 'scan_score') {
    const numeric =
      typeof scan.overallScore === 'number' && Number.isFinite(scan.overallScore)
        ? scan.overallScore
        : null
    return {
      status: 'ok',
      display: numeric == null ? '—' : String(numeric),
      numeric,
      source: 'checkion',
    }
  }
  const numeric =
    typeof scan.issueCount === 'number' && Number.isFinite(scan.issueCount) ? scan.issueCount : null
  return {
    status: 'ok',
    display: numeric == null ? '—' : String(numeric),
    numeric,
    source: 'checkion',
  }
}

async function resolveOneLocalRef(
  platformProjectId: string,
  actorUserId: string,
  localRef: string,
): Promise<CollectionDataResolvedValue> {
  const parsed = parseCollectionDataRef(localRef)
  if (!parsed) {
    return { status: 'error', error: 'invalid_ref', source: 'fixture' }
  }
  // Local parse never keeps scope — strip if somehow present
  const localParsed = { ...parsed, scopePlatformProjectId: undefined }
  if (localParsed.product === 'metron' && localParsed.kind === 'chart_series') {
    return resolveMetronCollectionKpis(platformProjectId, actorUserId)
  }
  if (localParsed.product === 'metron') {
    return resolveMetronKpi(localParsed.kpiId, actorUserId)
  }
  if (localParsed.kind === 'chart_series') {
    return resolveCheckionChartSeries(localParsed, platformProjectId, actorUserId)
  }
  return resolveCheckionFacet(localParsed, platformProjectId, actorUserId)
}

export async function resolveCollectionDataRefs(
  platformProjectId: string,
  actorUserId: string,
  refs: string[],
): Promise<CollectionDataResolveResult> {
  const unique = [...new Set(refs.map((r) => r.trim()).filter(Boolean))]
  const values: Record<string, CollectionDataResolvedValue> = {}

  // Group by target Collection (scoped or scene default)
  const byTarget = new Map<string, Array<{ full: string; local: string }>>()
  for (const full of unique) {
    const { scopePlatformProjectId, localRef } = splitCollectionScopedRef(full)
    const target = scopePlatformProjectId ?? platformProjectId
    const list = byTarget.get(target) ?? []
    list.push({ full, local: localRef })
    byTarget.set(target, list)
  }

  await Promise.all(
    [...byTarget.entries()].map(async ([targetPid, entries]) => {
      await Promise.all(
        entries.map(async ({ full, local }) => {
          values[full] = await resolveOneLocalRef(targetPid, actorUserId, local)
        }),
      )
    }),
  )

  return { platformProjectId, values }
}
