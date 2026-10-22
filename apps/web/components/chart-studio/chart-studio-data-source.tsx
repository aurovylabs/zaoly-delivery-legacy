'use client'

/**
 * Chart studio — Collection data source + field map.
 * Spec: chart-studio-panel.md Wave 1.4 · collection-data-bind.md
 */

import { useEffect, useMemo, useState } from 'react'
import { Field, Select, Text } from '@zaoly/ui'
import { InspectDataBindField } from '../editor-inspector/inspect-data-bind-field'
import {
  CHART_SERIES_SOURCE_BINDING_KEY,
  defaultChartDataMap,
  readChartDataMap,
  splitCollectionScopedRef,
  type ChartDataMap,
  type CollectionDataCatalogItem,
  type CollectionDataField,
} from '../../lib/collection-data/collection-data-core'
import { chartStudioFieldIcon } from '../../lib/chart-studio/field-icons'
import { collectionDataCollectionsUrl } from '../../lib/paths'

const NONE_VALUE = '__none__'

type CollectionOption = { id: string; name: string }

export function ChartStudioDataSourceSection({
  sourceRef,
  chartDataMap,
  fields,
  platformProjectId,
  sourceError = null,
  sourceEmpty = false,
  onBindSource,
  onClearSource,
  onChangeMap,
  t,
}: {
  sourceRef: string | null
  chartDataMap: ChartDataMap | null
  fields: CollectionDataField[] | undefined
  platformProjectId?: string | null
  sourceError?: string | null
  sourceEmpty?: boolean
  onBindSource: (dataRef: string, item?: CollectionDataCatalogItem) => void
  onClearSource: () => void
  onChangeMap: (next: ChartDataMap) => void
  t: (key: string, vars?: Record<string, string>) => string
}) {
  const scenePid = platformProjectId?.trim() || ''
  const scoped = sourceRef ? splitCollectionScopedRef(sourceRef) : null
  const boundSourcePid = scoped?.scopePlatformProjectId ?? null

  const [collections, setCollections] = useState<CollectionOption[]>([])
  const [collectionsError, setCollectionsError] = useState<string | null>(null)
  const [pickerPid, setPickerPid] = useState(scenePid)

  useEffect(() => {
    if (!scenePid) return
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(collectionDataCollectionsUrl(), {
          headers: { accept: 'application/json' },
          credentials: 'same-origin',
        })
        if (!res.ok) {
          if (!cancelled) {
            setCollectionsError(`http_${res.status}`)
            setCollections(scenePid ? [{ id: scenePid, name: t('editor.chartStudioThisCollection') }] : [])
          }
          return
        }
        const body = (await res.json()) as { items?: CollectionOption[] }
        if (cancelled) return
        const items = Array.isArray(body.items) ? body.items.filter((i) => i?.id) : []
        if (!items.some((i) => i.id === scenePid) && scenePid) {
          items.unshift({ id: scenePid, name: t('editor.chartStudioThisCollection') })
        }
        setCollections(items)
        setCollectionsError(null)
      } catch {
        if (!cancelled) {
          setCollectionsError('unreachable')
          setCollections(scenePid ? [{ id: scenePid, name: t('editor.chartStudioThisCollection') }] : [])
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [scenePid, t])

  // When a source is already bound from another Collection, pin the picker there.
  useEffect(() => {
    if (boundSourcePid) {
      setPickerPid(boundSourcePid)
      return
    }
    if (scenePid) setPickerPid(scenePid)
  }, [boundSourcePid, scenePid])

  const collectionOptions = useMemo(
    () =>
      collections.map((c) => ({
        value: c.id,
        label:
          c.id === scenePid
            ? `${c.name} · ${t('editor.chartStudioThisCollectionSuffix')}`
            : c.name,
      })),
    [collections, scenePid, t],
  )

  const map = chartDataMap ?? defaultChartDataMap(fields)
  const fieldOptions = (fields ?? []).map((f) => ({
    value: f.key,
    label: f.label,
  }))
  const colorOptions = [{ value: NONE_VALUE, label: t('editor.tokenNone') }, ...fieldOptions]
  const showMap = Boolean(sourceRef && fields && fields.length > 0)
  const catalogPid = pickerPid || scenePid

  return (
    <div className="creation-chart-studio__section" data-testid="chart-studio-data-source">
      <Text role="meta" as="p" className="creation-chart-studio__section-title">
        {t('editor.chartStudioDataSource')}
      </Text>

      {scenePid ? (
        <Field
          label={t('editor.chartStudioSourceCollection')}
          icon={chartStudioFieldIcon('chartType')}
          size="sm"
        >
          <Select
            value={catalogPid}
            options={collectionOptions}
            size="sm"
            aria-label={t('editor.chartStudioSourceCollection')}
            data-testid="chart-studio-source-collection"
            disabled={Boolean(sourceRef)}
            onChange={(next) => {
              if (!next || next === pickerPid) return
              setPickerPid(next)
            }}
          />
        </Field>
      ) : null}
      {collectionsError ? (
        <Text role="meta" as="p" className="creation-chart-studio__hint">
          {t('editor.chartStudioCollectionsLoadHint')}
        </Text>
      ) : null}

      <InspectDataBindField
        fieldKey={CHART_SERIES_SOURCE_BINDING_KEY}
        boundRef={sourceRef}
        platformProjectId={scenePid}
        catalogPlatformProjectId={catalogPid}
        scenePlatformProjectId={scenePid}
        mode="chart_series"
        bindLabel={t('editor.chartStudioDataSource')}
        onBind={onBindSource}
        onClear={onClearSource}
      />
      {sourceError ? (
        <Text
          role="meta"
          as="p"
          className="creation-chart-studio__hint"
          data-testid="chart-studio-data-source-error"
        >
          {sourceError === 'checkion_project_not_found'
            ? t('editor.chartStudioDataSourceNotProvisioned')
            : t('editor.chartStudioDataSourceError', { error: sourceError })}
        </Text>
      ) : null}
      {sourceEmpty && !sourceError ? (
        <Text
          role="meta"
          as="p"
          className="creation-chart-studio__hint"
          data-testid="chart-studio-data-source-empty"
        >
          {t('editor.chartStudioDataSourceEmpty')}
        </Text>
      ) : null}
      {showMap ? (
        <div className="creation-chart-studio__field-map" data-testid="chart-studio-field-map">
          <Field
            label={t('editor.chartStudioMapLabel')}
            icon={chartStudioFieldIcon('label')}
            size="sm"
          >
            <Select
              value={map.label}
              options={fieldOptions}
              size="sm"
              aria-label={t('editor.chartStudioMapLabel')}
              data-testid="chart-studio-map-label"
              onChange={(next) => {
                if (!next || next === map.label) return
                onChangeMap({ ...map, label: next })
              }}
            />
          </Field>
          <Field
            label={t('editor.chartStudioMapValue')}
            icon={chartStudioFieldIcon('value')}
            size="sm"
          >
            <Select
              value={map.value}
              options={fieldOptions}
              size="sm"
              aria-label={t('editor.chartStudioMapValue')}
              data-testid="chart-studio-map-value"
              onChange={(next) => {
                if (!next || next === map.value) return
                onChangeMap({ ...map, value: next })
              }}
            />
          </Field>
          <Field
            label={t('editor.chartStudioMapColor')}
            icon={chartStudioFieldIcon('color')}
            size="sm"
          >
            <Select
              value={map.color ?? NONE_VALUE}
              options={colorOptions}
              size="sm"
              aria-label={t('editor.chartStudioMapColor')}
              data-testid="chart-studio-map-color"
              onChange={(next) => {
                const color = !next || next === NONE_VALUE ? null : next
                if ((map.color ?? null) === color) return
                onChangeMap({ ...map, color })
              }}
            />
          </Field>
        </div>
      ) : null}
      {!sourceRef ? (
        <Text role="meta" as="p" data-testid="chart-studio-data-source-hint">
          {t('editor.chartStudioDataSourceHint')}
        </Text>
      ) : null}
    </div>
  )
}

export function chartDataMapFromProps(raw: unknown): ChartDataMap | null {
  return readChartDataMap(raw)
}
