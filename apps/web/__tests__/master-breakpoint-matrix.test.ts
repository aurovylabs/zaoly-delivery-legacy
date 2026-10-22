import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { SceneMaster, SceneNode } from '@zaoly/contracts'
import {
  MATRIX_BOARD_ID,
  buildMasterBreakpointMatrixBoard,
  parseMatrixRemappedId,
  resolveMatrixBoardClick,
} from '../lib/scene/master-breakpoint-matrix'

function root(id: string): SceneNode {
  return {
    id,
    type: 'SiteStack',
    props: { direction: 'column' },
    children: [{ id: `${id}-t`, type: 'SiteText', props: { text: id }, children: [] }],
  }
}

function master(): SceneMaster {
  return {
    id: 'm1',
    name: 'Hero',
    root: root('def'),
    defaultVariantId: 'v1',
    variants: [
      { id: 'v1', name: 'Default', root: root('def') },
      { id: 'v2', name: 'Compact', root: root('cmp') },
    ],
  }
}

const labels = { desktop: 'Desktop', tablet: 'Tablet', mobile: 'Mobile' }

describe('Wave I master breakpoint matrix', () => {
  it('builds nested variant rows × BP tiles with one persisted active cell', () => {
    const board = buildMasterBreakpointMatrixBoard(master(), 'v1', 'tablet', {
      labels,
      primaryLabel: 'Primary',
    })
    expect(board.id).toBe(MATRIX_BOARD_ID)
    expect(board.children).toHaveLength(2)
    const activeTile = board.children![0]!.children![1]!.children!.find(
      (c) => c.props?.['data-breakpoint-tile'] === 'tablet',
    )
    expect(activeTile?.props?.['data-breakpoint-active']).toBe('true')
    const body = activeTile?.children?.[1]?.children?.[0]
    expect(body?.id).toBe('def')
    const inactive = board.children![1]!.children![1]!.children!.find(
      (c) => c.props?.['data-breakpoint-tile'] === 'desktop',
    )
    const inactiveBody = inactive?.children?.[1]?.children?.[0]
    expect(inactiveBody?.id).toMatch(/^__mx-node:v2:desktop\//)
    const parsed = parseMatrixRemappedId(inactiveBody!.id)
    expect(parsed).toEqual({ variantId: 'v2', bp: 'desktop', nodeId: 'cmp' })
  })

  it('resolves matrix clicks to variant and cell', () => {
    expect(resolveMatrixBoardClick('__mx-row:v2')).toEqual({
      kind: 'variant',
      variantId: 'v2',
    })
    expect(resolveMatrixBoardClick('__bp-tile:v1:mobile')).toEqual({
      kind: 'cell',
      variantId: 'v1',
      bp: 'mobile',
    })
    expect(
      resolveMatrixBoardClick('__mx-node:v2:tablet/cmp-t'),
    ).toEqual({
      kind: 'cell',
      variantId: 'v2',
      bp: 'tablet',
      nodeId: 'cmp-t',
    })
  })

  it('computes matrix ghost ids for inactive BP columns of the active variant', async () => {
    const { computeMatrixCompareGhostIds } = await import(
      '../lib/editor/breakpoint-compare-ghost-store'
    )
    const ghosts = computeMatrixCompareGhostIds(['def-t'], 'tablet', 'v1')
    expect(ghosts).toEqual([
      '__mx-node:v1:desktop/def-t',
      '__mx-node:v1:mobile/def-t',
    ])
  })

  it('documents Wave I spec + bar Matrix dimension', () => {
    const rootDir = path.resolve(__dirname, '../../..')
    const spec = readFileSync(
      path.join(rootDir, 'specs/domain/master-edit-variant-breakpoint-matrix.md'),
      'utf8',
    )
    const dim = readFileSync(
      path.join(rootDir, 'specs/domain/master-edit-board-dimension.md'),
      'utf8',
    )
    const bar = readFileSync(
      path.join(rootDir, 'apps/web/components/editor-master-edit-bar.tsx'),
      'utf8',
    )
    expect(spec).toContain('Matrix')
    expect(dim).toContain('matrix')
    expect(bar).toContain("'matrix'")
    expect(bar).toContain('dimensionMatrixLabel')
  })
})
