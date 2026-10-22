import { describe, expect, it } from 'vitest'
import { applySceneOp, defaultChildForType } from '../lib/scene/ops'
import { createEmptyArtboardScene } from '../lib/scene/demo-scene'
import type { CompositionScene, SceneNode } from '@zaoly/contracts'

function sceneWithTable(): { scene: CompositionScene; table: SceneNode } {
  const scene = createEmptyArtboardScene()
  const table = defaultChildForType('SiteTable')
  // Keep page root and scene.root as the same tree (pages materialization).
  scene.root.children = [table]
  return { scene, table }
}

function tableNode(scene: CompositionScene): SceneNode {
  return scene.root.children![0]!
}

function cellCount(row: SceneNode): number {
  return (row.children ?? []).filter((c) => c.type === 'SiteTableCell').length
}

describe('SiteTable seed + structure ops', () => {
  it('seeds 3 columns with 1 header row and 2 body rows', () => {
    const table = defaultChildForType('SiteTable')
    expect(table.type).toBe('SiteTable')
    const rows = table.children ?? []
    expect(rows).toHaveLength(3)
    expect(rows[0]?.props?.header).toBe(true)
    expect(rows[0]?.children).toHaveLength(3)
    expect(rows[1]?.props?.header).toBeFalsy()
    expect(rows[2]?.children?.[0]?.children?.[0]?.type).toBe('SiteText')
  })

  it('adds a body row matching column count', () => {
    const { scene, table } = sceneWithTable()
    const next = applySceneOp(scene, { op: 'table_add_row', nodeId: table.id })
    expect(next).toMatchObject({ ok: true })
    if (!next.ok) return
    const rows = tableNode(next.scene).children ?? []
    expect(rows).toHaveLength(4)
    expect(cellCount(rows[3]!)).toBe(3)
    expect(rows[3]?.props?.header).toBeFalsy()
  })

  it('adds a column to every row', () => {
    const { scene, table } = sceneWithTable()
    const next = applySceneOp(scene, { op: 'table_add_column', nodeId: table.id })
    expect(next).toMatchObject({ ok: true })
    if (!next.ok) return
    for (const row of tableNode(next.scene).children ?? []) {
      expect(cellCount(row)).toBe(4)
    }
  })

  it('rejects structure ops on Instance refs', () => {
    const scene = createEmptyArtboardScene()
    const instance: SceneNode = {
      id: 'instance-tbl',
      type: 'Instance',
      name: 'Table',
      instanceOf: 'master-SiteTable',
      instanceOverrides: { props: { density: 'comfortable', borders: 'all' } },
    }
    scene.root.children = [instance]
    const next = applySceneOp(scene, { op: 'table_add_row', nodeId: instance.id })
    expect(next.ok).toBe(false)
    if (next.ok) return
    expect(next.reason).toMatch(/sealed on Instances/i)
  })
})
