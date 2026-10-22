import { describe, expect, it, vi } from 'vitest'
import type { CSSProperties } from 'react'
import type { SceneNode } from '@zaoly/contracts'
import {
  buildBoxModelBands,
  expandSpacingSides,
  hasPositiveSides,
  measureOverlaySpacing,
  resolveNodeSpacingSides,
  resolveSpacingPaintElement,
  scaleSides,
} from '../lib/editor/box-model-overlay-sides'

describe('box-model-overlay-sides', () => {
  it('expands uniform padding to four sides', () => {
    expect(expandSpacingSides({ padding: '16px' }, 'padding')).toEqual({
      top: 16,
      right: 16,
      bottom: 16,
      left: 16,
    })
  })

  it('expands block/inline axes and rem lengths', () => {
    const style: CSSProperties = {
      paddingBlock: '1rem',
      paddingInline: '8px',
    }
    expect(expandSpacingSides(style, 'padding')).toEqual({
      top: 16,
      right: 8,
      bottom: 16,
      left: 8,
    })
  })

  it('prefers physical sides over axes and uniform', () => {
    const style: CSSProperties = {
      margin: '24px',
      marginBlock: '12px',
      marginTop: '4px',
      marginRight: '6px',
    }
    expect(expandSpacingSides(style, 'margin')).toEqual({
      top: 4,
      right: 6,
      bottom: 12,
      left: 24,
    })
  })

  it('scales sides by zoom for overlay space', () => {
    expect(scaleSides({ top: 10, right: 8, bottom: 6, left: 4 }, 2)).toEqual({
      top: 20,
      right: 16,
      bottom: 12,
      left: 8,
    })
  })

  it('builds inward padding and outward margin bands', () => {
    const bands = buildBoxModelBands(
      { left: 100, top: 50, width: 200, height: 100 },
      { top: 10, right: 20, bottom: 10, left: 20 },
      { top: 8, right: 0, bottom: 0, left: 12 },
    )

    expect(bands.find((b) => b.id === 'padding-top')).toMatchObject({
      left: 100,
      top: 50,
      width: 200,
      height: 10,
    })
    expect(bands.find((b) => b.id === 'padding-left')).toMatchObject({
      left: 100,
      top: 60,
      width: 20,
      height: 80,
    })
    expect(bands.find((b) => b.id === 'margin-top')).toMatchObject({
      left: 88,
      top: 42,
      width: 212,
      height: 8,
    })
    expect(bands.find((b) => b.id === 'margin-left')).toMatchObject({
      left: 88,
      top: 50,
      width: 12,
      height: 100,
    })
    expect(bands.some((b) => b.id === 'margin-right')).toBe(false)
  })

  it('resolves spacing from node props for overlay', () => {
    const node = {
      id: 'n1',
      type: 'Stack',
      props: { padding: '12px', marginTop: '8px' },
    } as SceneNode
    const sides = resolveNodeSpacingSides(node)
    expect(hasPositiveSides(sides.padding)).toBe(true)
    expect(sides.padding.top).toBe(12)
    expect(sides.margin.top).toBe(8)
    expect(sides.margin.left).toBe(0)
  })

  it('hasPositiveSides is false for zero spacing', () => {
    expect(hasPositiveSides({ top: 0, right: 0, bottom: 0, left: 0 })).toBe(false)
  })

  it('ignores multi-value margin shorthands that would parseFloat wrong', () => {
    expect(expandSpacingSides({ margin: '16px 0' }, 'margin')).toEqual({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    })
    expect(
      expandSpacingSides({ margin: '16px 0', marginTop: '16px', marginBottom: '16px' }, 'margin'),
    ).toEqual({
      top: 16,
      right: 0,
      bottom: 16,
      left: 0,
    })
  })

  it('resolveSpacingPaintElement prefers Site Kit shell child over empty host', () => {
    const viewport = document.createElement('div')
    const host = document.createElement('div')
    host.setAttribute('data-node-id', 'inst-zaoly-landing-brand')
    host.setAttribute('data-node-type', 'SiteText')
    const text = document.createElement('p')
    text.className = 'site-text site-text--title'
    text.textContent = 'Zaoly'
    host.appendChild(text)
    viewport.appendChild(host)
    expect(resolveSpacingPaintElement(viewport, 'inst-zaoly-landing-brand')).toBe(text)
  })

  it('measureOverlaySpacing reads padding from SiteText paint child', () => {
    const viewport = document.createElement('div')
    const host = document.createElement('div')
    host.setAttribute('data-node-id', 'txt-1')
    host.setAttribute('data-node-type', 'SiteText')
    const text = document.createElement('p')
    text.className = 'site-text'
    host.appendChild(text)
    viewport.appendChild(host)
    document.body.appendChild(viewport)

    vi.spyOn(viewport, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 800,
      bottom: 600,
      width: 800,
      height: 600,
      x: 0,
      y: 0,
      toJSON: () => {},
    })
    Object.defineProperty(text, 'offsetWidth', { configurable: true, value: 200 })
    vi.spyOn(text, 'getBoundingClientRect').mockReturnValue({
      left: 40,
      top: 80,
      right: 240,
      bottom: 140,
      width: 200,
      height: 60,
      x: 40,
      y: 80,
      toJSON: () => {},
    })
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
      if (el !== text) {
        return { getPropertyValue: () => '0px' } as CSSStyleDeclaration
      }
      return {
        getPropertyValue: (prop: string) => {
          const map: Record<string, string> = {
            'padding-top': '12px',
            'padding-right': '0px',
            'padding-bottom': '12px',
            'padding-left': '0px',
            'margin-top': '8px',
            'margin-right': '0px',
            'margin-bottom': '0px',
            'margin-left': '0px',
          }
          return map[prop] ?? '0px'
        },
      } as CSSStyleDeclaration
    })

    const sides = measureOverlaySpacing(
      viewport,
      'txt-1',
      { left: 40, top: 80, width: 200, height: 60 },
      1,
    )
    expect(sides?.padding.top).toBe(12)
    expect(sides?.margin.top).toBe(8)
    expect(sides?.borderBox).toEqual({ left: 40, top: 80, width: 200, height: 60 })

    document.body.removeChild(viewport)
  })

  it('measureOverlaySpacing uses paint border box — host margin gap is not padding', () => {
    const viewport = document.createElement('div')
    const host = document.createElement('div')
    host.setAttribute('data-node-id', 'img-1')
    host.setAttribute('data-node-type', 'SiteImage')
    const img = document.createElement('img')
    img.className = 'site-img'
    host.appendChild(img)
    viewport.appendChild(host)
    document.body.appendChild(viewport)

    vi.spyOn(viewport, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 1000,
      bottom: 1000,
      width: 1000,
      height: 1000,
      x: 0,
      y: 0,
      toJSON: () => {},
    })
    // Inflated host selection (includes child margin) — must be ignored for padding.
    Object.defineProperty(img, 'offsetWidth', { configurable: true, value: 320 })
    vi.spyOn(img, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 100,
      right: 420,
      bottom: 300,
      width: 320,
      height: 200,
      x: 100,
      y: 100,
      toJSON: () => {},
    })
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (prop: string) => {
        const map: Record<string, string> = {
          'border-top-width': '0px',
          'border-right-width': '0px',
          'border-bottom-width': '0px',
          'border-left-width': '0px',
          'padding-top': '20px',
          'padding-right': '0px',
          'padding-bottom': '20px',
          'padding-left': '0px',
          'margin-top': '40px',
          'margin-right': '0px',
          'margin-bottom': '0px',
          'margin-left': '0px',
        }
        return map[prop] ?? '0px'
      },
    } as CSSStyleDeclaration)

    // Stale host-inflated selection (top 60 = paint 100 - margin 40).
    const selectionBounds = { left: 100, top: 60, width: 320, height: 240 }
    const sides = measureOverlaySpacing(viewport, 'img-1', selectionBounds, 1)
    // Padding is CSS only — not hostGap(40) + pad(20).
    expect(sides?.padding.top).toBe(20)
    expect(sides?.padding.bottom).toBe(20)
    expect(sides?.margin.top).toBe(40)
    // Bands anchor to paint border box, not inflated host selection.
    expect(sides?.borderBox).toEqual({ left: 100, top: 100, width: 320, height: 200 })

    document.body.removeChild(viewport)
  })
})
