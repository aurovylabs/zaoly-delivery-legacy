import { describe, expect, it } from 'vitest'
import { EDITOR_BREAKPOINT_WIDTHS } from '../lib/scene/breakpoints'
import { createLegacyFixtureScene } from '../lib/scene/demo-scene'
import { normalizeScene } from '../lib/scene/scene-normalize'
import {
  BOARD_PAGE_GAP,
  SCENE_BOARD_ID,
  applyFramePositionPreview,
  autoPlacePageFrame,
  buildSceneBoardForPaint,
  cycleActivePageId,
  normalizePageFrame,
  normalizePageFrames,
  prepareSceneBoardForPersist,
  computePageFrameBounds,
  computeAllPageFramesBounds,
  isBoardPagePlaceholderBody,
  resolvePageFrameWidth,
  resolvePageArtboardWidth,
  resolvePageBreakpoint,
  isPageFrameInspectableId,
  resolveSceneBoardClick,
  sceneBoardFrameNodeId,
  sceneBoardPlaceholderBodyId,
  shouldLazyPaintInactiveBoardPages,
  snapBoardFrameCoord,
  snapPageFramePosition,
} from '../lib/scene/scene-board'
import { prepareScenePagesForPersist } from '../lib/scene/scene-pages'
import { upsertScene, __resetSceneStoreForTests } from '../lib/scene/scene-store'

const DESKTOP_WIDTH = EDITOR_BREAKPOINT_WIDTHS.desktop

describe('scene board normalize (P81 wave 1)', () => {
  it('normalizePageFrame rejects invalid coords', () => {
    expect(normalizePageFrame(undefined)).toBeUndefined()
    expect(normalizePageFrame({ x: 'bad', y: 0 })).toBeUndefined()
    expect(normalizePageFrame({ x: 10, y: 20, width: 400 })).toEqual({ x: 10, y: 20, width: 400 })
    expect(normalizePageFrame({ x: 10, y: 20, width: 400, height: 900 })).toEqual({
      x: 10,
      y: 20,
      width: 400,
      height: 900,
    })
  })

  it('normalizePageFrames lays out a horizontal row when frames are missing', () => {
    const demo = createLegacyFixtureScene()
    const contactRoot = { ...demo.root, id: 'page-contact-root' }
    const pages = normalizePageFrames(
      [
        { id: 'page-home', name: 'Home', root: demo.root },
        { id: 'page-contact', name: 'Contact', root: contactRoot },
      ],
      DESKTOP_WIDTH,
    )
    expect(pages[0]?.frame).toEqual({ x: 0, y: 0 })
    expect(pages[1]?.frame).toEqual({
      x: DESKTOP_WIDTH + BOARD_PAGE_GAP,
      y: 0,
    })
  })

  it('normalizePageFrames preserves valid explicit frames', () => {
    const demo = createLegacyFixtureScene()
    const pages = normalizePageFrames(
      [{ id: 'page-a', name: 'A', root: demo.root, frame: { x: 40, y: 80, width: 500 } }],
      DESKTOP_WIDTH,
    )
    expect(pages[0]?.frame).toEqual({ x: 40, y: 80, width: 500 })
    expect(resolvePageFrameWidth(pages[0]!, DESKTOP_WIDTH)).toBe(500)
  })

  it('autoPlacePageFrame places to the right of the anchor page', () => {
    const demo = createLegacyFixtureScene()
    const contactRoot = { ...demo.root, id: 'page-contact-root' }
    const pages = normalizePageFrames(
      [
        { id: 'page-home', name: 'Home', root: demo.root },
        { id: 'page-contact', name: 'Contact', root: contactRoot },
      ],
      DESKTOP_WIDTH,
    )
    const next = autoPlacePageFrame(pages, 'page-home', DESKTOP_WIDTH)
    expect(next).toEqual({
      x: DESKTOP_WIDTH + BOARD_PAGE_GAP,
      y: 0,
    })
  })

  it('normalizeScene assigns frames to legacy P80 pages on load', () => {
    const demo = createLegacyFixtureScene()
    const contactRoot = { ...demo.root, id: 'page-contact-root' }
    const scene = normalizeScene({
      id: demo.id,
      name: demo.name,
      version: 1,
      root: demo.root,
      pages: [
        { id: 'page-home', name: 'Home', root: demo.root },
        { id: 'page-contact', name: 'Contact', root: contactRoot },
      ],
      activePageId: 'page-home',
      updatedAt: demo.updatedAt,
    })
    expect(scene?.pages?.[0]?.frame).toEqual({ x: 0, y: 0 })
    expect(scene?.pages?.[1]?.frame?.x).toBe(DESKTOP_WIDTH + BOARD_PAGE_GAP)
  })

  it('prepareScenePagesForPersist writes frames on save', async () => {
    __resetSceneStoreForTests({ durable: false, wipeDisk: true })
    const demo = createLegacyFixtureScene()
    const contactRoot = { ...demo.root, id: 'page-contact-root' }
    const saved = await upsertScene({
      ...demo,
      pages: [
        { id: 'page-home', name: 'Home', root: demo.root },
        { id: 'page-contact', name: 'Contact', root: contactRoot },
      ],
      activePageId: 'page-home',
      root: demo.root,
    })
    expect(saved.pages?.[0]?.frame).toEqual({ x: 0, y: 0 })
    expect(saved.pages?.[1]?.frame?.x).toBe(DESKTOP_WIDTH + BOARD_PAGE_GAP)
  })

  it('prepareSceneBoardForPersist is idempotent for valid frames', () => {
    const demo = createLegacyFixtureScene()
    const prepared = prepareSceneBoardForPersist({
      ...demo,
      pages: [
        {
          id: 'page-a',
          name: 'A',
          root: demo.root,
          frame: { x: 12, y: 34 },
        },
      ],
      activePageId: 'page-a',
    })
    expect(prepared.pages?.[0]?.frame).toEqual({ x: 12, y: 34 })
  })
})

