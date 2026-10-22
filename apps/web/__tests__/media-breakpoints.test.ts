import { describe, expect, it } from 'vitest'
import {
  buildMediaValue,
  defaultMediaBreakpointLeaves,
  formatMediaBreakpointCssVars,
  formatMediaBreakpointQueries,
  mediaBreakpointsFromLeaves,
  readMediaDigitalDraft,
} from '../lib/tokens/media-breakpoints'
import { catalogToPackLeaves } from '../lib/tokens/pack-merge'
import { formatTokenPackCss } from '../lib/tokens/pack-export'
import { validateStudioLeafWrite, buildResolveCssFromLeaves } from '../lib/tokens/pack-validate'
import { isStudioEditableType, isValidStudioTokenPath } from '../lib/inspect/digital-edit'
import { resolveDigitalEditorBreakpoint } from '../lib/scene/breakpoints'

describe('media pack breakpoints', () => {
  it('seeds mobile / tablet / desktop in catalogToPackLeaves', () => {
    const presets = mediaBreakpointsFromLeaves(catalogToPackLeaves())
    expect(presets.map((p) => p.id)).toEqual(['mobile', 'tablet', 'desktop'])
    expect(presets[0]?.minWidth).toBe(0)
    expect(presets[1]?.minWidth).toBe(768)
    expect(presets[2]?.minWidth).toBe(1440)
  })

  it('accepts media studio paths and validates writes', () => {
    expect(isStudioEditableType('media')).toBe(true)
    expect(isValidStudioTokenPath('media.breakpoint.wide', 'media')).toBe(true)
    const value = buildMediaValue({
      label: 'Wide',
      minWidth: '1600',
      lane: 'desktop',
    })
    expect(readMediaDigitalDraft(value!)).toEqual({
      label: 'Wide',
      minWidth: '1600',
      lane: 'desktop',
    })
    expect(
      validateStudioLeafWrite({
        path: 'media.breakpoint.wide',
        type: 'media',
        value: value!,
        resolveCss: buildResolveCssFromLeaves(defaultMediaBreakpointLeaves()),
      }),
    ).toEqual({ ok: true })
  })

  it('emits --zaoly-media-* in CSS pack export and query stubs', () => {
    const leaves = defaultMediaBreakpointLeaves()
    const css = formatTokenPackCss(leaves)
    expect(css).toContain('--zaoly-media-tablet: 768px;')
    expect(css).toContain('--zaoly-media-desktop: 1440px;')
    expect(formatMediaBreakpointCssVars(leaves).join('\n')).toContain('tablet')
    expect(formatMediaBreakpointQueries(leaves)).toContain('@media (min-width: 768px)')
    expect(formatMediaBreakpointQueries(leaves)).not.toContain('min-width: 0px')
  })

  it('coerces legacy print to desktop for Zaoly editor', () => {
    expect(resolveDigitalEditorBreakpoint('print')).toBe('desktop')
    expect(resolveDigitalEditorBreakpoint('tablet')).toBe('tablet')
  })
})
