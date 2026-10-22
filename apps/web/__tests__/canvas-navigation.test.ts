import { describe, expect, it } from 'vitest'
import {
  applyCanvasWheelGesture,
  clampCanvasZoom,
  fitCanvasToBounds,
  isPinchOrZoomWheel,
  wheelZoomFactor,
  zoomCanvasAboutPoint,
} from '../lib/editor/canvas-navigation'

describe('canvas navigation', () => {
  it('clamps zoom to figma-like bounds', () => {
    expect(clampCanvasZoom(0.01)).toBe(0.1)
    expect(clampCanvasZoom(8)).toBe(4)
    expect(clampCanvasZoom(1)).toBe(1)
    expect(clampCanvasZoom(Number.NaN)).toBe(1)
    expect(clampCanvasZoom(Number.POSITIVE_INFINITY)).toBe(1)
    expect(clampCanvasZoom(Number.NEGATIVE_INFINITY)).toBe(1)
  })

  it('zoomCanvasAboutPoint keeps anchor fixed', () => {
    const before = { zoom: 1, panX: 0, panY: 0, anchorX: 100, anchorY: 50 }
    const after = zoomCanvasAboutPoint({ ...before, nextZoom: 2 })
    expect(after.zoom).toBe(2)
    const worldX = (before.anchorX - before.panX) / before.zoom
    const worldY = (before.anchorY - before.panY) / before.zoom
    expect(after.panX + worldX * after.zoom).toBeCloseTo(before.anchorX)
    expect(after.panY + worldY * after.zoom).toBeCloseTo(before.anchorY)
  })

  it('zoomCanvasAboutPoint recovers from non-finite prior zoom', () => {
    const after = zoomCanvasAboutPoint({
      zoom: Number.NaN,
      panX: 0,
      panY: 0,
      nextZoom: 1.5,
      anchorX: 80,
      anchorY: 40,
    })
    expect(after.zoom).toBe(1.5)
    expect(Number.isFinite(after.panX)).toBe(true)
    expect(Number.isFinite(after.panY)).toBe(true)
  })

  it('wheel pinch zooms and plain wheel pans', () => {
    const anchor = { anchorX: 200, anchorY: 100 }
    const zoomed = applyCanvasWheelGesture({
      zoom: 1,
      panX: 0,
      panY: 0,
      deltaX: 0,
      deltaY: -10,
      deltaMode: 0,
      ctrlKey: true,
      metaKey: false,
      ...anchor,
    })
    expect(zoomed.zoom).toBeGreaterThan(1)
    expect(zoomed.panX).not.toBe(0)

    const panned = applyCanvasWheelGesture({
      zoom: 1,
      panX: 10,
      panY: 20,
      deltaX: 5,
      deltaY: 8,
      deltaMode: 0,
      ctrlKey: false,
      metaKey: false,
      ...anchor,
    })
    expect(panned.zoom).toBe(1)
    expect(panned.panX).toBe(5)
    expect(panned.panY).toBe(12)
  })

  it('detects pinch gesture modifier', () => {
    expect(isPinchOrZoomWheel({ ctrlKey: true, metaKey: false })).toBe(true)
    expect(isPinchOrZoomWheel({ ctrlKey: false, metaKey: false })).toBe(false)
    expect(wheelZoomFactor(-10)).toBeGreaterThan(1)
    expect(wheelZoomFactor(10)).toBeLessThan(1)
  })

  it('fitCanvasToBounds centers a rectangle in the viewport', () => {
    const fit = fitCanvasToBounds({
      viewportWidth: 1000,
      viewportHeight: 800,
      bounds: { x: 200, y: 100, width: 400, height: 300 },
      padding: 0,
    })
    expect(fit.zoom).toBeGreaterThan(0)
    const cx = 200 + 200
    const cy = 100 + 150
    expect(fit.panX + cx * fit.zoom).toBeCloseTo(500)
    expect(fit.panY + cy * fit.zoom).toBeCloseTo(400)
  })
})