describe('scene board lazy paint (Wave 7 / P88)', () => {
  it('shouldLazyPaintInactiveBoardPages stays off so all artboards paint fully', () => {
    expect(shouldLazyPaintInactiveBoardPages(1)).toBe(false)
    expect(shouldLazyPaintInactiveBoardPages(2)).toBe(false)
    expect(shouldLazyPaintInactiveBoardPages(5)).toBe(false)
  })
})

describe('scene board paint (P81 wave 3)', () => {
  it('buildSceneBoardForPaint lays out two frames with absolute positions', () => {
    const demo = createLegacyFixtureScene()
    const contactRoot = { ...demo.root, id: 'page-contact-root' }
    const scene = {
      ...demo,
      pages: [
        { id: 'page-home', name: 'Home', root: demo.root, frame: { x: 0, y: 0 } },
        {
          id: 'page-contact',
          name: 'Contact',
          root: contactRoot,
          frame: { x: DESKTOP_WIDTH + BOARD_PAGE_GAP, y: 0 },
        },
      ],
      activePageId: 'page-home',
    }
    const board = buildSceneBoardForPaint(scene, 'page-home', DESKTOP_WIDTH, 640)
    expect(board.id).toBe(SCENE_BOARD_ID)
    expect(board.children).toHaveLength(2)
    const homeFrame = board.children?.[0]
    const contactFrame = board.children?.[1]
    expect(homeFrame?.id).toBe(sceneBoardFrameNodeId('page-home'))
    expect(homeFrame?.style).toMatchObject({ position: 'absolute', left: 0, top: 0, width: DESKTOP_WIDTH })
    expect(contactFrame?.style).toMatchObject({
      position: 'absolute',
      left: DESKTOP_WIDTH + BOARD_PAGE_GAP,
      top: 0,
      width: DESKTOP_WIDTH,
    })
    expect(homeFrame?.props?.['data-page-frame-active']).toBe('true')
    expect(contactFrame?.props?.['data-page-frame-active']).toBe('false')
    expect(homeFrame?.children?.[1]?.id).toBe('root')
    expect(contactFrame?.children?.[1]?.id).toBe('page-contact-root')
    expect(isBoardPagePlaceholderBody(contactFrame!.children![1]!)).toBe(false)
  })

  it('buildSceneBoardForPaint paints placeholders when lazyInactivePages is true', () => {
    const demo = createLegacyFixtureScene()
    const contactRoot = { ...demo.root, id: 'page-contact-root' }
    const scene = {
      ...demo,
      pages: [
        { id: 'page-home', name: 'Home', root: demo.root, frame: { x: 0, y: 0 } },
        {
          id: 'page-contact',
          name: 'Contact',
          root: contactRoot,
          frame: { x: DESKTOP_WIDTH + BOARD_PAGE_GAP, y: 0 },
        },
      ],
      activePageId: 'page-home',
    }
    const board = buildSceneBoardForPaint(scene, 'page-home', DESKTOP_WIDTH, 640, {
      lazyInactivePages: true,
    })
    expect(board.children?.[0]?.children?.[1]?.id).toBe('root')
    expect(board.children?.[1]?.children?.[1]?.id).toBe(sceneBoardPlaceholderBodyId('page-contact'))
    expect(isBoardPagePlaceholderBody(board.children![1]!.children![1]!)).toBe(true)
  })

  it('buildSceneBoardForPaint paints full trees by default (lazyInactivePages false)', () => {
    const demo = createLegacyFixtureScene()
    const contactRoot = { ...demo.root, id: 'page-contact-root' }
    const scene = {
      ...demo,
      pages: [
        { id: 'page-home', name: 'Home', root: demo.root, frame: { x: 0, y: 0 } },
        {
          id: 'page-contact',
          name: 'Contact',
          root: contactRoot,
          frame: { x: DESKTOP_WIDTH + BOARD_PAGE_GAP, y: 0 },
        },
      ],
      activePageId: 'page-home',
    }
    const board = buildSceneBoardForPaint(scene, 'page-home', DESKTOP_WIDTH, 640, {
      lazyInactivePages: false,
    })
    expect(board.children?.[1]?.children?.[1]?.id).toBe('page-contact-root')
  })

  it('resolveSceneBoardClick activates inactive page on placeholder body click', () => {
    const demo = createLegacyFixtureScene()
    const contactRoot = { ...demo.root, id: 'page-contact-root' }
    const scene = {
      ...demo,
      pages: [
        { id: 'page-home', name: 'Home', root: demo.root, frame: { x: 0, y: 0 } },
        {
          id: 'page-contact',
          name: 'Contact',
          root: contactRoot,
          frame: { x: DESKTOP_WIDTH + BOARD_PAGE_GAP, y: 0 },
        },
      ],
      activePageId: 'page-home',
    }
    const board = buildSceneBoardForPaint(scene, 'page-home', DESKTOP_WIDTH, 640, {
      lazyInactivePages: true,
    })
    const placeholderId = sceneBoardPlaceholderBodyId('page-contact')
    const resolved = resolveSceneBoardClick(board, scene, 'page-home', placeholderId)
    expect(resolved).toEqual({
      type: 'activate',
      pageId: 'page-contact',
      selectId: 'page-contact-root',
    })
  })

  it('resolveSceneBoardClick selects active frame chrome', () => {
    const demo = createLegacyFixtureScene()
    const scene = {
      ...demo,
      pages: [{ id: 'page-home', name: 'Home', root: demo.root, frame: { x: 0, y: 0 } }],
      activePageId: 'page-home',
    }
    const board = buildSceneBoardForPaint(scene, 'page-home', DESKTOP_WIDTH, 640)
    const frameId = sceneBoardFrameNodeId('page-home')
    expect(resolveSceneBoardClick(board, scene, 'page-home', frameId)).toEqual({
      type: 'select',
      nodeId: frameId,
    })
  })
})

