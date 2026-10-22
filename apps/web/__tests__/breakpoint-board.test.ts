import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { SceneNode } from '@zaoly/contracts'
import {
  BREAKPOINT_BOARD_ID,
  BREAKPOINT_COMPARE_BPS,
  buildBreakpointCompareBoard,
  parseBreakpointBoardRemappedId,
  remapBreakpointBoardNodeId,
  resolveBreakpointBoardClick,
} from '../lib/scene/breakpoint-board'
import { EDITOR_BREAKPOINT_WIDTHS } from '../lib/scene/breakpoints'

const labels = {
  desktop: 'Desktop',
  tablet: 'Tablet',
  mobile: 'Mobile',
} as const

function pageRoot(): SceneNode {
  return {
    id: 'page-root',
    type: 'Stack',
    name: 'Page',
    props: { direction: 'column' },
    children: [
      {
        id: 'hero',
        type: 'Text',
        name: 'Hero',
        props: { children: 'Hello' },
        breakpoints: {
          mobile: { props: { children: 'Hi' } },
        },
      },
    ],
  }
}

describe('breakpoint compare board (Wave A)', () => {
  it('builds three tiles with correct widths; active keeps real ids', () => {
    const board = buildBreakpointCompareBoard(pageRoot(), 'desktop', {
      labels,
      primaryLabel: 'Primary',
    })
    expect(board.id).toBe(BREAKPOINT_BOARD_ID)
    expect(board.children).toHaveLength(3)
    for (const bp of BREAKPOINT_COMPARE_BPS) {
      const tile = board.children!.find((c) => c.props?.['data-breakpoint-tile'] === bp)
      expect(tile).toBeTruthy()
      expect(tile!.style?.width).toBe(EDITOR_BREAKPOINT_WIDTHS[bp])
    }
    const desktopTile = board.children![0]!
    expect(desktopTile.props?.['data-breakpoint-primary']).toBe('true')
    expect(desktopTile.children![0]!.props?.children).toContain('Primary')
    expect(board.children![1]!.props?.['data-breakpoint-primary']).toBeUndefined()
    const desktopBody = board.children![0]!.children![1]!.children![0]!
    expect(desktopBody.id).toBe('page-root')
    expect(desktopBody.children![0]!.id).toBe('hero')
  })

  it('remaps inactive tile ids so DOM ids stay unique', () => {
    const board = buildBreakpointCompareBoard(pageRoot(), 'desktop', { labels })
    const tabletBody = board.children![1]!.children![1]!.children![0]!
    expect(tabletBody.id).toBe(remapBreakpointBoardNodeId('tablet', 'page-root'))
    const parsed = parseBreakpointBoardRemappedId(tabletBody.children![0]!.id)
    expect(parsed).toEqual({ bp: 'tablet', nodeId: 'hero' })
  })

  it('click inactive tile activates breakpoint; remapped node selects original', () => {
    expect(resolveBreakpointBoardClick('__bp-tile:tablet', 'desktop')).toEqual({
      type: 'activate',
      breakpoint: 'tablet',
    })
    expect(
      resolveBreakpointBoardClick(remapBreakpointBoardNodeId('mobile', 'hero'), 'desktop'),
    ).toEqual({
      type: 'activate',
      breakpoint: 'mobile',
      selectId: 'hero',
    })
    expect(resolveBreakpointBoardClick('hero', 'desktop')).toEqual({
      type: 'select',
      nodeId: 'hero',
    })
  })

  it('wires toolbar compare toggle and documents the spec', () => {
    const root = path.resolve(__dirname, '../../..')
    const toolbar = readFileSync(
      path.join(root, 'apps/web/components/editor/editor-toolbar.tsx'),
      'utf8',
    )
    const spec = readFileSync(
      path.join(root, 'specs/domain/responsive-breakpoint-board.md'),
      'utf8',
    )
    const en = JSON.parse(
      readFileSync(path.join(root, 'apps/web/locales/en.json'), 'utf8'),
    ) as { editor: Record<string, string> }
    expect(toolbar).toContain('editor-breakpoint-compare')
    expect(toolbar).toContain('onBreakpointCompareToggle')
    expect(spec).toContain('Compare board')
    expect(spec).toContain('fit viewport')
    expect(en.editor.breakpointCompare).toMatch(/Compare/i)
    const sceneState = readFileSync(
      path.join(root, 'apps/web/components/editor/use-editor-scene-state.ts'),
      'utf8',
    )
    const boardNav = readFileSync(
      path.join(root, 'apps/web/components/editor/use-editor-board-nav.ts'),
      'utf8',
    )
    expect(sceneState).toContain('fitAllFramesRef.current()')
    expect(sceneState).toContain('wideBoardCameraRef')
    expect(boardNav).toContain('breakpointBoardMode')
    expect(boardNav).toContain('fitToBoardCanvas')
  })

  it('Master-Edit Compare paints an arbitrary working root (variant tree)', () => {
    const masterRoot: SceneNode = {
      id: 'master-root',
      type: 'SiteStack',
      name: 'Nav',
      props: { direction: 'row' },
      children: [{ id: 'logo', type: 'SiteText', props: { text: 'Zaoly' }, children: [] }],
    }
    const board = buildBreakpointCompareBoard(masterRoot, 'tablet', {
      labels,
      primaryLabel: 'Primary',
    })
    expect(board.id).toBe(BREAKPOINT_BOARD_ID)
    const activeBody = board.children!.find(
      (c) => c.props?.['data-breakpoint-tile'] === 'tablet',
    )!.children![1]!.children![0]!
    expect(activeBody.id).toBe('master-root')
    expect(activeBody.children![0]!.id).toBe('logo')
    const desktopBody = board.children!.find(
      (c) => c.props?.['data-breakpoint-tile'] === 'desktop',
    )!.children![1]!.children![0]!
    expect(desktopBody.id).toBe(remapBreakpointBoardNodeId('desktop', 'master-root'))
  })

  it('documents Master-Edit + Compare in the board spec', () => {
    const root = path.resolve(__dirname, '../../..')
    const spec = readFileSync(
      path.join(root, 'specs/domain/responsive-breakpoint-board.md'),
      'utf8',
    )
    const sceneState = readFileSync(
      path.join(root, 'apps/web/components/editor/use-editor-scene-state.ts'),
      'utf8',
    )
    expect(spec).toContain('Master-Edit + Compare')
    expect(spec).toContain('active named variant')
    // Must not force Compare off when entering Master-Edit.
    expect(sceneState).not.toMatch(
      /if \(editingMasterId\) \{\s*setBreakpointCompareMode\(false\)/,
    )
    expect(sceneState).toContain('editingVariant?.root ?? pageRoot')
  })
})
