import { describe, expect, it } from 'vitest'
import { EDITOR_BREAKPOINT_WIDTHS } from '../lib/scene/breakpoints'
import { createLegacyFixtureScene } from '../lib/scene/demo-scene'
import { normalizeScene } from '../lib/scene/scene-normalize'
import {
  buildBoardMinimapFrames,
  boardMinimapCameraWorldRect,
  boardMinimapFrameStyle,
  boardMinimapPanDeltaFromWorldDelta,
  boardMinimapViewportStyle,
  boardMinimapWorldDeltaFromPointerDelta,
  hitTestBoardMinimapFrame,
  layoutBoardMinimap,
} from '../lib/scene/scene-board-minimap'
import { BOARD_PAGE_GAP } from '../lib/scene/scene-board'

const DESKTOP_WIDTH = EDITOR_BREAKPOINT_WIDTHS.desktop

function twoPageScene() {
  const demo = createLegacyFixtureScene()
  const contactRoot = { ...demo.root, id: 'page-contact-root' }
  return normalizeScene({
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
}

describe('scene board minimap (Phase 1.4)', () => {
  it('buildBoardMinimapFrames marks active page', () => {
    const scene = twoPageScene()
    const frames = buildBoardMinimapFrames(scene, 'page-contact', DESKTOP_WIDTH, 640)
    expect(frames).toHaveLength(2)
    expect(frames.find((f) => f.pageId === 'page-home')?.active).toBe(false)
    expect(frames.find((f) => f.pageId === 'page-contact')?.active).toBe(true)
  })

  it('hitTestBoardMinimapFrame returns topmost page under pointer', () => {
    const scene = twoPageScene()
    const frames = buildBoardMinimapFrames(scene, 'page-home', DESKTOP_WIDTH, 640)
    const layout = layoutBoardMinimap(frames)
    const second = frames[1]!
    const style = boardMinimapFrameStyle(second, layout)
    const cx = style.left + style.width / 2
    const cy = style.top + style.height / 2
    expect(hitTestBoardMinimapFrame(frames, layout, cx, cy)).toBe('page-contact')
  })

  it('zoomed-out camera shrinks page thumbs so viewport stays inside widget', () => {
    const scene = twoPageScene()
    const frames = buildBoardMinimapFrames(scene, 'page-home', DESKTOP_WIDTH, 640)
    const maxW = 168
    const maxH = 112
    const zoomedOut = {
      zoom: 0.05,
      panX: 0,
      panY: 0,
      viewportWidth: 1200,
      viewportHeight: 800,
    }
    const camera = boardMinimapCameraWorldRect(zoomedOut)!
    expect(camera.width).toBeGreaterThan(frames[0]!.width)

    const layoutFitted = layoutBoardMinimap(frames, maxW, maxH, camera)
    const layoutPagesOnly = layoutBoardMinimap(frames, maxW, maxH)
    expect(layoutFitted.scale).toBeLessThan(layoutPagesOnly.scale)

    const homeFitted = boardMinimapFrameStyle(frames[0]!, layoutFitted)
    const homePagesOnly = boardMinimapFrameStyle(frames[0]!, layoutPagesOnly)
    expect(homeFitted.width).toBeLessThan(homePagesOnly.width)

    const viewport = boardMinimapViewportStyle({ layout: layoutFitted, ...zoomedOut })!
    expect(viewport.left).toBeGreaterThanOrEqual(0)
    expect(viewport.top).toBeGreaterThanOrEqual(0)
    expect(viewport.left + viewport.width).toBeLessThanOrEqual(layoutFitted.width + 0.5)
    expect(viewport.top + viewport.height).toBeLessThanOrEqual(layoutFitted.height + 0.5)
  })

  it('maps minimap pointer drag to pan delta', () => {
    const layout = layoutBoardMinimap(
      [
        { pageId: 'a', name: 'A', x: 0, y: 0, width: 1000, height: 800, active: true },
        { pageId: 'b', name: 'B', x: 1200, y: 0, width: 1000, height: 800, active: false },
      ],
      168,
      112,
    )
    const world = boardMinimapWorldDeltaFromPointerDelta(layout.scale * 10, 0, layout)
    expect(world.worldDx).toBeCloseTo(10)
    const pan = boardMinimapPanDeltaFromWorldDelta(world.worldDx, 0, 1)
    expect(pan.dPanX).toBeCloseTo(-10)
  })
})