describe('scene board frame bounds (P81.1 Wave A)', () => {
  it('computePageFrameBounds uses frame position and artboard height', () => {
    const demo = createLegacyFixtureScene()
    const page = {
      id: 'page-home',
      name: 'Home',
      root: demo.root,
      frame: { x: 100, y: 50 },
    }
    const bounds = computePageFrameBounds(page, DESKTOP_WIDTH, 800)
    expect(bounds.x).toBe(100)
    expect(bounds.y).toBe(50)
    expect(bounds.width).toBe(DESKTOP_WIDTH)
    expect(bounds.height).toBeGreaterThan(800)
  })

  it('computeAllPageFramesBounds unions every page frame', () => {
    const demo = createLegacyFixtureScene()
    const contactRoot = { ...demo.root, id: 'page-contact-root' }
    const scene = normalizeScene({
      id: demo.id,
      name: demo.name,
      version: 1,
      root: demo.root,
      pages: [
        { id: 'page-home', name: 'Home', root: demo.root, frame: { x: 0, y: 0 } },
        {
          id: 'page-contact',
          name: 'Contact',
          root: contactRoot,
          frame: { x: DESKTOP_WIDTH + BOARD_PAGE_GAP, y: 0 },
        },
      ],
      activePageId: 'page-home',
      updatedAt: demo.updatedAt,
    })!
    const bounds = computeAllPageFramesBounds(scene, DESKTOP_WIDTH, 800)
    expect(bounds.x).toBe(0)
    expect(bounds.width).toBeGreaterThan(DESKTOP_WIDTH)
  })
})

