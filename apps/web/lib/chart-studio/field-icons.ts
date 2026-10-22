/**
 * Chart studio field icons — reuse Inspect prop glyphs.
 * Spec: `specs/domain/chart-studio-panel.md` · `knowledge/editor-inspect-icons.md`
 */
import type { ReactNode } from 'react'
import { inspectPropIcon } from '../inspect/icons'
import type { ChartMarkControlId } from './marks'

/** Map studio control ids → Inspect PROP_ICONS keys. */
const STUDIO_TO_INSPECT_PROP: Record<string, string> = {
  chartType: 'variant',
  label: 'label',
  value: 'valueLabel',
  color: 'color',
  barGap: 'gap',
  donutHole: 'radius',
  strokeWidth: 'borderWidth',
  pointRadius: 'radius',
}

export function chartStudioFieldIcon(id: string): ReactNode {
  return inspectPropIcon(STUDIO_TO_INSPECT_PROP[id] ?? id)
}

export function chartStudioMarkIcon(id: ChartMarkControlId): ReactNode {
  return chartStudioFieldIcon(id)
}
