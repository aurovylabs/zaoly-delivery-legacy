import { describe, expect, it } from 'vitest'
import { defaultChildForType } from '../lib/scene/scene-insert-defaults'
import { editorPaletteItems, isEditorInsertableType } from '../lib/scene/catalog-palette'
import { SITE_KIT_PALETTE_IDS, isSiteKitPaletteType } from '../lib/scene/site-kit-palette'
import { siteKitComponent } from '../lib/site-kit/registry'
import { siteKitContractProps } from '../lib/inspect/site-kit-fields'
import { SITE_KIT_CATALOG } from '@zaoly/site-kit'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(__dirname, '..')

describe('SiteChart + SiteGauge in Site Kit layer', () => {
  it('lists SiteChart and SiteGauge on the Site palette allowlist', () => {
    expect(SITE_KIT_PALETTE_IDS).toContain('SiteChart')
    expect(SITE_KIT_PALETTE_IDS).toContain('SiteGauge')
    expect(isSiteKitPaletteType('SiteChart')).toBe(true)
    expect(isEditorInsertableType('SiteChart')).toBe(true)
    const ids = editorPaletteItems().map((i) => i.insertType)
    expect(ids).toContain('SiteChart')
    expect(ids).toContain('SiteGauge')
    expect(editorPaletteItems().find((i) => i.insertType === 'SiteChart')?.layer).toBe('Site')
  })

  it('registers catalog + registry + insert defaults', () => {
    expect(SITE_KIT_CATALOG.some((e) => e.id === 'SiteChart')).toBe(true)
    expect(SITE_KIT_CATALOG.some((e) => e.id === 'SiteGauge')).toBe(true)
    expect(siteKitComponent('SiteChart')).toBeTruthy()
    expect(siteKitComponent('SiteGauge')).toBeTruthy()

    const chart = defaultChildForType('SiteChart')
    expect(chart.type).toBe('SiteChart')
    expect(chart.props?.chartType ?? chart.props?.variant).toBe('bar')
    expect(String(chart.props?.data)).toContain('A: 42')

    const gauge = defaultChildForType('SiteGauge')
    expect(gauge.type).toBe('SiteGauge')
    expect(gauge.props?.value).toBe(72)

    expect(siteKitContractProps('SiteChart').map((p) => p.name)).toEqual(
      expect.arrayContaining(['chartType', 'title', 'height', 'data']),
    )
    expect(siteKitContractProps('SiteGauge').map((p) => p.name)).toContain('tone')
  })

  it('parses Label: value series text for paint', async () => {
    const { parseChartSeriesText } = await import('@zaoly/site-kit')
    expect(parseChartSeriesText('A: 42\nB: 28')).toEqual([
      { label: 'A', value: 42 },
      { label: 'B', value: 28 },
    ])
  })

  it('exposes Chart type Select in Component (not Master variant axes)', async () => {
    const { inspectFieldsForType, variantAxisFieldsForType } = await import(
      '../lib/inspect/field-catalog'
    )
    const fields = inspectFieldsForType('SiteChart')
    const chartType = fields.find((f) => f.name === 'chartType')
    expect(chartType?.label).toBe('Chart type')
    expect(chartType?.variantAxis).toBe(false)
    expect(chartType?.control).toBeUndefined()
    expect(chartType?.options?.map((o) => o.value)).toEqual(
      expect.arrayContaining(['bar', 'line', 'pie', 'donut', 'funnel']),
    )
    expect(variantAxisFieldsForType('SiteChart').some((f) => f.name === 'chartType')).toBe(false)
    expect(variantAxisFieldsForType('SiteChart').some((f) => f.name === 'variant')).toBe(false)
  })

  it('set_prop chartType updates SiteChart props for paint', async () => {
    const { applySceneOp, findSceneNode } = await import('../lib/scene/ops')
    const { createLegacyFixtureScene } = await import('../lib/scene/demo-scene')
    const scene = createLegacyFixtureScene()
    const chart = defaultChildForType('SiteChart')
    const inserted = applySceneOp(scene, {
      op: 'insert_child',
      parentId: scene.root.id,
      child: chart,
    })
    expect(inserted.ok).toBe(true)
    if (!inserted.ok) return
    const updated = applySceneOp(inserted.scene, {
      op: 'set_prop',
      nodeId: chart.id,
      key: 'chartType',
      value: 'pie',
    })
    expect(updated.ok).toBe(true)
    if (!updated.ok) return
    const node = findSceneNode(updated.scene, chart.id)
    expect(node?.props?.chartType).toBe('pie')
    expect(node?.props?.variant).toBe('pie')
  })

  it('palette hydrate inserts free SiteChart (not Instance) so type sticks', async () => {
    const { applyPaletteHydrateInsert, seedSiteKitPaletteMasters } = await import('../lib/scene/ops')
    const { createLegacyFixtureScene } = await import('../lib/scene/demo-scene')
    const { isInstanceNode } = await import('../lib/scene/expand-instances')
    const { applySceneOp, findSceneNode } = await import('../lib/scene/ops')

    let scene = seedSiteKitPaletteMasters(createLegacyFixtureScene())
    const root = defaultChildForType('SiteChart')
    const hydrated = applyPaletteHydrateInsert(scene, {
      sourceKey: 'SiteChart',
      root,
      parentId: scene.root.id,
    })
    expect(hydrated.ok).toBe(true)
    if (!hydrated.ok || !hydrated.selectId) return
    scene = hydrated.scene
    const node = findSceneNode(scene, hydrated.selectId)
    expect(node?.type).toBe('SiteChart')
    expect(node && isInstanceNode(node)).toBe(false)

    const written = applySceneOp(scene, {
      op: 'set_prop',
      nodeId: hydrated.selectId,
      key: 'chartType',
      value: 'donut',
    })
    expect(written.ok).toBe(true)
    if (!written.ok) return
    const after = findSceneNode(written.scene, hydrated.selectId)
    expect(after?.props?.chartType).toBe('donut')
    expect(after?.props?.variant).toBe('donut')
  })

  it('Instance SiteChart keeps Chart type override after set_prop', async () => {
    const { applySceneOp, seedSiteKitPaletteMasters, findMasterBySourceKey } = await import(
      '../lib/scene/ops'
    )
    const { createLegacyFixtureScene } = await import('../lib/scene/demo-scene')
    const { expandInstanceNode, isInstanceNode } = await import('../lib/scene/expand-instances')
    const { fieldValue } = await import('../lib/inspect/inspector-field-values')
    const { inspectFieldsForType } = await import('../lib/inspect/field-catalog')
    const { cascadeInspectView } = await import('../lib/inspect/cascade-inspect-view')

    let scene = seedSiteKitPaletteMasters(createLegacyFixtureScene())
    const master = findMasterBySourceKey(scene.masters, 'SiteChart')
    expect(master).toBeTruthy()
    const inserted = applySceneOp(scene, {
      op: 'insert_instance',
      masterId: master!.id,
      parentId: scene.root.id,
    })
    expect(inserted.ok).toBe(true)
    if (!inserted.ok) return
    scene = inserted.scene
    const instId = scene.root.children?.find((c) => c.instanceOf === master!.id)?.id
    expect(instId).toBeTruthy()
    const persisted = scene.root.children?.find((c) => c.id === instId)
    expect(persisted && isInstanceNode(persisted)).toBe(true)

    const written = applySceneOp(scene, {
      op: 'set_prop',
      nodeId: instId!,
      key: 'chartType',
      value: 'donut',
    })
    expect(written.ok).toBe(true)
    if (!written.ok) return
    scene = written.scene
    const after = scene.root.children?.find((c) => c.id === instId)
    expect(after?.instanceOverrides?.props?.chartType).toBe('donut')
    expect(after?.instanceOverrides?.props?.variant).toBe('donut')

    const masterAfter = findMasterBySourceKey(scene.masters, 'SiteChart')
    expect(masterAfter?.root.props?.chartType).toBe('donut')

    const expanded = expandInstanceNode(after!, scene.masters)
    expect(expanded.props?.chartType ?? expanded.props?.variant).toBe('donut')
    expect(expanded.type).toBe('SiteChart')

    const chartTypeField = inspectFieldsForType('SiteChart').find((f) => f.name === 'chartType')!
    const cascaded = cascadeInspectView(expanded, 'desktop', 'default')
    expect(fieldValue(expanded, chartTypeField, cascaded)).toBe('donut')
  })

  it('documents Site Kit layer in knowledge', () => {
    const knowledge = readFileSync(
      path.resolve(root, '../../knowledge/editor-palette-charts.md'),
      'utf8',
    )
    expect(knowledge).toContain('SiteChart')
    expect(knowledge).toContain('Site Kit')
    const atoms = readFileSync(
      path.resolve(root, '../../knowledge/site-kit-atoms-first.md'),
      'utf8',
    )
    expect(atoms).toContain('SiteChart')
    expect(atoms).toContain('SiteGauge')
  })
})
