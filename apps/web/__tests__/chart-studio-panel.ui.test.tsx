import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ChartStudioPanel } from '../components/chart-studio/chart-studio-panel'
import type { SceneNode } from '@zaoly/contracts'
import { AppProviders } from '../components/app-providers'

vi.mock('@zaoly/ui', async () => {
  const actual = await vi.importActual<typeof import('@zaoly/ui')>('@zaoly/ui')
  return {
    ...actual,
    FloatingPanel: ({
      children,
      title,
      ariaLabel,
    }: {
      children: React.ReactNode
      title?: string
      ariaLabel?: string
    }) => (
      <div role="dialog" aria-label={ariaLabel ?? title} data-testid="chart-studio-floating">
        {title ? <div>{title}</div> : null}
        {children}
      </div>
    ),
  }
})

const chartNode: SceneNode = {
  id: 'chart-1',
  type: 'SiteChart',
  name: 'Chart',
  props: {
    chartType: 'bar',
    data: 'A: 10\nB: 20',
  },
  children: [],
}

function t(key: string) {
  const map: Record<string, string> = {
    'editor.chartStudioTitle': 'Chart studio',
    'editor.chartStudioHide': 'Hide',
    'editor.chartStudioDataSource': 'Data source',
    'editor.chartStudioSourceCollection': 'Source Collection',
    'editor.chartStudioThisCollection': 'This Collection',
    'editor.chartStudioThisCollectionSuffix': 'open',
    'editor.chartStudioCollectionsLoadHint': 'Could not load all Collections.',
    'editor.chartStudioDataSourceHint': 'Pick a Collection source once.',
    'editor.chartStudioDataSourceEmpty': 'Source has no rows yet.',
    'editor.chartStudioDataSourceNotProvisioned': 'Checkion not provisioned.',
    'editor.chartStudioDataSourceError': 'Could not load source ({error}).',
    'editor.chartStudioMapLabel': 'Label field',
    'editor.chartStudioMapValue': 'Value field',
    'editor.chartStudioMapColor': 'Color field',
    'editor.chartStudioKind': 'Chart type',
    'editor.chartStudioSeries': 'Series',
    'editor.chartStudioSeriesPreview': 'Series preview',
    'editor.chartStudioSeriesEmpty': 'No series points yet.',
    'editor.chartStudioSeriesSourceEmpty': 'Source has no rows yet.',
    'editor.chartStudioSeriesAdd': 'Add row',
    'editor.chartStudioSeriesRemove': 'Remove row',
    'editor.chartStudioSeriesMoveUp': 'Move up',
    'editor.chartStudioSeriesMoveDown': 'Move down',
    'editor.chartStudioColLabel': 'Label',
    'editor.chartStudioColValue': 'Value',
    'editor.chartStudioColColor': 'Color',
    'editor.chartStudioColActions': 'Row actions',
    'editor.chartStudioMarks': 'Marks',
    'editor.chartStudioMarksNone': 'No mark controls for this chart type.',
    'editor.chartStudioMarkBarGap': 'Bar gap (px)',
    'editor.chartStudioMarkDonutHole': 'Donut hole (%)',
    'editor.chartStudioMarkStroke': 'Stroke width (px)',
    'editor.chartStudioMarkPoint': 'Point radius (px)',
    'editor.tokenNone': 'None',
    'editor.tokenEmpty': '—',
    'editor.clearToken': 'Clear token',
  }
  return map[key] ?? key
}

