import { describe, expect, it } from 'vitest'
import {
  artboardPresetsFromLeaves,
  buildArtboardValue,
  defaultArtboardPresetLeaves,
  readArtboardDigitalDraft,
} from '../lib/tokens/artboard-presets'
import { catalogToPackLeaves } from '../lib/tokens/pack-merge'
import { validateStudioLeafWrite, buildResolveCssFromLeaves } from '../lib/tokens/pack-validate'
import { pageCreatePresetsFromPack } from '../lib/scene/page-create-presets'
import { isStudioEditableType, isValidStudioTokenPath } from '../lib/inspect/digital-edit'

describe('artboard pack presets', () => {
  it('seeds desktop / tablet / mobile in catalogToPackLeaves', () => {
    const leaves = catalogToPackLeaves()
    const presets = artboardPresetsFromLeaves(leaves)
    expect(presets.map((p) => p.id).sort()).toEqual(['desktop', 'mobile', 'tablet'])
    expect(presets.find((p) => p.id === 'mobile')).toMatchObject({
      width: 390,
      height: 844,
      lane: 'mobile',
    })
  })

  it('accepts artboard as studio editable type under artboard.preset.*', () => {
    expect(isStudioEditableType('artboard')).toBe(true)
    expect(isValidStudioTokenPath('artboard.preset.iphone14', 'artboard')).toBe(true)
    expect(isValidStudioTokenPath('color.preset.x', 'artboard')).toBe(false)
  })

  it('build/read round-trip and pack-validate', () => {
    const value = buildArtboardValue({
      label: 'Wide',
      width: '1600',
      height: '900',
      lane: 'desktop',
    })
    expect(value).toBeTruthy()
    const draft = readArtboardDigitalDraft(value!)
    expect(draft).toEqual({
      label: 'Wide',
      width: '1600',
      height: '900',
      lane: 'desktop',
    })
    const leaves = defaultArtboardPresetLeaves()
    const validated = validateStudioLeafWrite({
      path: 'artboard.preset.wide',
      type: 'artboard',
      value: value!,
      resolveCss: buildResolveCssFromLeaves(leaves),
    })
    expect(validated).toEqual({ ok: true })
  })

  it('pageCreatePresetsFromPack prefers pack leaves', () => {
    const custom = {
      path: 'artboard.preset.wide',
      type: 'artboard',
      value: buildArtboardValue({
        label: 'Wide',
        width: '1600',
        height: '900',
        lane: 'desktop',
      })!,
      status: 'active',
    }
    const presets = pageCreatePresetsFromPack([...defaultArtboardPresetLeaves(), custom])
    expect(presets.some((p) => p.id === 'wide' && p.width === 1600)).toBe(true)
  })
})
