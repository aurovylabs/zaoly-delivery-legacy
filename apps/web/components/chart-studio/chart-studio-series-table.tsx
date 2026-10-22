'use client'

import type { SiteChartPoint } from '@zaoly/site-kit'
import { Button, Field, Text } from '@zaoly/ui'
import { CommitOnBlurInput } from '../editor-inspector/commit-on-blur-input'
import { InspectDataBindField } from '../editor-inspector/inspect-data-bind-field'
import { ChartStudioSeriesColorCell } from './chart-studio-series-color'
import { updateChartSeriesColor } from '../../lib/chart-studio/series'
import { chartStudioFieldIcon } from '../../lib/chart-studio/field-icons'
import { INSPECT_UNSET_PLACEHOLDER } from '../../lib/inspect/field-catalog'
import { chartSeriesValueBindingKey } from '../../lib/collection-data/collection-data-core'

export function ChartStudioSeriesTable({
  points,
  dataBindings,
  platformProjectId,
  sourceBound = false,
  onChange,
  onBindValue,
  onClearValue,
  t,
}: {
  points: SiteChartPoint[]
  dataBindings?: Record<string, string>
  platformProjectId?: string | null
  /** Whole-series Collection source bound — rows are preview-only. */
  sourceBound?: boolean
  onChange: (
    next: SiteChartPoint[],
    meta?: { removeIndex?: number; swap?: [number, number] },
  ) => void
  onBindValue: (index: number, dataRef: string) => void
  onClearValue: (index: number) => void
  t: (key: string, vars?: Record<string, string>) => string
}) {
  return (
    <div className="creation-chart-studio__section" data-testid="chart-studio-series">
      <div className="creation-chart-studio__section-head">
        <Text role="meta" as="p" className="creation-chart-studio__section-title">
          {sourceBound ? t('editor.chartStudioSeriesPreview') : t('editor.chartStudioSeries')}
        </Text>
        {!sourceBound ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            data-testid="chart-studio-series-add"
            onClick={() =>
              onChange([
                ...points,
                {
                  label: nextPointLabel(points),
                  value: 0,
                },
              ])
            }
          >
            {t('editor.chartStudioSeriesAdd')}
          </Button>
        ) : null}
      </div>

      {points.length === 0 ? (
        <Text role="meta" as="p" data-testid="chart-studio-series-empty">
          {sourceBound
            ? t('editor.chartStudioSeriesSourceEmpty')
            : t('editor.chartStudioSeriesEmpty')}
        </Text>
      ) : (
        <div className="creation-chart-studio__series-list">
          {points.map((p, i) => {
            const bindKey = chartSeriesValueBindingKey(i)
            const boundRef = sourceBound ? null : (dataBindings?.[bindKey] ?? null)
            return (
              <div
                key={`row-${i}`}
                className="creation-chart-studio__series-row"
                data-testid={`chart-studio-series-row-${i}`}
              >
                <div className="creation-chart-studio__series-pair">
                  <Field
                    label={t('editor.chartStudioColLabel')}
                    icon={chartStudioFieldIcon('label')}
                    size="sm"
                  >
                    <CommitOnBlurInput
                      value={p.label}
                      placeholder={INSPECT_UNSET_PLACEHOLDER}
                      aria-label={t('editor.chartStudioColLabel')}
                      data-testid={`chart-studio-series-label-${i}`}
                      readOnly={sourceBound}
                      onCommit={(next) => {
                        if (sourceBound) return
                        const trimmed = next.trim()
                        if (!trimmed || trimmed === p.label) return
                        onChange(
                          points.map((row, idx) =>
                            idx === i ? { ...row, label: trimmed } : row,
                          ),
                        )
                      }}
                    />
                  </Field>
                  <Field
                    label={t('editor.chartStudioColValue')}
                    icon={chartStudioFieldIcon('value')}
                    size="sm"
                  >
                    <CommitOnBlurInput
                      value={boundRef ? `↗ ${boundRef}` : String(p.value)}
                      placeholder={INSPECT_UNSET_PLACEHOLDER}
                      aria-label={t('editor.chartStudioColValue')}
                      data-testid={`chart-studio-series-value-${i}`}
                      readOnly={sourceBound || Boolean(boundRef)}
                      onCommit={(next) => {
                        if (sourceBound || boundRef) return
                        const value = Number(next.trim())
                        if (!Number.isFinite(value) || value === p.value) return
                        onChange(
                          points.map((row, idx) => (idx === i ? { ...row, value } : row)),
                        )
                      }}
                    />
                  </Field>
                </div>
                {!sourceBound ? (
                  <InspectDataBindField
                    fieldKey={bindKey}
                    boundRef={boundRef}
                    platformProjectId={platformProjectId}
                    mode="scalar"
                    onBind={(dataRef) => onBindValue(i, dataRef)}
                    onClear={() => onClearValue(i)}
                  />
                ) : null}
                <div className="creation-chart-studio__series-meta">
                  {!sourceBound ? (
                    <ChartStudioSeriesColorCell
                      color={p.color}
                      colorToken={p.colorToken}
                      testId={`chart-studio-series-color-${i}`}
                      t={t}
                      onChange={(next) => onChange(updateChartSeriesColor(points, i, next))}
                      onClear={() => onChange(updateChartSeriesColor(points, i, null))}
                    />
                  ) : p.color ? (
                    <Text role="meta" as="span" data-testid={`chart-studio-series-color-preview-${i}`}>
                      {p.color}
                    </Text>
                  ) : null}
                  {!sourceBound ? (
                    <div className="creation-chart-studio__row-actions">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={i === 0}
                        aria-label={t('editor.chartStudioSeriesMoveUp')}
                        data-testid={`chart-studio-series-up-${i}`}
                        onClick={() => onChange(swapRows(points, i, i - 1), { swap: [i, i - 1] })}
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={i >= points.length - 1}
                        aria-label={t('editor.chartStudioSeriesMoveDown')}
                        data-testid={`chart-studio-series-down-${i}`}
                        onClick={() => onChange(swapRows(points, i, i + 1), { swap: [i, i + 1] })}
                      >
                        ↓
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label={t('editor.chartStudioSeriesRemove')}
                        data-testid={`chart-studio-series-remove-${i}`}
                        onClick={() =>
                          onChange(
                            points.filter((_, idx) => idx !== i),
                            { removeIndex: i },
                          )
                        }
                      >
                        ×
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function swapRows(points: SiteChartPoint[], a: number, b: number): SiteChartPoint[] {
  if (b < 0 || b >= points.length) return points
  const next = points.map((p) => ({ ...p }))
  const tmp = next[a]!
  next[a] = next[b]!
  next[b] = tmp
  return next
}

function nextPointLabel(points: SiteChartPoint[]): string {
  const used = new Set(points.map((p) => p.label))
  let n = points.length + 1
  while (used.has(`Point ${n}`)) n += 1
  return `Point ${n}`
}