describe('scene board frame drag helpers', () => {
  it('snapBoardFrameCoord rounds to 8px grid', () => {
    expect(snapBoardFrameCoord(0)).toBe(0)
    expect(snapBoardFrameCoord(5)).toBe(8)
    expect(snapBoardFrameCoord(13)).toBe(16)
  })

  it('applyFramePositionPreview moves painted frame', () => {
    const demo = createLegacyFixtureScene()
    const board = buildSceneBoardForPaint(
      { ...demo, pages: [{ id: 'page-home', name: 'Home', root: demo.root, frame: { x: 0, y: 0 } }] },
      'page-home',
      DESKTOP_WIDTH,
      640,
    )
    const preview = applyFramePositionPreview(board, { pageId: 'page-home', x: 240, y: 80 })
    const frame = preview.children?.[0]
    expect(frame?.style?.left).toBe(240)
    expect(frame?.style?.top).toBe(80)
  })
})

describe('scene board polish (Wave C)', () => {
  it('cycleActivePageId wraps in pages[] order', () => {
    const pages = [
      { id: 'a', name: 'A', root: { id: 'ra', type: 'Stack', children: [] } },
      { id: 'b', name: 'B', root: { id: 'rb', type: 'Stack', children: [] } },
      { id: 'c', name: 'C', root: { id: 'rc', type: 'Stack', children: [] } },
    ]
    expect(cycleActivePageId(pages, 'a', 1)).toBe('b')
    expect(cycleActivePageId(pages, 'c', 1)).toBe('a')
    expect(cycleActivePageId(pages, 'a', -1)).toBe('c')
  })

  it('snapPageFramePosition aligns to neighbor frame edge', () => {
    const demo = createLegacyFixtureScene()
    const contactRoot = { ...demo.root, id: 'page-contact-root' }
    const pages = [
      { id: 'page-home', name: 'Home', root: demo.root, frame: { x: 0, y: 0 } },
      {
        id: 'page-contact',
        name: 'Contact',
        root: contactRoot,
        frame: { x: DESKTOP_WIDTH + BOARD_PAGE_GAP, y: 0 },
      },
    ]
    const snapped = snapPageFramePosition(
      'page-contact',
      DESKTOP_WIDTH + 6,
      4,
      pages,
      DESKTOP_WIDTH,
      640,
    )
    expect(snapped.x).toBe(DESKTOP_WIDTH)
    expect(snapped.y).toBe(0)
  })
})

describe('scene board backlog (Phase 1.4)', () => {
  it('resolvePageArtboardWidth uses per-page breakpoint when width unset', () => {
    const demo = createLegacyFixtureScene()
    const page = {
      id: 'page-home',
      name: 'Home',
      root: demo.root,
      breakpoint: 'mobile' as const,
      frame: { x: 0, y: 0 },
    }
    const scene = { ...demo, pages: [page], activeBreakpoint: 'desktop' as const }
    expect(resolvePageBreakpoint(page, scene)).toBe('mobile')
    expect(resolvePageArtboardWidth(page, scene)).toBe(EDITOR_BREAKPOINT_WIDTHS.mobile)
  })

  it('resolvePageArtboardWidth prefers explicit frame.width', () => {
    const demo = createLegacyFixtureScene()
    const page = {
      id: 'page-home',
      name: 'Home',
      root: demo.root,
      breakpoint: 'mobile' as const,
      frame: { x: 0, y: 0, width: 512 },
    }
    expect(resolvePageArtboardWidth(page, demo)).toBe(512)
  })

  it('isPageFrameInspectableId matches frame chrome but not placeholder body', () => {
    const frameId = sceneBoardFrameNodeId('page-home')
    expect(isPageFrameInspectableId(frameId)).toBe(true)
    expect(isPageFrameInspectableId(sceneBoardPlaceholderBodyId('page-home'))).toBe(false)
    expect(isPageFrameInspectableId(SCENE_BOARD_ID)).toBe(false)
  })
})
