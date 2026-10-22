'use client'

/**
 * Compact Inspect / Chart studio control for Collection dataBindings.
 * Spec: specs/domain/collection-data-bind.md
 */

import { useEffect, useMemo, useState } from 'react'
import { Button, Field, Select } from '@zaoly/ui'
import {
  isChartSeriesCatalogKind,
  scopeCollectionDataRef,
  type CollectionDataCatalogItem,
} from '../../lib/collection-data/collection-data-core'
import { collectionDataCatalogUrl } from '../../lib/paths'

export type InspectDataBindMode = 'scalar' | 'chart_series'

export function InspectDataBindField({
  fieldKey,
  boundRef,
  platformProjectId,
  catalogPlatformProjectId,
  scenePlatformProjectId,
  disabled,
  mode = 'scalar',
  bindLabel,
  onBind,
  onClear,
}: {
  fieldKey: string
  boundRef: string | null
  /** Collection used to fetch the catalog (defaults to platformProjectId). */
  platformProjectId: string | null | undefined
  catalogPlatformProjectId?: string | null
  /** Open scene Collection — used to prefix cross-Collection refs on bind. */
  scenePlatformProjectId?: string | null
  disabled?: boolean
  mode?: InspectDataBindMode
  bindLabel?: string
  onBind: (dataRef: string, item?: CollectionDataCatalogItem) => void
  onClear: () => void
}) {
  const [items, setItems] = useState<CollectionDataCatalogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [picking, setPicking] = useState(false)
  const catalogPid =
    (catalogPlatformProjectId ?? platformProjectId)?.trim() || ''
  const scenePid = (scenePlatformProjectId ?? platformProjectId)?.trim() || ''

  useEffect(() => {
    if (!picking || !catalogPid) return
    let cancelled = false
    setLoading(true)
    void (async () => {
      try {
        const res = await fetch(collectionDataCatalogUrl(catalogPid), {
          headers: { accept: 'application/json' },
          credentials: 'same-origin',
        })
        if (!res.ok || cancelled) return
        const body = (await res.json()) as { items?: CollectionDataCatalogItem[] }
        if (!cancelled && Array.isArray(body.items)) setItems(body.items)
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [picking, catalogPid])

  const filtered = useMemo(
    () =>
      items.filter((item) =>
        mode === 'chart_series'
          ? isChartSeriesCatalogKind(item.kind)
          : !isChartSeriesCatalogKind(item.kind),
      ),
    [items, mode],
  )

  const options = useMemo(
    () =>
      filtered.map((item) => ({
        value: item.ref,
        label: item.hint
          ? `[${item.product}] ${item.label} — ${item.hint}`
          : `[${item.product}] ${item.label}`,
      })),
    [filtered],
  )

  const label =
    bindLabel ??
    (fieldKey === 'children'
      ? 'Text data'
      : fieldKey === 'data'
        ? 'Data source'
        : /^data\.\d+\.value$/.test(fieldKey)
          ? 'Series data'
          : `Data · ${fieldKey}`)

  if (boundRef) {
    return (
      <Field label={label} size="sm">
        <div
          style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}
          data-testid={`inspect-data-bound-${fieldKey}`}
        >
          <span style={{ fontSize: 12, opacity: 0.85, wordBreak: 'break-all' }}>{boundRef}</span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={disabled}
            aria-label={`Clear data binding for ${fieldKey}`}
            data-testid={`inspect-data-clear-${fieldKey}`}
            onClick={onClear}
          >
            Clear
          </Button>
        </div>
      </Field>
    )
  }

  if (!catalogPid) {
    return (
      <Field label={label} size="sm">
        <span style={{ fontSize: 12, opacity: 0.7 }}>Bind requires a Collection</span>
      </Field>
    )
  }

  return (
    <Field label={label} size="sm">
      {!picking ? (
        <Button
          type="button"
          size="sm"
          variant="subtle"
          disabled={disabled}
          data-testid={`inspect-data-bind-${fieldKey}`}
          onClick={() => setPicking(true)}
        >
          {mode === 'chart_series' ? 'Bind Collection source…' : 'Bind Collection value…'}
        </Button>
      ) : (
        <Select
          aria-label={
            mode === 'chart_series'
              ? `Bind Collection source for ${fieldKey}`
              : `Bind Collection value for ${fieldKey}`
          }
          data-testid={`inspect-data-select-${fieldKey}`}
          disabled={disabled || loading}
          placeholder={loading ? 'Loading…' : 'Select…'}
          options={options}
          value=""
          onChange={(next) => {
            if (!next) return
            const item = filtered.find((i) => i.ref === next)
            const scoped = scopeCollectionDataRef(next, catalogPid, scenePid)
            onBind(scoped, item)
            setPicking(false)
          }}
        />
      )}
    </Field>
  )
}
