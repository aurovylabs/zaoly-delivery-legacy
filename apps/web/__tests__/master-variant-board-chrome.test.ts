import { describe, expect, it } from 'vitest'
import type { SceneMaster, SceneNode } from '@zaoly/contracts'
import {
  MASTER_BOARD_ADD_ID,
  buildMasterVariantBoard,
  isMasterBoardAddId,
  nextMasterVariantName,
  resolveMasterBoardClick,
} from '../lib/scene/master-variants'

function leaf(id: string): SceneNode {
  return { id, type: 'SiteText', props: { children: id } }
}

function stripMaster(overrides?: Partial<SceneMaster>): SceneMaster {
  const root = leaf('r')
  return {
    id: 'm1',
    name: 'Button',
    root,
    defaultVariantId: 'v1',
    variants: [
      { id: 'v1', name: 'Default', root },
      { id: 'v2', name: 'Alt', root: leaf('alt') },
    ],
    ...overrides,
  }
}

describe('master variant board chrome', () => {
  it('paints dashed chrome markers, titles, and trailing Add tile on strips', () => {
    const master = stripMaster()
    const board = buildMasterVariantBoard(master, 'v1')
    expect(board.props?.['data-master-board']).toBe('strip')
    const tiles = board.children ?? []
    expect(tiles).toHaveLength(3)
    const active = tiles[0]!
    expect(active.props?.['data-master-variant-chrome']).toBe('true')
    expect(active.props?.['data-master-variant-active']).toBe('true')
    const label = active.children?.[0]
    expect(label?.props?.['data-master-variant-label']).toBe('true')
    expect(label?.props?.children).toBe('Editing · Default')
    expect(active.children?.[1]?.props?.['data-master-variant-body']).toBe('true')
    expect(active.children?.[1]?.props?.['data-master-variant-body-active']).toBe('true')
    const inactive = tiles[1]!
    expect(inactive.props?.['data-master-variant-active']).toBe('false')
    expect(inactive.children?.[0]?.props?.children).toBe('Alt')
    const add = tiles[2]!
    expect(add.id).toBe(MASTER_BOARD_ADD_ID)
    expect(add.props?.['data-master-variant-add']).toBe('true')
  })

  it('resolves Add tile clicks and suggests unique Variant N names', () => {
    const master = stripMaster()
    const board = buildMasterVariantBoard(master, 'v1')
    const activeRoot = master.variants![0]!.root
    expect(
      resolveMasterBoardClick(board, activeRoot, 'v1', MASTER_BOARD_ADD_ID),
    ).toEqual({ type: 'add' })
    expect(
      resolveMasterBoardClick(board, activeRoot, 'v1', `${MASTER_BOARD_ADD_ID}:plus`),
    ).toEqual({ type: 'add' })
    expect(isMasterBoardAddId(MASTER_BOARD_ADD_ID)).toBe(true)
    expect(nextMasterVariantName(master)).toBe('Variant 2')
    expect(
      nextMasterVariantName(
        stripMaster({
          variants: [
            { id: 'v1', name: 'Default', root: leaf('r') },
            { id: 'v2', name: 'Variant 2', root: leaf('x') },
          ],
        }),
      ),
    ).toBe('Variant 3')
  })

  it('keeps multi-axis matrices without a free-form Add tile', () => {
    const a = leaf('A')
    const master: SceneMaster = {
      id: 'm',
      name: 'M',
      root: a,
      defaultVariantId: 'v1',
      axes: [
        { id: 'size', name: 'Size', values: ['sm', 'lg'] },
        { id: 'tone', name: 'Tone', values: ['pri', 'sec'] },
      ],
      variants: [
        {
          id: 'v1',
          name: 'sm / pri',
          root: a,
          combination: { size: 'sm', tone: 'pri' },
        },
      ],
    }
    const board = buildMasterVariantBoard(master, 'v1')
    expect(board.props?.['data-master-matrix']).toBe('true')
    const ids: string[] = []
    const walk = (n: SceneNode) => {
      ids.push(n.id)
      for (const c of n.children ?? []) walk(c)
    }
    walk(board)
    expect(ids.some((id) => isMasterBoardAddId(id))).toBe(false)
    expect(
      ids.some((id) => id.includes('__master-variant-placeholder:')),
    ).toBe(true)
  })
})
