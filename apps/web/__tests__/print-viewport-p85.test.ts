import { describe, expect, it } from 'vitest'
import {
  PRINT_PRESETS,
  artboardCssSize,
  mmToCssPx,
  resolvePrintPreset,
  resolveSceneBreakpoint,
} from '../lib/scene/breakpoints'
import { resolvePageArtboardHeight } from '../lib/scene/scene-board'
import { writesToBreakpointOverride } from '../lib/scene/cascade'
import { applySceneOp } from '../lib/scene/ops'
import { createLegacyFixtureScene } from '../lib/scene/demo-scene'
import { cascadeNodeForBreakpoint } from '../lib/scene/cascade'
import { materializeSceneForMagazine } from '../lib/scene/materialize-for-magazine'
import { normalizeScene } from '../lib/scene/scene-normalize'

describe('P85 print breakpoints + presets', () => {
  it('resolves print and unknown breakpoint / preset', () => {
    expect(resolveSceneBreakpoint('print')).toBe('print')
    expect(resolveSceneBreakpoint('ultrawide')).toBe('desktop')
    expect(resolvePrintPreset('a5-landscape')).toBe('a5-landscape')
    expect(resolvePrintPreset('letter')).toBe('a4-portrait')
  })

  it('maps DIN presets to 96dpi CSS px', () => {
    expect(mmToCssPx(210)).toBe(794)
    expect(mmToCssPx(297)).toBe(1123)
    expect(PRINT_PRESETS['a4-portrait']).toMatchObject({ cssWidth: 794, cssHeight: 1123 })
    expect(PRINT_PRESETS['a4-landscape']).toMatchObject({ cssWidth: 1123, cssHeight: 794 })
    expect(PRINT_PRESETS['a5-portrait']).toMatchObject({ cssWidth: 559, cssHeight: 794 })
    expect(PRINT_PRESETS['a5-landscape']).toMatchObject({ cssWidth: 794, cssHeight: 559 })
    expect(PRINT_PRESETS['a3-portrait']).toMatchObject({
      widthMm: 297,
      heightMm: 420,
      cssWidth: mmToCssPx(297),
      cssHeight: mmToCssPx(420),
    })
    expect(PRINT_PRESETS['a6-landscape']).toMatchObject({ widthMm: 148, heightMm: 105 })
    expect(PRINT_PRESETS['letter-portrait'].widthMm).toBeCloseTo(215.9, 1)
  })

  it('slide-16-9 locks PowerPoint widescreen 1920×1080', () => {
    expect(resolvePrintPreset('slide-16-9')).toBe('slide-16-9')
    expect(PRINT_PRESETS['slide-16-9']).toMatchObject({ cssWidth: 1920, cssHeight: 1080 })
    expect(artboardCssSize('print', 'slide-16-9')).toEqual({ width: 1920, height: 1080 })
  })

  it('artboardCssSize uses fixed WxH for print and width-only for digital', () => {
    expect(artboardCssSize('print', 'a4-portrait')).toEqual({ width: 794, height: 1123 })
    expect(artboardCssSize('print', 'a5-landscape')).toEqual({ width: 794, height: 559 })
    expect(artboardCssSize('print', 'a3-portrait').width).toBe(mmToCssPx(297))
    expect(artboardCssSize('desktop')).toEqual({ width: 1440, height: null })
    expect(artboardCssSize('mobile')).toEqual({ width: 390, height: null })
    expect(artboardCssSize('tablet').width).toBe(768)
  })

  it('resolvePageArtboardHeight prefers frame.height then print preset', () => {
    const demo = createLegacyFixtureScene()
    const page = {
      id: 'page-home',
      name: 'Home',
      root: demo.root,
      frame: { x: 0, y: 0, height: 900 },
    }
    const scene = { ...demo, pages: [page], activeBreakpoint: 'desktop' as const }
    expect(resolvePageArtboardHeight(page, scene, 640)).toBe(900)
    const printScene = {
      ...demo,
      activeBreakpoint: 'print' as const,
      activePrintPreset: 'a5-portrait' as const,
      pages: [{ id: 'page-home', name: 'Home', root: demo.root, frame: { x: 0, y: 0 } }],
    }
    expect(resolvePageArtboardHeight(printScene.pages[0]!, printScene, 640)).toBe(794)
  })

  it('normalizeScene keeps print preset and drops unknown values', () => {
    const demo = createLegacyFixtureScene()
    const ok = normalizeScene({
      ...demo,
      activeBreakpoint: 'print',
      activePrintPreset: 'a5-portrait',
    })
    expect(ok?.activeBreakpoint).toBe('print')
    expect(ok?.activePrintPreset).toBe('a5-portrait')

    const bad = normalizeScene({
      ...demo,
      activeBreakpoint: 'ultrawide',
      activePrintPreset: 'letter',
    })
    expect(bad?.activeBreakpoint).toBeUndefined()
    expect(bad?.activePrintPreset).toBeUndefined()
  })

  it('inspect write on print uses set_breakpoint_override print lane', () => {
    expect(writesToBreakpointOverride('print')).toBe(true)
    const scene = createLegacyFixtureScene()
    const withBp = applySceneOp(scene, {
      op: 'set_breakpoint_override',
      nodeId: 'title',
      breakpoint: 'print',
      props: { role: 'title' },
    })
    expect(withBp.ok).toBe(true)
    if (!withBp.ok) return
    const title = withBp.scene.root.children?.find((c) => c.id === 'title')
    expect(title?.breakpoints?.print?.props?.role).toBe('title')
    expect(cascadeNodeForBreakpoint(title!, 'print').props.role).toBe('title')
    expect(cascadeNodeForBreakpoint(title!, 'desktop').props.role).toBe(title!.props?.role)
  })

  it('Mag materialize applies print lane overrides', () => {
    const scene = createLegacyFixtureScene()
    const withBp = applySceneOp(scene, {
      op: 'set_breakpoint_override',
      nodeId: 'title',
      breakpoint: 'print',
      props: { children: 'Print edited' },
    })
    expect(withBp.ok).toBe(true)
    if (!withBp.ok) return
    const printScene = { ...withBp.scene, activeBreakpoint: 'print' as const }
    const mat = materializeSceneForMagazine(printScene)
    const title = mat.root.children?.find((c) => c.id === 'title')
    expect(title?.props?.children).toBe('Print edited')
  })
})
