import { describe, expect, it } from 'vitest'
import {
  isChartStudioOpen,
  isChartStudioSubjectType,
  shouldClearChartStudioDismiss,
} from '../lib/chart-studio/open-state'
import { CHART_STUDIO_OWNED_PROP_NAMES } from '../lib/chart-studio/owned-props'
import {
  addChartSeriesPoint,
  moveChartSeriesPoint,
  readChartSeriesPoints,
  removeChartSeriesPoint,
  serializeChartSeriesForScene,
  updateChartSeriesColor,
  updateChartSeriesLabel,
  updateChartSeriesValue,
} from '../lib/chart-studio/series'
import {
  chartMarkControlsForKind,
  parseChartMarkInput,
  patchChartStyle,
} from '../lib/chart-studio/marks'
import { resolveChartSeriesColors } from '../lib/chart-studio/resolve-colors'
import { paths } from '../lib/paths'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(__dirname, '..')

describe('Chart studio open-state', () => {
  it('treats only SiteChart as studio subject (Phase 1)', () => {
    expect(isChartStudioSubjectType('SiteChart')).toBe(true)
    expect(isChartStudioSubjectType('SiteGauge')).toBe(false)
    expect(isChartStudioSubjectType('Frame')).toBe(false)
  })

  it('opens when subject is chart and not dismissed', () => {
    expect(isChartStudioOpen({ subjectIsChart: true, userDismissed: false })).toBe(true)
    expect(isChartStudioOpen({ subjectIsChart: true, userDismissed: true })).toBe(false)
    expect(isChartStudioOpen({ subjectIsChart: false, userDismissed: false })).toBe(false)
  })

  it('clears dismiss when selection id changes while still on a chart', () => {
    expect(shouldClearChartStudioDismiss('a', 'b', true)).toBe(true)
    expect(shouldClearChartStudioDismiss('a', 'a', true)).toBe(false)
    expect(shouldClearChartStudioDismiss(null, 'a', true)).toBe(true)
    expect(shouldClearChartStudioDismiss('a', null, false)).toBe(false)
  })

  it('hides Kind + series + chartStyle props from Inspect', () => {
    expect(CHART_STUDIO_OWNED_PROP_NAMES.has('chartType')).toBe(true)
    expect(CHART_STUDIO_OWNED_PROP_NAMES.has('variant')).toBe(true)
    expect(CHART_STUDIO_OWNED_PROP_NAMES.has('data')).toBe(true)
    expect(CHART_STUDIO_OWNED_PROP_NAMES.has('chartStyle')).toBe(true)
  })

  it('documents dock storage key centrally', () => {
    expect(paths.chartStudioDockStorageKey).toBe('zaoly.editor.chart-studio.dock.v1')
    const knowledge = readFileSync(path.join(root, '../../knowledge/paths.md'), 'utf8')
    expect(knowledge).toContain('chartStudioDockStorageKey')
  })

  it('workspace mounts Chart studio + Inspect teaser wiring', () => {
    const workspace = readFileSync(
      path.join(root, 'components/editor-workspace.tsx'),
      'utf8',
    )
    expect(workspace).toContain('ChartStudioPanel')
    expect(workspace).toContain('useChartStudioOpen')
    expect(workspace).toContain('onOpenChartStudio')

    const panel = readFileSync(
      path.join(root, 'components/chart-studio/chart-studio-panel.tsx'),
      'utf8',
    )
    expect(panel).toContain('FloatingPanel')
    expect(panel).toContain('ChartStudioSeriesTable')
    expect(panel).toContain('chartStudioFieldIcon')
    expect(panel).toContain('ds-inspect-density')
    expect(panel).toContain('paths.chartStudioDockStorageKey')

    const series = readFileSync(
      path.join(root, 'components/chart-studio/chart-studio-series-table.tsx'),
      'utf8',
    )
    expect(series).toContain('creation-chart-studio__series-meta')
    expect(series).toContain('ChartStudioSeriesColorCell')

    const marks = readFileSync(
      path.join(root, 'components/chart-studio/chart-studio-marks.tsx'),
      'utf8',
    )
    expect(marks).toContain('chartStudioMarkIcon')
    expect(marks).toContain('icon={chartStudioMarkIcon')

    const inspect = readFileSync(
      path.join(root, 'components/editor-inspector/inspector-design-panel.tsx'),
      'utf8',
    )
    expect(inspect).toContain('editor-open-chart-studio')
    expect(inspect).toContain('CHART_STUDIO_OWNED_PROP_NAMES')
  })
})

