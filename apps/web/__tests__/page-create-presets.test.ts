import { describe, expect, it } from 'vitest'
import {
  PAGE_CREATE_PRESETS,
  buildAddPageOp,
  planApplyArtboardPresetToPage,
  resolvePageCreateInput,
} from '../lib/scene/page-create-presets'
import { EDITOR_BREAKPOINT_WIDTHS } from '../lib/scene/breakpoints'

describe('page-create-presets', () => {
  it('exposes desktop / tablet / mobile with EDITOR_BREAKPOINT_WIDTHS', () => {
    expect(PAGE_CREATE_PRESETS.map((p) => p.id)).toEqual(['desktop', 'tablet', 'mobile'])
    for (const preset of PAGE_CREATE_PRESETS) {
      expect(preset.breakpoint).toBeDefined()
      expect(preset.width).toBe(EDITOR_BREAKPOINT_WIDTHS[preset.breakpoint!])
      expect(preset.height).toBeGreaterThan(0)
    }
  })

  it('resolves preset input to breakpoint + frame size', () => {
    const resolved = resolvePageCreateInput({ mode: 'preset', presetId: 'mobile', name: ' PDP ' })
    expect(resolved).toEqual({
      name: 'PDP',
      breakpoint: 'mobile',
      frameWidth: 390,
      frameHeight: 844,
    })
  })

  it('resolves custom dims without breakpoint', () => {
    const resolved = resolvePageCreateInput({
      mode: 'custom',
      customWidth: 1200.4,
      customHeight: 800.6,
    })
    expect(resolved).toEqual({
      name: undefined,
      frameWidth: 1200,
      frameHeight: 801,
    })
  })

  it('rejects invalid custom dims', () => {
    expect(resolvePageCreateInput({ mode: 'custom', customWidth: 0, customHeight: 100 })).toEqual({
      error: 'custom-dims',
    })
  })

  it('builds add_page op for preset', () => {
    const op = buildAddPageOp({ mode: 'preset', presetId: 'tablet', name: 'Pricing' })
    expect(op).toEqual({
      op: 'add_page',
      name: 'Pricing',
      breakpoint: 'tablet',
      frameWidth: 768,
      frameHeight: 1024,
    })
  })

  it('plans frame + breakpoint ops when applying a preset to a page', () => {
    const preset = PAGE_CREATE_PRESETS.find((p) => p.id === 'mobile')!
    expect(planApplyArtboardPresetToPage('page-home', preset)).toEqual([
      { op: 'set_page_frame', pageId: 'page-home', width: 390, height: 844 },
      { op: 'set_page_breakpoint', pageId: 'page-home', breakpoint: 'mobile' },
    ])
  })
})
