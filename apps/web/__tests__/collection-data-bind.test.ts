import { describe, expect, it } from 'vitest'
import type { CompositionScene, SceneNode } from '@zaoly/contracts'
import {
  applyDataBindingsToProps,
  fixtureCatalogItems,
  fixtureResolve,
  parseCollectionDataRef,
  remapChartSeriesDataBindings,
  scopeCollectionDataRef,
} from '../lib/collection-data/collection-data'
import { applySceneOp } from '../lib/scene/ops'
import { cascadeNodeForBreakpoint } from '../lib/scene/cascade'

function baseScene(root: SceneNode): CompositionScene {
  return {
    id: 'scene-1',
    name: 'Test',
    version: 1,
    root,
    updatedAt: new Date().toISOString(),
  }
}

describe('collection-data-bind', () => {
  it('parses metron and checkion refs', () => {
    expect(parseCollectionDataRef('metron.kpi.kpi_abc.value')).toEqual({
      product: 'metron',
      kind: 'kpi_value',
      kpiId: 'kpi_abc',
    })
    expect(parseCollectionDataRef('metron.collection.kpis')).toEqual({
      product: 'metron',
      kind: 'chart_series',
      series: 'collection_kpis',
    })
    expect(parseCollectionDataRef('checkion.scan.latest.overallScore')).toEqual({
      product: 'checkion',
      kind: 'scan_score',
      scanId: 'latest',
    })
    expect(parseCollectionDataRef('checkion.scan.latest.facets')).toEqual({
      product: 'checkion',
      kind: 'chart_series',
      series: 'latest_facets',
    })
    expect(parseCollectionDataRef('checkion.scan.latest.scores')).toEqual({
      product: 'checkion',
      kind: 'chart_series',
      series: 'latest_scores',
    })
    expect(parseCollectionDataRef('checkion.collection.scoreHistory')).toEqual({
      product: 'checkion',
      kind: 'chart_series',
      series: 'score_history',
    })
    expect(parseCollectionDataRef('checkion.scan.scan_abc.scores')).toEqual({
      product: 'checkion',
      kind: 'chart_series',
      series: 'scan_scores',
      scanId: 'scan_abc',
    })
    expect(parseCollectionDataRef('checkion.scan.scan_1.issueCount')).toEqual({
      product: 'checkion',
      kind: 'scan_issue_count',
      scanId: 'scan_1',
    })
    expect(parseCollectionDataRef('color.action.primary')).toBeNull()
  })

  it('fixture catalog uses canonical grammar', () => {
    const items = fixtureCatalogItems()
    expect(items.some((i) => i.ref.startsWith('metron.kpi.'))).toBe(true)
    expect(items.some((i) => i.ref === 'checkion.scan.latest.overallScore')).toBe(true)
    for (const item of items) {
      expect(parseCollectionDataRef(item.ref)).not.toBeNull()
      expect(fixtureResolve(item.ref)?.status).toBe('ok')
    }
  })

  it('set_data_binding / clear_data_binding round-trip', () => {
    const root: SceneNode = {
      id: 'root',
      type: 'SiteStack',
      children: [{ id: 't1', type: 'SiteText', props: { children: 'Hello' } }],
    }
    const scene = baseScene(root)
    const set = applySceneOp(scene, {
      op: 'set_data_binding',
      nodeId: 't1',
      key: 'children',
      dataRef: 'checkion.scan.latest.overallScore',
    })
    expect(set.ok).toBe(true)
    const bound = set.scene!.root.children![0]!
    expect(bound.dataBindings?.children).toBe('checkion.scan.latest.overallScore')

    const cleared = applySceneOp(set.scene!, {
      op: 'clear_data_binding',
      nodeId: 't1',
      key: 'children',
    })
    expect(cleared.ok).toBe(true)
    expect(cleared.scene!.root.children![0]!.dataBindings).toBeUndefined()
  })

  it('cascade merges dataBindings', () => {
    const node: SceneNode = {
      id: 'n1',
      type: 'SiteText',
      props: { children: 'x' },
      dataBindings: { children: 'metron.kpi.a.value' },
      breakpoints: {
        mobile: {
          dataBindings: { children: 'checkion.scan.latest.overallScore' },
        },
      },
    }
    const desktop = cascadeNodeForBreakpoint(node, 'desktop')
    expect(desktop.dataBindings.children).toBe('metron.kpi.a.value')
    const mobile = cascadeNodeForBreakpoint(node, 'mobile')
    expect(mobile.dataBindings.children).toBe('checkion.scan.latest.overallScore')
  })

  it('applyDataBindingsToProps prefers resolved display', () => {
    const props = applyDataBindingsToProps(
      { children: 'stale', value: 1 },
      {
        children: 'checkion.scan.latest.overallScore',
        value: 'metron.kpi.kpi_fixture_demo.value',
      },
      {
        'checkion.scan.latest.overallScore': {
          status: 'ok',
          display: '78',
          numeric: 78,
          source: 'fixture',
        },
        'metron.kpi.kpi_fixture_demo.value': {
          status: 'ok',
          display: '42',
          numeric: 42,
          source: 'fixture',
        },
      },
    )
    expect(props.children).toBe('78')
    expect(props.value).toBe(42)
  })

  it('applies chart series data.N.value and remaps after remove', () => {
    const painted = applyDataBindingsToProps(
      {
        data: [
          { label: 'A', value: 1 },
          { label: 'B', value: 2 },
        ],
      },
      { 'data.1.value': 'metron.kpi.kpi_fixture_demo.value' },
      {
        'metron.kpi.kpi_fixture_demo.value': {
          status: 'ok',
          display: '42',
          numeric: 42,
          source: 'fixture',
        },
      },
    )
    expect((painted.data as Array<{ value: number }>)[1]!.value).toBe(42)

    const remapped = remapChartSeriesDataBindings(
      {
        'data.0.value': 'checkion.scan.latest.overallScore',
        'data.1.value': 'metron.kpi.kpi_fixture_demo.value',
      },
      (old) => (old === 0 ? null : old - 1),
    )
    expect(remapped).toEqual({
      'data.0.value': 'metron.kpi.kpi_fixture_demo.value',
    })
  })

  it('parses scoped cross-Collection refs', () => {
    const scoped = parseCollectionDataRef(
      'collection.aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.checkion.scan.latest.scores',
    )
    expect(scoped).toEqual({
      product: 'checkion',
      kind: 'chart_series',
      series: 'latest_scores',
      scopePlatformProjectId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    })
    expect(
      scopeCollectionDataRef(
        'checkion.scan.latest.scores',
        'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
        'ffffffff-1111-4222-8333-444444444444',
      ),
    ).toBe('collection.aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.checkion.scan.latest.scores')
    expect(
      scopeCollectionDataRef(
        'checkion.scan.latest.scores',
        'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
        'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      ),
    ).toBe('checkion.scan.latest.scores')
  })

  it('applies chart data source + chartDataMap', () => {
    const painted = applyDataBindingsToProps(
      {
        data: [{ label: 'stale', value: 1 }],
        chartDataMap: { label: 'name', value: 'value', color: null },
      },
      { data: 'metron.collection.kpis' },
      {
        'metron.collection.kpis': {
          status: 'ok',
          display: '2 KPIs',
          source: 'fixture',
          rows: [
            { name: 'A', value: 10 },
            { name: 'B', value: 20 },
          ],
          fields: [
            { key: 'name', label: 'Name', kind: 'string', role: 'label' },
            { key: 'value', label: 'Value', kind: 'number', role: 'value' },
          ],
        },
      },
    )
    expect(painted.data).toEqual([
      { label: 'A', value: 10 },
      { label: 'B', value: 20 },
    ])
  })
})