describe('Chart studio series helpers', () => {
  it('reads multiline text and structured points', () => {
    expect(readChartSeriesPoints('A: 10\nB: 20')).toEqual([
      { label: 'A', value: 10 },
      { label: 'B', value: 20 },
    ])
    expect(readChartSeriesPoints([{ label: 'X', value: 3 }])).toEqual([{ label: 'X', value: 3 }])
  })

  it('updates label/value, add/remove/reorder, and serializes for scene', () => {
    const base = [
      { label: 'A', value: 10 },
      { label: 'B', value: 20 },
    ]
    expect(updateChartSeriesLabel(base, 0, 'Alpha')).toEqual([
      { label: 'Alpha', value: 10 },
      { label: 'B', value: 20 },
    ])
    expect(updateChartSeriesValue(base, 1, '42')).toEqual([
      { label: 'A', value: 10 },
      { label: 'B', value: 42 },
    ])
    expect(addChartSeriesPoint(base)).toEqual([
      { label: 'A', value: 10 },
      { label: 'B', value: 20 },
      { label: 'Point', value: 0 },
    ])
    expect(removeChartSeriesPoint(base, 0)).toEqual([{ label: 'B', value: 20 }])
    expect(moveChartSeriesPoint(base, 0, 1)).toEqual([
      { label: 'B', value: 20 },
      { label: 'A', value: 10 },
    ])
    expect(serializeChartSeriesForScene(base)).toEqual(base)
  })

  it('stores and clears series colors', () => {
    const base = [{ label: 'A', value: 10 }]
    expect(updateChartSeriesColor(base, 0, { color: '#ff00aa', colorToken: 'color.accent' })).toEqual([
      { label: 'A', value: 10, color: '#ff00aa', colorToken: 'color.accent' },
    ])
    expect(
      updateChartSeriesColor(
        [{ label: 'A', value: 10, color: '#ff00aa', colorToken: 'color.accent' }],
        0,
        null,
      ),
    ).toEqual([{ label: 'A', value: 10 }])
    expect(
      serializeChartSeriesForScene([
        { label: 'A', value: 1, color: '#111', colorToken: 'color.black' },
      ]),
    ).toEqual([{ label: 'A', value: 1, color: '#111', colorToken: 'color.black' }])
  })

  it('resolves colorToken via catalog for paint', () => {
    const catalog = [
      {
        path: 'color.action.primary',
        group: 'color' as const,
        preview: '#c4a35a',
        status: 'active' as const,
      },
    ]
    const resolved = resolveChartSeriesColors(
      [{ label: 'A', value: 1, colorToken: 'color.action.primary' }],
      catalog,
    )
    expect(resolved[0]?.color).toBeTruthy()
    expect(resolved[0]?.colorToken).toBe('color.action.primary')
  })
})

describe('Chart studio field icons', () => {
  it('maps mark controls to Inspect prop glyphs', async () => {
    const { chartStudioFieldIcon, chartStudioMarkIcon } = await import(
      '../lib/chart-studio/field-icons'
    )
    expect(chartStudioFieldIcon('chartType')).toBeTruthy()
    expect(chartStudioFieldIcon('color')).toBeTruthy()
    expect(chartStudioMarkIcon('strokeWidth')).toBeTruthy()
    expect(chartStudioMarkIcon('barGap')).toBeTruthy()
    expect(chartStudioMarkIcon('donutHole')).toBeTruthy()
    expect(chartStudioMarkIcon('pointRadius')).toBeTruthy()
  })
})

describe('Chart studio mark helpers', () => {
  it('picks kind-specific mark controls', () => {
    expect(chartMarkControlsForKind('bar')).toEqual(['barGap'])
    expect(chartMarkControlsForKind('donut')).toEqual(['donutHole'])
    expect(chartMarkControlsForKind('line')).toEqual(['strokeWidth', 'pointRadius'])
    expect(chartMarkControlsForKind('pie')).toEqual([])
  })

  it('parses mark inputs and patches chartStyle', () => {
    expect(parseChartMarkInput('donutHole', '40')).toBe(0.4)
    expect(parseChartMarkInput('barGap', '12')).toBe(12)
    expect(patchChartStyle({}, { barGap: 12, strokeWidth: 3 })).toEqual({
      barGap: 12,
      strokeWidth: 3,
    })
  })
})
