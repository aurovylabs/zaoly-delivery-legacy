import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { IconFontSize, IconFontWeight, IconText, IconType } from './UiIconsWave2'

describe('typography UI icons', () => {
  it('family is a single A; size scales; weight uses solid mass', () => {
    const { container: type } = render(<IconType />)
    const { container: family } = render(<IconText />)
    const { container: size } = render(<IconFontSize />)
    const { container: weight } = render(<IconFontWeight />)

    const paths = (root: HTMLElement) =>
      Array.from(root.querySelectorAll('path'))
        .map((p) => p.getAttribute('d') ?? '')
        .join('|')

    expect(paths(family)).toBe(paths(type))
    expect(paths(size)).not.toBe(paths(type))
    expect(paths(weight)).not.toBe(paths(size))
    expect(paths(weight)).not.toBe(paths(type))

    // Family: A apex + crossbar (no T bar).
    expect(paths(type)).toMatch(/8 3\.5/)
    expect(paths(type)).toMatch(/5\.05 9\.35/)

    // Size: soft baseline + two A glyphs.
    expect(size.querySelectorAll('.ds-ui-icon__stroke--soft').length).toBe(1)
    // Weight: solid thick A behind + hairline A strokes in front.
    expect(weight.querySelectorAll('.ds-ui-icon__fill--solid').length).toBe(1)
    expect(weight.querySelectorAll('.ds-ui-icon__stroke').length).toBeGreaterThanOrEqual(2)
    const weightPaths = Array.from(weight.querySelectorAll('path'))
    expect(weightPaths[0]?.classList.contains('ds-ui-icon__fill--solid')).toBe(true)
    expect(weightPaths[1]?.classList.contains('ds-ui-icon__stroke')).toBe(true)
  })
})