describe('ChartStudioPanel', () => {
  it('renders kind + editable series and dismisses', () => {
    const onDismiss = vi.fn()
    const onOps = vi.fn()
    render(
      <AppProviders>
        <ChartStudioPanel node={chartNode} open onDismiss={onDismiss} onOps={onOps} t={t} />
      </AppProviders>,
    )
    expect(screen.getByTestId('creation-chart-studio')).toBeInTheDocument()
    expect(screen.getByTestId('chart-studio-data-source')).toBeInTheDocument()
    expect(screen.getByTestId('chart-studio-kind')).toBeInTheDocument()
    expect(
      screen.getByTestId('creation-chart-studio').querySelector('.ds-inspect-density'),
    ).toBeTruthy()
    const labelField = screen.getByTestId('chart-studio-series-label-0').closest('.ds-field')
    expect(labelField?.querySelector('.ds-field-icon')).toBeTruthy()
    expect(labelField?.querySelector('.ds-field-label')).toBeTruthy()
    expect(screen.getByTestId('chart-studio-series-label-0')).toHaveValue('A')
    expect(screen.getByTestId('chart-studio-series-value-0')).toHaveValue('10')
    const row0 = screen.getByTestId('chart-studio-series-row-0')
    expect(row0.querySelector('.creation-chart-studio__series-meta')).toBeTruthy()
    expect(row0.querySelector('.creation-chart-studio__series-meta .creation-chart-studio__row-actions')).toBeTruthy()
    fireEvent.click(screen.getByTestId('chart-studio-dismiss'))
    expect(onDismiss).toHaveBeenCalled()
  })

  it('emits chartType + variant set_prop when kind changes', () => {
    const onOps = vi.fn()
    render(
      <AppProviders>
        <ChartStudioPanel
          node={chartNode}
          open
          onDismiss={() => {}}
          onOps={onOps}
          t={t}
        />
      </AppProviders>,
    )
    const kind = screen.getByTestId('chart-studio-kind')
    const trigger = kind.querySelector('button') ?? kind.querySelector('[role="combobox"]')
    expect(trigger).toBeTruthy()
    fireEvent.click(trigger!)
    const pie = screen.getByRole('option', { name: /pie/i })
    fireEvent.click(pie)
    expect(onOps).toHaveBeenCalledWith([
      { op: 'set_prop', nodeId: 'chart-1', key: 'chartType', value: 'pie' },
      { op: 'set_prop', nodeId: 'chart-1', key: 'variant', value: 'pie' },
    ])
  })

  it('commits series value edits as structured data points', () => {
    const onOps = vi.fn()
    render(
      <AppProviders>
        <ChartStudioPanel
          node={chartNode}
          open
          onDismiss={() => {}}
          onOps={onOps}
          t={t}
        />
      </AppProviders>,
    )
    const value = screen.getByTestId('chart-studio-series-value-0')
    fireEvent.change(value, { target: { value: '99' } })
    fireEvent.blur(value)
    expect(onOps).toHaveBeenCalledWith([
      {
        op: 'set_prop',
        nodeId: 'chart-1',
        key: 'data',
        value: [
          { label: 'A', value: 99 },
          { label: 'B', value: 20 },
        ],
      },
    ])
  })

  it('adds and removes series rows', () => {
    const onOps = vi.fn()
    render(
      <AppProviders>
        <ChartStudioPanel
          node={chartNode}
          open
          onDismiss={() => {}}
          onOps={onOps}
          t={t}
        />
      </AppProviders>,
    )
    fireEvent.click(screen.getByTestId('chart-studio-series-add'))
    expect(onOps).toHaveBeenCalledWith([
      {
        op: 'set_prop',
        nodeId: 'chart-1',
        key: 'data',
        value: [
          { label: 'A', value: 10 },
          { label: 'B', value: 20 },
          { label: 'Point 3', value: 0 },
        ],
      },
    ])
    onOps.mockClear()
    fireEvent.click(screen.getByTestId('chart-studio-series-remove-1'))
    expect(onOps).toHaveBeenCalledWith([
      {
        op: 'set_prop',
        nodeId: 'chart-1',
        key: 'data',
        value: [{ label: 'A', value: 10 }],
      },
    ])
  })

  it('reorders series rows', () => {
    const onOps = vi.fn()
    render(
      <AppProviders>
        <ChartStudioPanel
          node={chartNode}
          open
          onDismiss={() => {}}
          onOps={onOps}
          t={t}
        />
      </AppProviders>,
    )
    fireEvent.click(screen.getByTestId('chart-studio-series-down-0'))
    expect(onOps).toHaveBeenCalledWith([
      {
        op: 'set_prop',
        nodeId: 'chart-1',
        key: 'data',
        value: [
          { label: 'B', value: 20 },
          { label: 'A', value: 10 },
        ],
      },
    ])
  })

  it('commits series color literal into structured data', () => {
    const onOps = vi.fn()
    render(
      <AppProviders>
        <ChartStudioPanel
          node={chartNode}
          open
          onDismiss={() => {}}
          onOps={onOps}
          t={t}
        />
      </AppProviders>,
    )
    const colorCell = screen.getByTestId('chart-studio-series-color-0')
    const literal = colorCell.querySelector('input')
    expect(literal).toBeTruthy()
    fireEvent.change(literal!, { target: { value: '#ff00aa' } })
    fireEvent.blur(literal!)
    expect(onOps).toHaveBeenCalledWith([
      {
        op: 'set_prop',
        nodeId: 'chart-1',
        key: 'data',
        value: [
          { label: 'A', value: 10, color: '#ff00aa' },
          { label: 'B', value: 20 },
        ],
      },
    ])
  })

  it('commits barGap mark into chartStyle', () => {
    const onOps = vi.fn()
    render(
      <AppProviders>
        <ChartStudioPanel
          node={chartNode}
          open
          onDismiss={() => {}}
          onOps={onOps}
          t={t}
        />
      </AppProviders>,
    )
    const gap = screen.getByTestId('chart-studio-mark-barGap')
    fireEvent.change(gap, { target: { value: '14' } })
    fireEvent.blur(gap)
    expect(onOps).toHaveBeenCalledWith([
      {
        op: 'set_prop',
        nodeId: 'chart-1',
        key: 'chartStyle',
        value: { barGap: 14 },
      },
    ])
  })

  it('renders nothing when closed', () => {
    const { container } = render(
      <AppProviders>
        <ChartStudioPanel
          node={chartNode}
          open={false}
          onDismiss={() => {}}
          onOps={() => {}}
          t={t}
        />
      </AppProviders>,
    )
    expect(container.querySelector('[data-testid="creation-chart-studio"]')).toBeNull()
  })
})
