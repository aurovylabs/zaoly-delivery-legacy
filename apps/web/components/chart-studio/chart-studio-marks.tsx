'use client'

import { Field, Text } from '@zaoly/ui'
import { CommitOnBlurInput } from '../editor-inspector/commit-on-blur-input'
import type { SiteChartStyle } from '@zaoly/site-kit'
import {
  chartMarkControlsForKind,
  chartStyleDisplayValue,
  parseChartMarkInput,
  type ChartMarkControlId,
} from '../../lib/chart-studio/marks'
import { chartStudioMarkIcon } from '../../lib/chart-studio/field-icons'
import { INSPECT_UNSET_PLACEHOLDER } from '../../lib/inspect/field-catalog'

const MARK_LABEL_KEYS: Record<ChartMarkControlId, string> = {
  barGap: 'editor.chartStudioMarkBarGap',
  donutHole: 'editor.chartStudioMarkDonutHole',
  strokeWidth: 'editor.chartStudioMarkStroke',
  pointRadius: 'editor.chartStudioMarkPoint',
}

export function ChartStudioMarksSection({
  chartType,
  chartStyle,
  onChange,
  t,
}: {
  chartType: string
  chartStyle: SiteChartStyle
  onChange: (patch: Partial<SiteChartStyle>) => void
  t: (key: string, vars?: Record<string, string>) => string
}) {
  const controls = chartMarkControlsForKind(chartType)

  return (
    <div className="creation-chart-studio__section" data-testid="chart-studio-marks">
      <Text role="meta" as="p" className="creation-chart-studio__section-title">
        {t('editor.chartStudioMarks')}
      </Text>
      {controls.length === 0 ? (
        <Text role="meta" as="p" className="creation-chart-studio__hint">
          {t('editor.chartStudioMarksNone')}
        </Text>
      ) : (
        <div className="creation-chart-studio__marks-fields">
          {controls.map((key) => {
            const label = t(MARK_LABEL_KEYS[key])
            return (
              <Field key={key} label={label} icon={chartStudioMarkIcon(key)} size="sm">
                <CommitOnBlurInput
                  value={chartStyleDisplayValue(chartStyle, key)}
                  placeholder={INSPECT_UNSET_PLACEHOLDER}
                  aria-label={label}
                  data-testid={`chart-studio-mark-${key}`}
                  onCommit={(raw) => {
                    const parsed = parseChartMarkInput(key, raw)
                    if (parsed == null) return
                    const displayNext =
                      key === 'donutHole' ? String(Math.round(parsed * 100)) : String(parsed)
                    if (displayNext === chartStyleDisplayValue(chartStyle, key)) return
                    onChange({ [key]: parsed })
                  }}
                />
              </Field>
            )
          })}
        </div>
      )}
    </div>
  )
}
