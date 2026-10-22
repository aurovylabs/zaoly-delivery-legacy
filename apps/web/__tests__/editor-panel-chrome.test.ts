import { describe, expect, it } from 'vitest'
import {
  EDITOR_INSPECT_COLLAPSE_KEY,
  EDITOR_PANEL_CHROME_KEY,
  clampDockSize,
  clampFloatRect,
  dockPanel,
  loadInspectCollapsed,
  loadPanelChrome,
  moveFloatingPanel,
  normalizePanelChrome,
  resizeDockedPanel,
  resolveFloatSnap,
  resolveHomeSnap,
  saveInspectCollapsed,
  savePanelChrome,
  toggleMinimizeFloatingPanel,
  undockPanel,
  type EditorPanelChromeState,
} from '../lib/editor-panel-chrome'

const base: EditorPanelChromeState = {
  leftMode: 'docked',
  rightMode: 'docked',
  leftEdge: 'left',
  rightEdge: 'right',
  leftFloat: null,
  rightFloat: null,
  leftSize: 256,
  rightSize: 320,
  leftMinimized: false,
  rightMinimized: false,
}

describe('editor-panel-chrome', () => {
  it('undocks left with float rect and docks again', () => {
    const viewport = { width: 1200, height: 800 }
    let state = undockPanel(base, 'left', viewport, { x: 40, y: 60, w: 280, h: 400 })
    expect(state.leftMode).toBe('floating')
    expect(state.leftFloat?.w).toBe(280)
    state = dockPanel(state, 'left')
    expect(state.leftMode).toBe('docked')
    expect(state.leftEdge).toBe('left')
  })

  it('snaps home edge for left and right', () => {
    const viewport = { width: 1000, height: 700 }
    expect(
      resolveHomeSnap('left', { x: 10, y: 40, w: 280, h: 400 }, viewport),
    ).toBe('dock')
    expect(
      resolveHomeSnap('left', { x: 200, y: 40, w: 280, h: 400 }, viewport),
    ).toBeNull()
    expect(
      resolveHomeSnap('right', { x: 700, y: 40, w: 280, h: 400 }, viewport),
    ).toBe('dock')
  })

  it('P66: does not snap to top or bottom while floating', () => {
    const viewport = { width: 1000, height: 700 }
    expect(resolveFloatSnap('left', { x: 200, y: 8, w: 280, h: 200 }, viewport)).toBeNull()
    expect(resolveFloatSnap('right', { x: 200, y: 500, w: 280, h: 180 }, viewport)).toBeNull()
    expect(resolveFloatSnap('left', { x: 8, y: 200, w: 280, h: 200 }, viewport)).toBe('left')
  })

  it('P66: dockPanel remaps top/bottom to home edge', () => {
    let state = dockPanel(base, 'left', 'top')
    expect(state.leftMode).toBe('docked')
    expect(state.leftEdge).toBe('left')
    state = dockPanel(state, 'right', 'bottom')
    expect(state.rightEdge).toBe('right')
    state = dockPanel(state, 'left', 'right')
    expect(state.leftEdge).toBe('left')
  })

  it('P65: resizes docked panel within limits', () => {
    const viewport = { width: 1200, height: 800 }
    let state = resizeDockedPanel(base, 'left', 400, viewport)
    expect(state.leftSize).toBe(400)
    state = resizeDockedPanel(state, 'left', 40, viewport)
    expect(state.leftSize).toBeGreaterThanOrEqual(200)
    expect(clampDockSize('left', 40, viewport)).toBeGreaterThanOrEqual(200)
  })

  it('clamps float rect inside viewport and below overlay chrome', () => {
    const next = clampFloatRect(
      { x: -40, y: 0, w: 5000, h: 40 },
      { width: 800, height: 600 },
    )
    expect(next.x).toBe(0)
    expect(next.y).toBeGreaterThanOrEqual(82)
    expect(next.y).toBeLessThanOrEqual(600 - next.h)
    expect(next.w).toBeLessThanOrEqual(800)
    expect(next.h).toBeGreaterThanOrEqual(140)
  })

  it('P102: rejects float Y above overlay topbar trail clearance', () => {
    const next = clampFloatRect(
      { x: 16, y: 0, w: 256, h: 400 },
      { width: 1200, height: 800 },
    )
    expect(next.y).toBe(82)
  })

  it('moves floating panel', () => {
    const viewport = { width: 1000, height: 700 }
    let state = undockPanel(base, 'right', viewport)
    state = moveFloatingPanel(state, 'right', { x: 100, y: 82, w: 320, h: 400 }, viewport)
    expect(state.rightFloat).toEqual({ x: 100, y: 82, w: 320, h: 400 })
    expect(state.rightSize).toBe(320)
  })

  it('P64: toggles floating minimize and clears on dock', () => {
    const viewport = { width: 1000, height: 700 }
    let state = undockPanel(base, 'left', viewport)
    expect(state.leftMinimized).toBe(false)
    state = toggleMinimizeFloatingPanel(state, 'left')
    expect(state.leftMinimized).toBe(true)
    state = toggleMinimizeFloatingPanel(state, 'left')
    expect(state.leftMinimized).toBe(false)
    state = toggleMinimizeFloatingPanel(state, 'left')
    expect(state.leftMinimized).toBe(true)
    state = dockPanel(state, 'left')
    expect(state.leftMinimized).toBe(false)
    expect(toggleMinimizeFloatingPanel(state, 'left').leftMinimized).toBe(false)
  })

  it('heals floating chrome without a float rect back to docked', () => {
    sessionStorage.clear()
    sessionStorage.setItem(
      EDITOR_PANEL_CHROME_KEY,
      JSON.stringify({
        leftMode: 'docked',
        rightMode: 'floating',
        rightFloat: null,
      }),
    )
    const loaded = loadPanelChrome()
    expect(loaded.rightMode).toBe('docked')
    expect(loaded.rightEdge).toBe('right')
  })

  it('normalizePanelChrome clamps off-screen floats back into the viewport', () => {
    const state: EditorPanelChromeState = {
      ...base,
      rightMode: 'floating',
      rightFloat: { x: 5000, y: 40, w: 320, h: 400 },
    }
    const next = normalizePanelChrome(state, { width: 1200, height: 800 })
    expect(next.rightMode).toBe('floating')
    expect(next.rightFloat?.x).toBeLessThanOrEqual(1200 - 320)
    expect(next.rightFloat?.x).toBeGreaterThanOrEqual(0)
  })

  it('migrates legacy chrome without edge/size fields', () => {
    sessionStorage.clear()
    sessionStorage.setItem(
      EDITOR_PANEL_CHROME_KEY,
      JSON.stringify({
        leftMode: 'floating',
        rightMode: 'docked',
        leftFloat: { x: 20, y: 40, w: 260, h: 360 },
        rightFloat: null,
      }),
    )
    const loaded = loadPanelChrome()
    expect(loaded.leftMode).toBe('floating')
    expect(loaded.leftEdge).toBe('left')
    expect(loaded.rightEdge).toBe('right')
    expect(loaded.leftSize).toBe(256)
    expect(loaded.leftFloat?.w).toBe(260)
    expect(loaded.leftMinimized).toBe(false)
    expect(loaded.rightMinimized).toBe(false)
  })

  it('persists panel chrome and migrates legacy top edge on load', () => {
    sessionStorage.clear()
    const chrome: EditorPanelChromeState = {
      leftMode: 'floating',
      rightMode: 'docked',
      leftEdge: 'left',
      rightEdge: 'right',
      leftFloat: { x: 20, y: 40, w: 260, h: 360 },
      rightFloat: null,
      leftSize: 260,
      rightSize: 320,
      leftMinimized: true,
      rightMinimized: false,
    }
    savePanelChrome(chrome)
    expect(sessionStorage.getItem(EDITOR_PANEL_CHROME_KEY)).toBeTruthy()
    expect(loadPanelChrome().leftMode).toBe('floating')
    expect(loadPanelChrome().leftEdge).toBe('left')
    expect(loadPanelChrome().leftFloat?.w).toBe(260)
    expect(loadPanelChrome().leftMinimized).toBe(true)

    sessionStorage.setItem(
      EDITOR_PANEL_CHROME_KEY,
      JSON.stringify({
        ...chrome,
        leftMode: 'docked',
        leftFloat: null,
        leftEdge: 'top',
        leftMinimized: false,
      }),
    )
    expect(loadPanelChrome().leftEdge).toBe('left')
    expect(loadPanelChrome().leftMode).toBe('docked')

    saveInspectCollapsed({ appearance: true, typography: false })
    expect(sessionStorage.getItem(EDITOR_INSPECT_COLLAPSE_KEY)).toBeTruthy()
    expect(loadInspectCollapsed()).toEqual({ appearance: true, typography: false })
  })
})
